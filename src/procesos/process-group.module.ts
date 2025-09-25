import { Module } from '@nestjs/common';
import { ProcessGroupsController } from './process-groups.controller';
import { ProcessGroupService } from './process-group.service';
import { FirebaseService } from '@firebase/firebase.service';
import { UserModule } from 'src/user_phone/user.module';
import { ActivitiesModule } from 'src/exercise/exercise.module';

@Module({
  imports: [UserModule , ActivitiesModule], 
  controllers: [ProcessGroupsController],
  providers: [ProcessGroupService, FirebaseService],
})
export class ProcessGroupModule {}
