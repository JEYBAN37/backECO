import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from './exercise/exercise.module';
import { DriveModule } from './drive_storage/driver.module';
import { HistoryModule } from './historial/history.module';
import { NotificationPlanModule } from './notificaciones/notification-plan.module';
import { FirebaseModule } from '@firebase/firebase.module';
import { ProcessGroupModule } from './procesos/process-group.module';
import { AdminModule } from './admin/admin.module';
import { ProcessUploadModule } from './procesos_cargados/process-upload.module';
import { UserModule } from './user_phone/user.module';
import { CategoriesModule } from './categories/category.module';
import { ExerciseHistoryModule } from './exerciseHistory/exercise-history.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MotivosModule } from './motivos/motivos.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true , envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development', }),
    FirebaseModule,
    ActivitiesModule,
    DriveModule,
    HistoryModule,
    NotificationPlanModule,
    CategoriesModule,
    ProcessGroupModule,
    ProcessUploadModule,
    AdminModule,
    ExerciseHistoryModule,
    UserModule,
    MotivosModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
