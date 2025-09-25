import { Module } from '@nestjs/common';
import { NotificationPlanService } from './notification-plan.service';
import { NotificationPlanController } from './notification-plan.controller';
import { FirebaseService } from '@firebase/firebase.service';
import { NotificationController } from './notification.controller';
import { CronJob } from 'cron';
import { NotifierService } from './notification-cron.service';
import { NotificationPauseService } from './notification-pause.service';

@Module({
  controllers: [NotificationPlanController, NotificationController],
  providers: [
    NotificationPlanService,
    FirebaseService,
    NotifierService,
    NotificationPauseService,
    {
      provide: 'CLEANUP_SCHEDULE',
      useFactory: (notificationPlanService: NotificationPlanService) => {
        // Ejecutar limpieza cada día a las 00:00
        const job = new CronJob('0 0 * * *', () => {
          notificationPlanService
            .cleanExpiredPlans()
            .catch((error) =>
              console.error('Error en limpieza programada:', error),
            );
        });
        job.start();
        return job;
      },
      inject: [NotificationPlanService],
    },
  ],
})
export class NotificationPlanModule {}
