import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateExerciseHistoryDto } from './dto/create-exercise-history.dto';
import { GetExerciseHistoryDto } from './dto/get-exercise-history.dto';

@Injectable()
export class ExerciseHistoryService {
  constructor(private readonly firebaseService: FirebaseService) {}
  // Add your service methods here
  private readonly logger = new Logger(ExerciseHistoryService.name);

  // Example: Fetch exercise history for a user
  async getHistoryByUser(params: GetExerciseHistoryDto) {
    this.logger.log('Fetching exercise history for user:', params.userId);
    this.logger.log('Fetching exercise history for plan:', params.plan);
    this.logger.log('Fetching exercise history for group:', params.grupo);
    const db = this.firebaseService.getFirestore();
    const snapshot = await db
      .collection('exercisesHistory')
      .where('idUsuario', '==', params.userId)
      .where('idPlan', '==', params.plan)
      .where('idGrupo', '==', params.grupo)
      .where('createdAt', '==', new Date().toISOString().split('T')[0]) // Filter by today's date (YYYY-MM-DD format)
      .get();

    if (snapshot.empty) {
      this.logger.warn(`No exercise history found for user ${params.userId}`);
      return [];
    }

    const exercises = snapshot.docs.map((doc) => {
      return doc.data().idEjercicio;
    });

    if (exercises.length === 0) {
      return [];
    }

    this.logger.log(
      `Found ${exercises.length} exercises for user ${params.userId}`,
    );

    return exercises;
  }

  // Example: Add a new exercise history record
  async createHistory(history: CreateExerciseHistoryDto) {
    try {
      const db = this.firebaseService.getFirestore();
      history.createdAt = new Date().toISOString().split('T')[0]; // Store as 'YYYY-MM-DD'
      // Save the history record to Firestore
      this.logger.log('Creating exercise history:', history);
      await db.collection('exercisesHistory').add(history);
    } catch (error) {
      throw new Error('Error creating exercise history: ' + error);
    }
    return { success: true };
  }

  async getAllExercises(user: string, startDate: string, endDate: string) {
    try {
      const snapshot = await this.getExerciseGeneric(user, startDate, endDate);

      // Agrupar solo por día
      const groupedByDay: Record<string, number> = {};

      snapshot.docs?.forEach((doc: any) => {
        const fecha = doc.data().createdAt;
        if (!groupedByDay[fecha]) {
          groupedByDay[fecha] = 0;
        }
        groupedByDay[fecha] += 1;
      });

      // Agrupar solo por categoria
      const groupedByCategory: Record<string, number> = {};

      snapshot.docs?.forEach((doc: any) => {
        const categoria = doc.data().categoria;
        if (!groupedByCategory[categoria]) {
          groupedByCategory[categoria] = 0;
        }
        groupedByCategory[categoria] += 1;
      });

      const totalActivities = snapshot.size;

      return { groupedByDay, groupedByCategory, totalActivities };
    } catch (error) {
      this.logger.error('Error fetching exercises:', error);
      throw new Error('Error fetching exercises: ' + error);
    }
  }
async getHistoryByUserToday(userId: string) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 4); // 5 days including today
  startDate.setHours(0, 0, 0, 0);

  const snapshot = await this.getExerciseGeneric(
    userId,
    startDate.toISOString(),
    endDate.toISOString(),
  );
  return Promise.all(
    snapshot.docs.map(async (doc) => {
      return {
        nombre: doc.data().nombre,
        categoria: doc.data().categoria,
        tiempo: doc.data().tiempo,
        finalizacion: doc.data().createdAt,
        plan: await this.getNamePlant(doc.data().idPlan) || 'Sin plan',
      };
    })
  );
}

  private async getNamePlant(plan: string) {
    const db = this.firebaseService.getFirestore();
    const snapshot = await db
      .collection('plans')
      .doc(plan)
      .get();

    if (!snapshot.exists) {
      this.logger.warn(`No plan found for ID: ${plan}`);
      return null;
    }

    this.logger.log(`Plan found for ID: ${plan}`);

    const planData = snapshot.data();
    return planData?.nombre ?? null;
  }

  private async getExerciseGeneric(
    user: string,
    startDate: string,
    endDate: string,
  ) {
    this.logger.log(
      `Fetching all exercises for user: ${user} between ${startDate} and ${endDate}`,
    );
    const db = this.firebaseService.getFirestore();
    const snapshot = await db
      .collection('exercisesHistory')
      .where('idUsuario', '==', user)
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot;
  }
}
