import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as admin from 'firebase-admin';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async getPauseHistory(startDate: Date, endDate: Date) {
    try {


      this.logger.debug(
        `Buscando historial entre ${startDate.toISOString()} y ${endDate.toISOString()}`,
      );

      const db = this.firebaseService.getFirestore();
      const collectionRef = db.collection('exercisesHistory')
        .where('createdAt', '>=', startDate.toISOString().split('T')[0])
        .where('createdAt', '<=', endDate.toISOString().split('T')[0])
        .orderBy('createdAt', 'desc');
        

      // traer datos de collection y mapear para encontrar el nombre del usuario y el plan
      const snapshot = await collectionRef.get();
      const snapshotWithName = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userRef = db.collection('users').doc(data.idUsuario);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          data['userName'] = userDoc.data()?.name + ' ' + userDoc.data()?.lastName || 'Sin nombre';
        } else {
          data['userName'] = 'Usuario no encontrado';
        }
        return data;
      });

      const snapshotWithNameResolved = await Promise.all(snapshotWithName);

      const formattedData = snapshotWithNameResolved.map((data) => ({
        id: data.id,
        userId: data.idUsuario,
        userName: data.userName,
        date: data.createdAt,
        planId: data.idPlan,
        planName: data.nombre,
        duration: data.tiempo,
        completionRate:   1, // Evitar división por cero
      }));

      return formattedData;
    } catch (error) {
      this.logger.error('Error getting pause history:', error);
      throw error;
    }
  }

  async exportHistory(startDate: Date, endDate: Date) {
    try {
      const history = await this.getPauseHistory(startDate, endDate);

      // Generate CSV content
      const csvContent = this.generateCSV(history);

      // Store in Firebase Storage or generate download URL
      const fileName = `pause-history-${startDate.toISOString()}-${endDate.toISOString()}.csv`;
      const url = await this.storeExportFile(fileName, csvContent);

      return { url };
    } catch (error) {
      this.logger.error('Error exporting history:', error);
      throw error;
    }
  }

  private generateCSV(data: any[]) {
    const headers = ['Usuario', 'Fecha', 'Plan', 'Duración', 'Completado'];
    const rows = data.map((item) => [
      item.userName,
      new Date(item.date).toLocaleString(),
      item.planName,
      `${item.duration} min`,
      `${(item.completionRate * 100).toFixed(1)}%`,
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  private async storeExportFile(fileName: string, content: string) {
    // Implement file storage logic here
    // You could use Firebase Storage or other storage solution
    return `https://storage.url/${fileName}`; // Return download URL
  }
}
