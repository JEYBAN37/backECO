import { Module } from '@nestjs/common';
import { ExerciseHistoryController } from './exercise-history.controller';
import { ExerciseHistoryService } from './exercise-history.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
    controllers: [ExerciseHistoryController],
    providers: [ExerciseHistoryService,FirebaseService],
})
export class ExerciseHistoryModule {
}