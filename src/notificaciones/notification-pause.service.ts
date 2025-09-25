import { FirebaseService } from '@firebase/firebase.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationPauseService {
  private readonly logger = new Logger(NotificationPauseService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async createInterruption(interruptionDto: any) {
    const db = this.firebaseService.getFirestore();
    const now = new Date().toISOString();
    const pause = {
      idUser: interruptionDto.idUser,
      dateEnd: interruptionDto.dateEnd,
      dateStart: interruptionDto.dateStart,
      notifiActive: true,
      notifiPauseActive: true,
      frecuencia: interruptionDto.frecuencia,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('notificationPauses').add(pause);
    this.logger.log(`Interruption created with end date: ${pause.dateEnd}`);
    return pause;
  }

  async updateInterruptionByUserId(idUser: string, interruptionDto: any) {
    const db = this.firebaseService.getFirestore();
    const snapshot = await db
      .collection('notificationPauses')
      .where('idUser', '==', idUser)
      .get();

    if (snapshot.empty) {
      this.logger.warn(`No interruption found for user: ${idUser}`);
      return null;
    }

    const doc = snapshot.docs[0];
    const currentData = doc.data();

    const updatedData = {
      dateEnd: interruptionDto.dateEnd ?? currentData.dateEnd,
      dateStart: interruptionDto.dateStart ?? currentData.dateStart,
      notifiActive: interruptionDto.notifiActive ?? currentData.notifiActive,
      notifiPauseActive:
        interruptionDto.notifiPauseActive ?? currentData.notifiPauseActive,
      frecuencia: interruptionDto.frecuencia ?? currentData.frecuencia,
      updatedAt: new Date().toISOString(),
    };

    await doc.ref.update(updatedData);
    this.logger.log(`Interruption updated for user: ${idUser}`);
    return { ...currentData, ...updatedData };
  }

    async getActiveInterruptions( id : string) {
    const db = this.firebaseService.getFirestore();
    const snapshot = await db
      .collection('notificationPauses')
      .where('idUser', '==', id)
      .get();
    const interruptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    this.logger.log(`Retrieved ${interruptions.length} active interruptions.`);
    return interruptions;
  }
}
