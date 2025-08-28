import { Module } from '@nestjs/common';
import { ProcessGroupsController } from './process-groups.controller';
import { ProcessGroupService } from './process-group.service';
import { FirebaseService } from '@firebase/firebase.service';

@Module({
    controllers: [  ProcessGroupsController ],
    providers: [ProcessGroupService ,  FirebaseService],
})
export class ProcessGroupModule {}