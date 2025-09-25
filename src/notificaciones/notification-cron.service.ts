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
    await this.sendActiviesNotifications(fechaHoy, currentTime, db, now);
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
              const [h, m] = plan.time.split(':').map(Number);
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

              console.log(
                `⏰ ${planDate} Verificando notificaciones para: ${planTimeMinusOneHour} y ${planTimeMinusSixHours}`,
              );

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
                const currentHourStr = `${this.pad(now.getHours())}:${this.pad(now.getMinutes())}`; // Ej: "09:05"

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
                      currentTime === planTimeMinusOneHour ? '1 hora' : '1 hora'
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

  private async sendActiviesNotifications(
    fechaHoy: string,
    currentTime: string,
    db: FirebaseFirestore.Firestore,
    now: Date,
  ) {
    console.log(
      `⏰ Verificando actividades para: ${fechaHoy} a las ${currentTime}`,
    );
    // Obtener todas las actividades disponibles
    const snapshot = await db.collection('exercises').get();
    const actividades = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as { nombre?: string }),
    }));

    // Obtener las frecuencias programadas de notificación
    const programadosFrecuencias = await db
      .collection('notificationPauses')
      .get();

    for (const doc of programadosFrecuencias.docs) {
      const frecuenciaData = doc.data();
      const userId = frecuenciaData.idUser;
      const frecuenciaHoras = frecuenciaData.frecuencia; // frecuencia en horas (int)
      const notifiActive = frecuenciaData.notifiActive;

      if (!notifiActive || !frecuenciaHoras) continue;

      // Calcular si corresponde enviar notificación en este momento
      // Ejemplo: si frecuencia = 3, enviar cada 3 horas desde las 8:00 hasta las 23:00
      const horaInicio = 8;
      const horaFin = 23;
      const horaActual = now.getHours();

      if (horaActual < horaInicio || horaActual > horaFin) continue;

      // Verificar si la hora actual es múltiplo de la frecuencia desde la hora de inicio
      if (
        (horaActual - horaInicio) % frecuenciaHoras === 0 &&
        now.getMinutes() === 0
      ) {
        // Seleccionar una actividad aleatoria
        const actividadAleatoria =
          actividades[Math.floor(Math.random() * actividades.length)];

        // Buscar los dispositivos del usuario
        const devicesSnap = await db
          .collection('devices')
          .where('userId', '==', userId)
          .get();
        const tokens: string[] = [];
        devicesSnap.forEach((d) => {
          const device = d.data();
          if (device.deviceToken) tokens.push(device.deviceToken);
        });

        if (tokens.length === 0) continue;

        // Enviar notificación
        const message = {
          notification: {
            title: `¡Hora de moverse! 💪`,
            body: `Te sugerimos: ${actividadAleatoria?.nombre || 'una actividad'}`,
          },
          data: {
            actividadId: actividadAleatoria?.id,
          },
          tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        const successCount = response.responses.filter((r) => r.success).length;
        this.logger.log(
          `Notificación de frecuencia enviada a ${userId}: ${successCount} dispositivos`,
        );
      }
    }
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }
}
