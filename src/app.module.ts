import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from './actividades/activities.module';
import { DriveModule } from './drive_storage/driver.module';
import { HistoryModule } from './historial/history.module';
import { NotificationPlanModule } from './notificaciones/notification-plan.module';
import { PlansModule } from './planes/plans.module';
import { FirebaseModule } from '@firebase/firebase.module';
import { ProcessGroupModule } from './procesos/process-group.module';
import { AdminModule } from './admin/admin.module';
import { ProcessUploadModule } from './procesos_cargados/process-upload.module';
import { UserModule } from './user_phone/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true , envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development', }),
    FirebaseModule,
    ActivitiesModule,
    DriveModule,
    HistoryModule,
    NotificationPlanModule,
    PlansModule,
    ProcessGroupModule,
    ProcessUploadModule,
    AdminModule,
    UserModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
