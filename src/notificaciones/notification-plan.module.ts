import { Module } from '@nestjs/common';
import { NotificationPlanService } from './notification-plan.service';
import { NotificationPlanController } from './notification-plan.controller';
import { FirebaseService } from '@firebase/firebase.service';
import { NotificationController } from './notification.controller';

@Module({
    controllers: [NotificationPlanController, NotificationController],
    providers: [NotificationPlanService, FirebaseService],
})
export class NotificationPlanModule {}