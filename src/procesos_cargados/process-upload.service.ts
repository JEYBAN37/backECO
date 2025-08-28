import { Injectable, Logger, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { ProcessUploadDto } from '../dto/process-upload.dto';
import { Process } from './process.interface';
import * as admin from 'firebase-admin';

@Injectable()
export class ProcessUploadService {
  private readonly logger = new Logger(ProcessUploadService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async uploadProcess(data: ProcessUploadDto): Promise<{ id: string; [key: string]: any }> {
    const db = this.firebaseService.getFirestore();
    let batch = db.batch();
    let processRef: admin.firestore.DocumentReference | null = null;
    let collectedPlans: { id: string; [key: string]: any }[] = [];

    try {
      this.logger.log('🔄 Starting process upload...');

      // Validaciones iniciales
      if (!data.pausePlanIds?.length) {
        throw new BadRequestException('Se requiere al menos un plan de pausa');
      }

      // Verificar que los planes existan
      const plansRef = db.collection('plans');
      const planSnapshots = await db.getAll(
        ...data.pausePlanIds.map(id => plansRef.doc(id))
      );

      const invalidPlans: string[] = [];
      const validPlans: { id: string; [key: string]: any }[] = [];

      planSnapshots.forEach((doc, index) => {
        const planId = data.pausePlanIds[index];
        const planData = doc.data();

        if (doc.exists) {
          validPlans.push({
            id: planId,
            ...planData
          });
        } else {
          invalidPlans.push(planId);
          this.logger.warn(`⚠️ Plan not found: ${planId}`);
        }
      });

      // Si no hay ningún plan válido, no tiene sentido crear el proceso
      if (validPlans.length === 0) {
        const errorMessage = `Ninguno de los planes proporcionados existe. No se puede crear el proceso.`;
        this.logger.error(errorMessage);
        throw new NotFoundException(errorMessage);
      }

      // Verificar grupo
      const groupRef = db.collection('processGroups').doc(data.groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) {
        throw new NotFoundException('Grupo no encontrado');
      }

      // Crear el proceso
      const now = new Date().toISOString();
      const processData = {
        groupId: data.groupId,
        processName: data.processName,
        pausePlans: validPlans,
        startDate: data.startDate,
        createdAt: now,
        updatedAt: now,
        status: 'scheduled',
      };

      processRef = db.collection('processes').doc();
      batch.set(processRef, processData);

      // Marcar los planes como "asignados"
      for (const plan of validPlans) {
        const planRef = plansRef.doc(plan.id);
        batch.update(planRef, { status: 'assigned', updatedAt: now });
      }

      await batch.commit();
      collectedPlans = validPlans;

      this.logger.log(`✅ Process created with ID: ${processRef.id}`);
      return {
        id: processRef.id,
        ...processData,
        omittedPlans: invalidPlans.length > 0 ? invalidPlans : undefined,
      };

    } catch (error) {
      this.logger.error('❌ Error in process upload:', error);

      // Intentar revertir los cambios si es necesario
      if (collectedPlans.length > 0 || processRef) {
        await this.revertChanges(db, collectedPlans, processRef);
      }

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException({
        status: false,
        message: 'Error al crear el proceso',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async revertChanges(
    db: admin.firestore.Firestore,
    plans: { id: string; [key: string]: any }[],
    processRef: admin.firestore.DocumentReference | null
  ): Promise<void> {
    try {
      const batch = db.batch();

      // Restaurar planes
      for (const plan of plans) {
        const planRef = db.collection('plans').doc(plan.id);
        batch.set(planRef, plan);
      }

      // Eliminar proceso si fue creado
      if (processRef) {
        batch.delete(processRef);
      }

      await batch.commit();
      this.logger.log('🔄 Changes reverted successfully');
    } catch (revertError) {
      this.logger.error('❌ Error reverting changes:', revertError);
    }
  }

  async getActiveProcesses(): Promise<{
    id: string;
    name: string;
    groupId: string;
    groupName: string;
    startDate: string;
    status: string;
    plans: { id: string; [key: string]: any }[];
    createdAt: string;
    updatedAt: string;
  }[]> {
    try {
      this.logger.debug('Fetching active processes...');
      const db = this.firebaseService.getFirestore();
      
      const snapshot = await db.collection('processes').get();

      this.logger.debug(`Found ${snapshot.size} total processes`);

      const activeProcesses = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Process, 'id'>)
        }))
        .filter((process): process is Process => 
          process.status === 'active' || process.status === 'scheduled'
        );

      const processesWithGroups = await Promise.all(
        activeProcesses.map(async (process) => {
          const groupDoc = await db.collection('processGroups')
            .doc(process.groupId)
            .get();

          const groupData = groupDoc.data();

          return {
            id: process.id,
            name: process.processName,
            groupId: process.groupId,
            groupName: groupData?.name || 'Grupo no encontrado',
            startDate: process.startDate,
            status: process.status,
            plans: process.pausePlans || [],
            createdAt: process.createdAt,
            updatedAt: process.updatedAt
          };
        })
      );

      return processesWithGroups.sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    } catch (error) {
      this.logger.error('Error getting active processes:', error);
      throw error;
    }
  }

  async deactivateProcess(processId: string): Promise<void> {
    try {
      this.logger.debug(`Deactivating process ${processId}...`);
      const db = this.firebaseService.getFirestore();
      
      const processRef = db.collection('processes').doc(processId);
      const processDoc = await processRef.get();
      
      if (!processDoc.exists) {
        throw new NotFoundException('Proceso no encontrado');
      }

      const batch = db.batch();

      // Actualizar estado del proceso
      batch.update(processRef, { 
        status: 'inactive',
        updatedAt: new Date().toISOString()
      });

      // Marcar los planes como "disponibles"
      const process = processDoc.data() as { pausePlans: { id: string; [key: string]: any }[] };
      if (process?.pausePlans) {
        for (const plan of process.pausePlans) {
          const planRef = db.collection('plans').doc(plan.id);
          batch.update(planRef, { status: 'available', updatedAt: new Date().toISOString() });
        }
      }

      await batch.commit();
      this.logger.debug('✅ Process deactivated successfully');
    } catch (error) {
      this.logger.error('Error deactivating process:', error);
      throw error;
    }
  }

  async assignProcess(processId: string, userId: string) {
    try {
      const db = this.firebaseService.getFirestore();
      
      const processDoc = await db.collection('processes').doc(processId).get();
      if (!processDoc.exists) {
        this.logger.error(`Process ${processId} not found`);
        throw new NotFoundException('Process not found');
      }

      const processData = processDoc.data();
      if (!processData) {
        this.logger.error(`Process ${processId} data is empty`);
        throw new Error('Process data is empty');
      }

      this.logger.debug(`
📝 [ProcessUpload] Assigning Process:
- Process ID: ${processId}
- User ID: ${userId}
- Process Name: ${processData.processName}
- Plans Count: ${processData.pausePlans?.length || 0}
- Start Date: ${processData.startDate}`);

      // Validaciones adicionales
      if (!processData.pausePlans || !Array.isArray(processData.pausePlans)) {
        this.logger.error('Process has no valid pause plans');
        throw new Error('Invalid process structure');
      }

      await db
        .collection('users')
        .doc(userId)
        .collection('assignedProcesses')
        .doc(processId)
        .set({
          ...processData,
          assignedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active',
          startDate: new Date().toISOString(),
          progress: 0
        });

      this.logger.log(`✅ Process successfully assigned`);
      return true;
    } catch (error) {
      this.logger.error('❌ Error assigning process:', error);
      throw error;
    }
  }
}
