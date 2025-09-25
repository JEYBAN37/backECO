import { FirebaseService } from '@firebase/firebase.service';
import { Injectable, Logger } from '@nestjs/common';
import { CreateMotivoRespuestaDto } from './dto/motivo.respuesta.create';

@Injectable()
export class MotivosRespuestaService {
  constructor(private readonly firebaseService: FirebaseService) {}
  private readonly logger = new Logger(MotivosRespuestaService.name);

async create(create: CreateMotivoRespuestaDto) {
    this.logger.log('Creando un nuevo motivo de respuesta');
    const db = this.firebaseService.getFirestore();
    const motivosRespuestaCollection = db.collection('motivosRespuestas');
    const now = new Date().toISOString();
    const data = {
        ...create,
        createAt: now,
        updateAt: now,
    };
    const docRef = await motivosRespuestaCollection.add(data);
    return {
        id: docRef.id,
        ...data,
    };
}

  async findMotivosRespuesta() {
    const db = this.firebaseService.getFirestore();
    const today = new Date().toISOString().split('.')[0] + 'Z';
    // Motivos
    const motivosRespuestaCollection = db
      .collection('motivosRespuestas')
      .where('createAt', '<=', today);
    const snapshot = await motivosRespuestaCollection.get();
    const motivosRespuestas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return motivosRespuestas;
  }
}
