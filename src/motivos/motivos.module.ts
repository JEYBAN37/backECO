import { Module } from '@nestjs/common';
import { MotivosController } from './motivos.controller';
import { MotivosService } from './motivos.service';
import { FirebaseService } from '@firebase/firebase.service';
import { MotivosRespuestaService } from './motivos.respuesta.service';

@Module({
  imports: [],
  controllers: [MotivosController],
  providers: [MotivosService,FirebaseService,MotivosRespuestaService],
  exports: [],
})
export class MotivosModule {}
