import { Module } from '@nestjs/common';
import { DriveService } from './drive.service';
import { DriveController } from './drive.controller';
import { ConfigService } from '@nestjs/config';

@Module({
    controllers: [DriveController],
    providers: [DriveService, ConfigService],
    exports: [DriveService],
})
export class DriveModule {}