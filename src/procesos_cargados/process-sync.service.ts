import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as admin from 'firebase-admin';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async syncProcessToUsers(processId: string, groupId: string) {
    try {
      const db = this.firebaseService.getFirestore();
      
      // 1. Obtener el proceso
      const processDoc = await db.collection('processes').doc(processId).get();
      if (!processDoc.exists) {
        throw new Error('Process not found');
      }
      
      // 2. Obtener el grupo y sus miembros
      const groupDoc = await db.collection('processGroups').doc(groupId).get();
      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }
      
      const groupData = groupDoc.data();
      this.logger.log(`Group Data: ${JSON.stringify(groupData)}`);
      const members = groupData?.members || [];
      
      // 3. Sincronizar con cada usuario del grupo
      const batch = db.batch();
      for (const member of members) {
        const userProcessRef = db
          .collection('users')
          .doc(member.toString())
          .collection('assignedProcesses')
          .doc(processId);
          
        batch.set(userProcessRef, {
          ...processDoc.data(),
          assignedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending',
          progress: 0,
        });
      }
      
      await batch.commit();
      
      this.logger.log(`Process ${processId} synced to ${members.length} users`);
      return true;
    } catch (error) {
      this.logger.error('Error syncing process:', error);
      throw error;
    }
  }

  async updateUserProcessStatus(userId: string, processId: string, status: string, progress: number) {
    try {
      const db = this.firebaseService.getFirestore();
      const userProcessRef = db
        .collection('users')
        .doc(userId)
        .collection('assignedProcesses')
        .doc(processId);

      await userProcessRef.update({
        status,
        progress,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return true;
    } catch (error) {
      this.logger.error('Error updating user process status:', error);
      throw error;
    }
  }

  async getUserAssignedProcesses(userId: string) {
    try {
      const db = this.firebaseService.getFirestore();
      const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('assignedProcesses')
        .orderBy('assignedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      this.logger.error('Error getting user processes:', error);
      throw error;
    }
  }

  async getUserTodayActivities(userId: string) {
    try {
      const db = this.firebaseService.getFirestore();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      this.logger.debug(`
🔍 [SyncService] Detailed Query Info:
- User ID: ${userId}
- Date: ${today.toISOString()}
- Collection: users/${userId}/assignedProcesses
- Query: status IN ['active', 'scheduled']`);

      // 1. Verificar que el usuario existe y tiene procesos asignados
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        this.logger.warn(`⚠️ [SyncService] User ${userId} not found in database`);
        return [];
      }

      // 2. Obtener procesos asignados
      const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('assignedProcesses')
        .where('status', 'in', ['active', 'scheduled'])
        .get();

      this.logger.debug(`📊 [SyncService] Query Results:
- Total documents found: ${snapshot.size}
- Has documents: ${!snapshot.empty}
- Path: users/${userId}/assignedProcesses`);

      if (snapshot.empty) {
        this.logger.debug('ℹ️ [SyncService] No active processes found');
        return [];
      }

      // 3. Procesar los documentos encontrados
      const activities = [];
      for (const doc of snapshot.docs) {
        const process = doc.data();
        this.logger.debug(`
📄 [SyncService] Processing Process:
- ID: ${doc.id}
- Name: ${process.processName}
- Status: ${process.status}
- Start Date: ${process.startDate}
- Plans Count: ${process.pausePlans?.length || 0}`);

        if (process.pausePlans && Array.isArray(process.pausePlans)) {
          for (const plan of process.pausePlans) {
            // Convertir las fechas a objetos Date
            const processStartDate = new Date(process.startDate);
            processStartDate.setHours(0, 0, 0, 0);

            const processEndDate = process.endDate ? new Date(process.endDate) : null;
            if (processEndDate) {
              processEndDate.setHours(23, 59, 59, 999);
            }

            this.logger.debug(`Checking dates:
              Process Start: ${processStartDate.toISOString()}
              Process End: ${processEndDate?.toISOString() || 'No end date'}
              Today: ${today.toISOString()}
            `);

            if (processStartDate <= today && (!processEndDate || processEndDate >= today)) {
              this.logger.debug(`✅ Adding plan ${plan.id} to activities`);
              activities.push({
                id: plan.id,
                title: plan.name,
                category: plan.category || 'General',
                color: plan.color || '0xFF0067AC',
                assignedForToday: true,
                instructions: plan.instructions || [],
                duration: plan.maxTime || 300,
                type: plan.type || 'basic',
                startDate: process.startDate,
                processId: doc.id,
              });
            }
          }
        }
      }

      this.logger.debug(`📤 Returning ${activities.length} activities`);
      return activities;
    } catch (error) {
      this.logger.error('❌ [SyncService] Error getting activities:', error);
      throw error;
    }
  }
}
