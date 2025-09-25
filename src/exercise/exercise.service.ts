import { FirebaseService } from '@firebase/firebase.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { DriveService } from 'src/drive_storage/drive.service';
import { CreateExerciseDto } from 'src/exercise/dto/create-exercise.dto';
import { Exercise } from './dto/exercise.dto';
import e from 'express';
import { UpdateExerciseDto } from './dto/exercise.update.dto';

@Injectable()
export class ExerciseService {
   private readonly logger = new Logger(ExerciseService.name);
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly driveService: DriveService,
  ) {}

  async createExercise(exercise: CreateExerciseDto): Promise<Exercise> {
    try {
      // 3️⃣ Extraer ID del archivo de Google Drive
      const driveFileId = this.driveService.extractFileId(exercise.videoUrl);

      if (!driveFileId) {
        throw new HttpException(
          {
            status: false,
            message: 'Invalid video URL',
            error: 'INVALID_VIDEO_URL',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      // 4️⃣ Preparar datos finales de la actividad
      const now: string = new Date().toISOString();

      const dataSentToFirebase: Exercise = {
        ...exercise,
        createdAt: exercise.createdAt || now,
        updatedAt: now,
      };
      const db = this.firebaseService.getFirestore();

      // 5️⃣ Guardar en Firestore
      const ExerciseRef = await db.collection('exercises').add({...dataSentToFirebase});

      return {
        id: ExerciseRef.id,
        ...dataSentToFirebase,
      } as Exercise;
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error creando actividad',
          error: 'ACTIVITY_CREATE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteExercise(exerciseId: string): Promise<void> {
    const db = this.firebaseService.getFirestore();
    const exerciseRef = db.collection('exercises').doc(exerciseId);

    const doc = await exerciseRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Ejercicio no encontrado');
    }

    await exerciseRef.delete();
  }

  async getExercises(): Promise<Exercise[]> {
    try {
      const db = this.firebaseService.getFirestore();
      const snapshot = await db.collection('exercises').get();

      return snapshot.docs.map(
        (doc: any) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Exercise,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error
              ? error.message
              : 'Error al obtener actividades',
          error: 'ACTIVITY_FETCH_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async validateVideoUrl(videoUrl: string) {
    if (!videoUrl.includes('drive.google.com')) {
      if (!/\.(mp4|webm|mov|avi)$/i.test(videoUrl)) {
        throw new HttpException(
          'Invalid video filename',
          HttpStatus.BAD_REQUEST,
        );
      }
      return;
    }

    if (!this.driveService.isValidDriveUrl(videoUrl)) {
      throw new HttpException(
        'Invalid Google Drive URL',
        HttpStatus.BAD_REQUEST,
      );
    }

    const fileId = this.driveService.extractFileId(videoUrl);
    if (!fileId) {
      throw new HttpException('Invalid video ID', HttpStatus.BAD_REQUEST);
    }

    const fileInfo = await this.driveService.getFileInfo(fileId);
    if (!fileInfo || !fileInfo.id) {
      throw new HttpException(
        'Video not found in Google Drive',
        HttpStatus.NOT_FOUND,
      );
    }

    const parents = fileInfo.parents || [];
    const validFolders = [
      '1iSJMKnKE0oXp3QxlY03nsKQsv1KHMbhc',
      '1PKmm05PopK40UjKrQaBQpiAL8bb2Nx-V',
    ];

    if (!parents.some((parent: string) => validFolders.includes(parent))) {
      throw new HttpException(
        'Video must be in a valid EcoBreack folder',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateTimeConstraints(minTime: number, maxTime: number) {
    if (maxTime <= minTime) {
      throw new HttpException(
        'El tiempo máximo debe ser mayor que el tiempo mínimo',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateRequiredFields(dto: CreateExerciseDto) {
    const requiredFields = [
      'name',
      'description',
      'minTime',
      'maxTime',
      'category',
      'videoUrl',
      'sensorEnabled',
    ];
    for (const field of requiredFields) {
      if (!(field in dto)) {
        throw new HttpException(
          `Missing required field: ${field}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  public async updateExercise(
    id: string,
    updateExerciseDto: UpdateExerciseDto,
  ): Promise<Exercise> {
    try {
      const db = this.firebaseService.getFirestore();
      this.logger.log('ID recibido para actualización:', id);
      const exerciseRef = db.collection('exercises').doc(id);
      const doc = await exerciseRef.get();
      if (!doc.exists) {
        throw new NotFoundException('Ejercicio no encontrado');
      }

      // Validar y actualizar solo campos no nulos/undefined/vacíos
      const currentData = doc.data();
      const updatedData: any = { ...currentData };

      for (const key in updateExerciseDto) {
        const value = (updateExerciseDto as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          updatedData[key] = value;
        }
      }

      this.logger.log('Datos actualizados a guardar:', updatedData);

      await exerciseRef.update(updatedData);

      return {
        id,
        ...updatedData,
      } as Exercise;
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error
              ? error.message
              : 'Error actualizando ejercicio',
          error: 'EXERCISE_UPDATE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getActivityById(
    list: { activityId: string }[],
  ): Promise<Exercise[]> {
    try {
      const db = this.firebaseService.getFirestore();

      if (!list || list.length === 0) {
        throw new NotFoundException('No se proporcionaron IDs de actividades');
      }

      const exercises: Exercise[] = [];

      for (const item of list) {
        const exerciseRef = db.collection('exercises').doc(item.activityId);
        const doc = await exerciseRef.get();
        if (!doc.exists) {
          // Opcional: puedes omitir el throw para retornar solo las encontradas
          throw new NotFoundException(
            `Ejercicio no encontrado: ${item.activityId}`,
          );
        }
        exercises.push({ id: doc.id, ...doc.data() } as Exercise);
      }

      return exercises;
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error
              ? error.message
              : 'Error obteniendo actividad',
          error: 'ACTIVITY_FETCH_BY_ID_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
