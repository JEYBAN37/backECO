import { Module } from '@nestjs/common';
import { ProcessUploadController } from './process-upload.controller';
import { ProcessUploadService } from './process-upload.service';
import { SyncService } from './process-sync.service';
import { FirebaseService } from '@firebase/firebase.service';

@Module({
    controllers: [ProcessUploadController],
    providers: [ProcessUploadService, SyncService, FirebaseService],
    exports: [SyncService],
})
export class ProcessUploadModule {}