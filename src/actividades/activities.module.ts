import { Module } from '@nestjs/common';
import { DriveService } from 'src/drive_storage/drive.service';
import { FirebaseService } from '@firebase/firebase.service';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
    imports: [],
    controllers: [ActivitiesController],
    providers: [ActivitiesService, DriveService, FirebaseService],
})
export class ActivitiesModule {}
