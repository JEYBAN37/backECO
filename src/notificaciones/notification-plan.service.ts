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
}
