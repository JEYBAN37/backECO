import * as admin from 'firebase-admin';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotifierService {
  constructor(private readonly configService: ConfigService) {
    if (!admin.apps.length) {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );
      let privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('❌ Faltan variables de entorno para Firebase');
      }

      privateKey = privateKey.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
  }
  private readonly logger = new Logger(NotifierService.name);

  @Cron('* * * * *', {
    timeZone: 'America/Bogota', // ajusta a tu zona
  })
  async handleDailyNotifications() {
    const db = admin.firestore();
    this.logger.debug('📅 Ejecutando notificaciones del día...');
    const now = new Date();
    console.log('⏰ Cron cada 5 segundos:', new Date().toISOString());
    // Fecha de hoy en formato YYYY-MM-DD
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const fechaHoy = `${yyyy}-${mm}-${dd}T00:00:00.000`;

    // Hora actual en formato HH:mm
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`;

    await this.sendNotification(fechaHoy, currentTime, db, now);
  }

  private async sendNotification(
    fechaHoy: string,
    currentTime: string,
    db: FirebaseFirestore.Firestore,
    now: Date,
  ) {
    console.log(`⏰ Verificando planes para: ${fechaHoy} a las ${currentTime}`);

    const snapshot = await db
      .collection('notificationPlans')
      .where('isActive', '==', true)
      .where('startDate', '<=', fechaHoy)
      .where('endDate', '>=', fechaHoy)
      .get();

    let planesToDesactivar: string[] = [];

    for (const doc of snapshot.docs) {
      const plan = doc.data();
      const planId = doc.id;
      const cronograma = plan.assignedPlans || [];

      let tokens: string[] = [];

      for (const fecha in cronograma) {
        if (cronograma.hasOwnProperty(fecha)) {
          const planes = cronograma[fecha];
          for (const p of planes) {
            if (fecha === fechaHoy) {
              // ----  calcular una hora antes ----
              const [h, m] = p.time.split(':').map(Number);
              const planDate = new Date();
              planDate.setHours(h, m, 0, 0);
              planDate.setHours(planDate.getHours() - 1); // restar 1 hora

              const planTimeMinusOneHour = `${String(
                planDate.getHours(),
              ).padStart(
                2,
                '0',
              )}:${String(planDate.getMinutes()).padStart(2, '0')}`;

              // Si la hora actual coincide con la hora - 1h → enviar
              // Si la hora actual coincide con la hora - 1h o la hora - 6h → enviar
              const planDateMinusSixHours = new Date(planDate);
              planDateMinusSixHours.setHours(
                planDateMinusSixHours.getHours() - 5,
              ); // ya restamos 1h antes, restar 5h más

              const planTimeMinusSixHours = `${String(
                planDateMinusSixHours.getHours(),
              ).padStart(
                2,
                '0',
              )}:${String(planDateMinusSixHours.getMinutes()).padStart(2, '0')}`;

              if (
                currentTime === planTimeMinusOneHour ||
                currentTime === planTimeMinusSixHours
              ) {
                console.log(
                  `🚀 Ejecutando plan ${p.id}: notificación ${
                    currentTime === planTimeMinusOneHour ? '1h' : '6h'
                  } antes (${p.time})`,
                );

                // Buscar usuarios del grupo
                let usersSnap = await db
                  .collection('users')
                  .where('groupId', '==', p.group)
                  .get();

                const userRefs = usersSnap.docs.map((d) => d.id);

                // Filtrar usuarios que tienen pausas activas hoy entre las 8:00 y las 23:00
                now.setHours(0, 0, 0, 0);

                const currentHourStr = `${this.pad(now.getHours())}:${this.pad(now.getMinutes())}`; // Ej: "09:05"
                now.setHours(0, 0, 0, 0);

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
                  console.log(`⚠️ Plan ${p.id} no tiene tokens para enviar`);
                  continue;
                }

                const message = {
                  notification: {
                    title: `Próxima actividad: ${p.name} 🏋️‍♂️`,
                    body: `⏰ En ${
                      currentTime === planTimeMinusOneHour
                        ? '1 hora'
                        : '6 horas'
                    } tienes ${p.name} (${p.time}) `,
                  },
                  data: {
                    customKey: '',
                  },
                  tokens,
                };

                planesToDesactivar.push(p.id);

                const response = await admin
                  .messaging()
                  .sendEachForMulticast(message);
                const successCount = response.responses.filter(
                  (r) => r.success,
                ).length;
                console.log(`✅ Plan ${p.id}: enviados ${successCount}`);
              }
            }
          }
        }
      }

      // Desactivar planes vencidos
      if (plan.endDate === fechaHoy) {
        await db.collection('notificationPlans').doc(planId).update({
          isActive: false,
        });

        console.log(`Desactivando planes: ${planesToDesactivar.join(', ')}`);
        for (const id of planesToDesactivar) {
          await db.collection('plans').doc(id).update({
            estado: false,
          });
          console.log(`❌ Plan ${id} desactivado (ya venció)`);
        }
      }
    }
  }
  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }
}
