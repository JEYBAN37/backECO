import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserActivitiesController } from './activities.controller';
import { SyncService } from 'src/procesos_cargados/process-sync.service';
import { UserService } from './user.service';
import { FirebaseModule } from '@firebase/firebase.module';


@Module({
  imports: [FirebaseModule],
  controllers: [UserController, UserActivitiesController],
  providers: [UserService, SyncService],
})
export class UserModule {}
