import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { FirebaseService } from '@firebase/firebase.service';
import { ConfigService } from '@nestjs/config';
import { AdminAuthGuard } from './admin-auth.guard';


@Module({
  imports: [],
  controllers: [

  ],
  providers: [
    AdminService,
    FirebaseService,
    ConfigService,
    AdminAuthGuard
  ],
  exports: [AdminAuthGuard],
})
export class AdminModule { }
