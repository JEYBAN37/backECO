import { Module } from '@nestjs/common';
import { CategoriesController } from './category.controller';
import { CategoryService } from './category.service';
import { FirebaseService } from '@firebase/firebase.service';

@Module({
    controllers: [CategoriesController],
    providers: [CategoryService, FirebaseService ]
})
export class CategoriesModule {}