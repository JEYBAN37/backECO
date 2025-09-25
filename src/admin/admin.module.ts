import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { FirebaseService } from '@firebase/firebase.service';
import { ConfigService } from '@nestjs/config';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminController } from './admin.controller';
import { UserModule } from 'src/user_phone/user.module';

@Module({
  imports: [UserModule],
  controllers: [AdminController],
  providers: [AdminService, FirebaseService, ConfigService, AdminAuthGuard],
  exports: [AdminAuthGuard],
})
export class AdminModule {}
