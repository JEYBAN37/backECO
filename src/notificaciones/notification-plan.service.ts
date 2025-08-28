import { FirebaseService } from '@firebase/firebase.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationPlanDto } from 'src/processes/admin/dto/notification-plan.dto';


@Injectable()
export class NotificationPlanService {
  private readonly logger = new Logger(NotificationPlanService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async createNotificationPlan(planDto: NotificationPlanDto) {
    try {
      const db = this.firebaseService.getFirestore();
      
      // Preparar datos para guardar
      const now = new Date().toISOString();
      const planData = {
        ...planDto,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      };

      // Guardar en Firebase
      const docRef = await db.collection('notificationPlans').add(planData);
      
      this.logger.log(`Notification plan created with ID: ${docRef.id}`);
      
      return {
        id: docRef.id,
        ...planData
      };
    } catch (error) {
      this.logger.error('Error creating notification plan:', error);
      throw error;
    }
  }

  async getNotificationPlans() {
    try {
      const db = this.firebaseService.getFirestore();
      const snapshot = await db.collection('notificationPlans')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      this.logger.error('Error getting notification plans:', error);
      throw error;
    }
  }

  async updatePlanStatus(id: string, isActive: boolean) {
    try {
      const db = this.firebaseService.getFirestore();
      const planRef = db.collection('notificationPlans').doc(id);

      // Verificar que el plan existe
      const doc = await planRef.get();
      if (!doc.exists) {
        throw new NotFoundException('Plan no encontrado');
      }

      // Actualizar estado
      const now = new Date().toISOString();
      await planRef.update({
        isActive,
        updatedAt: now
      });

      return {
        id,
        ...doc.data(),
        isActive,
        updatedAt: now
      };
    } catch (error) {
      this.logger.error('Error updating plan status:', error);
      throw error;
    }
  }

  async deleteNotificationPlan(id: string) {
    try {
      const db = this.firebaseService.getFirestore();
      const planRef = db.collection('notificationPlans').doc(id);

      // Verificar que el plan existe
      const doc = await planRef.get();
      if (!doc.exists) {
        throw new NotFoundException('Plan no encontrado');
      }

      // Eliminar el plan
      await planRef.delete();

      this.logger.log(`Notification plan deleted: ${id}`);
    } catch (error) {
      this.logger.error('Error deleting notification plan:', error);
      throw error;
    }
  }

  async cleanExpiredPlans(): Promise<void> {
    try {
      const db = this.firebaseService.getFirestore();
      const now = new Date();

      // Obtener todos los planes
      const snapshot = await db.collection('notificationPlans').get();
      const batch = db.batch();
      let deletedCount = 0;

      for (const doc of snapshot.docs) {
        const plan = doc.data();
        const endDate = new Date(plan.endDate);

        // Si la fecha final ya pasó, eliminar el plan
        if (endDate < now) {
          batch.delete(doc.ref);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        await batch.commit();
        this.logger.log(`✅ ${deletedCount} planes expirados eliminados`);
      }
    } catch (error) {
      this.logger.error('❌ Error limpiando planes expirados:', error);
      throw error;
    }
  }
}
