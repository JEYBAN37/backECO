import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { FirebaseService } from '@firebase/firebase.service';

@Module({
    controllers: [HistoryController],
    providers: [HistoryService,FirebaseService],
    exports: [],
})
export class HistoryModule {}