import { Module } from '@nestjs/common';
import { DriveService } from 'src/drive_storage/drive.service';
import { FirebaseService } from '@firebase/firebase.service';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';

@Module({
    imports: [],
    controllers: [ExerciseController],
    providers: [ExerciseService, DriveService, FirebaseService],
    exports: [ExerciseService],
})
export class ActivitiesModule {}
