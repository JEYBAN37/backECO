import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from './actividades/activities.module';
import { DriveModule } from './drive_storage/driver.module';
import { HistoryModule } from './historial/history.module';
import { NotificationPlanModule } from './notificaciones/notification-plan.module';
import { PlansModule } from './planes/plans.module';
import { FirebaseModule } from '@firebase/firebase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseModule,
    ActivitiesModule,
    DriveModule,
    HistoryModule,
    NotificationPlanModule,
    PlansModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
