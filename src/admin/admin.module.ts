import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { FirebaseService } from '@firebase/firebase.service';
import { ConfigService } from '@nestjs/config';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminController } from './admin.controller';

@Module({
  imports: [],
  controllers: [AdminController],
  providers: [AdminService, FirebaseService, ConfigService, AdminAuthGuard],
  exports: [AdminAuthGuard],
})
export class AdminModule {}
