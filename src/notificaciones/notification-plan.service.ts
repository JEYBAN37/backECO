import { FirebaseService } from '@firebase/firebase.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationPlanDto } from 'src/dto/notification-plan.dto';
import * as admin from 'firebase-admin';
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

      // extare los planes asignados
      let assignedPlans = planDto.assignedPlans || {};
      for (const fecha in assignedPlans) {
        if (assignedPlans.hasOwnProperty(fecha)) {
          const planes = assignedPlans[fecha];
          for (const plan of planes) {
            await db.collection('plans').doc(plan.id).update({
              estado: true,
              fechaFin: planDto.endDate,
            });
          }
        }
      }

      // Guardar en Firebase
      const docRef = await db.collection('notificationPlans').add(planData);

      this.logger.log(`Notification plan created with ID: ${docRef.id}`);

      return {
        id: docRef.id,
        ...planData,
      };
    } catch (error) {
      this.logger.error('Error creating notification plan:', error);
      throw error;
    }
  }

  async getNotificationPlans() {
    try {
      const db = this.firebaseService.getFirestore();
      const snapshot = await db
        .collection('notificationPlans')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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
        updatedAt: now,
      });

      let cronograma = doc.data()?.assignedPlans || {};
      let plans = [];

      for (const fecha in cronograma) {
        if (cronograma.hasOwnProperty(fecha)) {
          const planes = cronograma[fecha];
          for (const plan of planes) {
            await db.collection('plans').doc(plan.id).update({
              estado: isActive,
            });
          }
        }
      }

      return {
        id,
        ...doc.data(),
        isActive,
        updatedAt: now,
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

  async getActivePlansByGroup() {
    credential: admin.credential.applicationDefault();
    const db = this.firebaseService.getFirestore();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const fechaHoy = `${yyyy}-${mm}-${dd}T00:00:00.000`;

    console.log('📅 Ejecutando notificaciones del día:', fechaHoy);

    // 1. Buscar planes activos en la colección "notificationPlans"
    const snapshot = await db
      .collection('notificationPlans')
      .where('isActive', '==', true)
      .where('startDate', '<=', fechaHoy)
      .where('endDate', '>=', fechaHoy)
      .get();

    let planesToDesactivar = [];

    for (const doc of snapshot.docs) {
      const plan = doc.data();
      const planId = doc.id;
      const cronograma = plan.assignedPlans || [];

      let tokens: string[] = [];

      // Recorrer todas las fechas y sus planes
      for (const fecha in cronograma) {
        if (cronograma.hasOwnProperty(fecha)) {
          const planes = cronograma[fecha];
          for (const plan of planes) {
            // Si la fecha del plan es hoy, procesarlo
            if (fecha === fechaHoy) {
              // 2. Buscar usuarios del grupo (colección users)
              let usersSnap = await db
                .collection('users')
                .where('groupId', '==', plan.group)
                .get();

              // Obtener el id de referencia de cada documento
              const userRefs = usersSnap.docs.map((doc) => doc.id);

              // Filtrar usuarios que tienen pausas activas hoy entre las 8:00 y las 23:00
              const startHour = 8;
              const endHour = 23;
              const today = new Date();
              const currentHourStr = `${this.pad(today.getHours())}:${this.pad(today.getMinutes())}`; // Ej: "09:05"
              today.setHours(0, 0, 0, 0);

              const userPauseSnap = await db
                .collection('notificationPauses')
                .where('idUser', 'in', userRefs)
                .where('notifiActive', '==', true)
                .where('dateStart', '<=', currentHourStr) // <=
                .where('dateEnd', '>=', currentHourStr) // >=
                .get();

              // Solo considerar usuarios que tienen pausas activas en el rango horario actual
              let usersDisponibles = userPauseSnap.docs.map(
                (doc) => doc.data().idUser,
              );

              this.logger.log(
                `Found ${userPauseSnap.docs.length} active pauses for users.`,
              );

              for (const userId of usersDisponibles) {
                // 3. Obtener tokens de dispositivos del usuario
                const devicesSnap = await db
                  .collection('devices')
                  .where('userId', '==', userId)
                  .get();

                devicesSnap.forEach((d) => {
                  const device = d.data();
                  if (device.deviceToken) tokens.push(device.deviceToken);
                });
              }

              if (tokens.length === 0) {
                console.log(`⚠️ Plan ${plan.id} no tiene tokens para enviar`);
                continue;
              }

              // 4. Enviar notificación
              const message = {
                notification: {
                  title: plan.time || 'Recordatorio',
                  body:
                    'Es hora de tu ' +
                    plan.name +
                    ' programado para tu rutina 🏋️‍♂️',
                },
                data: {
                  customKey: '', // Puedes agregar datos personalizados aquí
                },
                tokens,
              };

              planesToDesactivar.push(plan.id);

              const response = await admin
                .messaging()
                .sendEachForMulticast(message);
              const successCount = response.responses.filter(
                (r) => r.success,
              ).length;
              console.log(`✅ Plan ${plan.id}: enviados ${successCount}`);
            }
            console.log(`Fecha: ${fecha}, Plan: ${JSON.stringify(plan)}`);
            // Aquí puedes hacer lo que necesites con cada plan
          }
        }
      }

      this.logger.log(
        `Sending notifications for plan ${JSON.stringify(plan.id)} to ${tokens.length} devices.`,
      );

      // 5. Si el plan ya venció hoy, lo desactivamos

      if (plan.endDate === '2025-09-24T00:00:00.000') {
        this.logger.log(
          `Verificando si el plan ${plan.endDate} debe desactivarse...`,
        );
        await db.collection('notificationPlans').doc(planId).update({
          isActive: false,
        });

        // Desactivar todos los planes en planesToDesactivar
        console.log(`Desactivando planes: ${planesToDesactivar.join(', ')}`);
        for (const id of planesToDesactivar) {
          console.log(`❌ Plan ${id} desactivado (ya venció)`);
          await db.collection('plans').doc(id).update({
            estado: false,
          });
        }
      }
    }
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }
}
