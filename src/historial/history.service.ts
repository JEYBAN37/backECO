import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as admin from 'firebase-admin';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async getPauseHistory(startDate: Date, endDate: Date) {
    try {
      this.logger.debug(`Buscando historial entre ${startDate.toISOString()} y ${endDate.toISOString()}`);
      
      const db = this.firebaseService.getFirestore();
      const pausesRef = db.collection('pauseHistory');
      
      // Convertir fechas a Timestamp de Firestore
      const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
      const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);
      
      const snapshot = await pausesRef
        .where('date', '>=', startTimestamp)
        .where('date', '<=', endTimestamp)
        .orderBy('date', 'desc')
        .get();

      this.logger.debug(`Encontrados ${snapshot.size} registros`);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate().toISOString()
      }));
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
    const rows = data.map(item => [
      item.userName,
      new Date(item.date).toLocaleString(),
      item.planName,
      `${item.duration} min`,
      `${(item.completionRate * 100).toFixed(1)}%`
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }

  private async storeExportFile(fileName: string, content: string) {
    // Implement file storage logic here
    // You could use Firebase Storage or other storage solution
    return `https://storage.url/${fileName}`; // Return download URL
  }
}
