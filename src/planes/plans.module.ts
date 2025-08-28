import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { FirebaseService } from '@firebase/firebase.service';

@Module({
    controllers: [PlansController],
    providers: [PlansService, FirebaseService ]
})
export class PlansModule {}