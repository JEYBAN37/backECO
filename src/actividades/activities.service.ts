import { FirebaseService } from '@firebase/firebase.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriveService } from 'src/drive_storage/drive.service';
import { Activity } from 'src/processes/admin/dto/activity.dto';
import { CreateActivityDto } from 'src/processes/admin/dto/create-activity.dto';


@Injectable()
export class ActivitiesService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly driveService: DriveService,
  ) {}

  async createActivity(
    createActivityDto: CreateActivityDto,
  ): Promise<Activity> {
    try {
      // 1️⃣ Validaciones iniciales
      this.validateRequiredFields(createActivityDto);
      await this.validateVideoUrl(createActivityDto.videoUrl);
      this.validateTimeConstraints(
        createActivityDto.minTime,
        createActivityDto.maxTime,
      );

      // 2️⃣ Preparar timestamps
      const now: string = new Date().toISOString();

      // 3️⃣ Extraer ID del archivo de Google Drive
      const driveFileId = this.driveService.extractFileId(
        createActivityDto.videoUrl,
      );

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
      const activityData: CreateActivityDto = {
        ...createActivityDto,
        createdAt: createActivityDto.createdAt || now,
        updatedAt: now,
        sensorEnabled: createActivityDto.sensorEnabled ?? false,
        duration: createActivityDto.duration || 300,
        minTime: createActivityDto.minTime || 15,
        maxTime: createActivityDto.maxTime || 30,
        category: createActivityDto.category || 'Estiramientos Generales',
        driveFileId, // guardamos el ID del video
      };

      // 5️⃣ Guardar en Firestore
      const db = this.firebaseService.getFirestore();
      const activitiesRef = db.collection('activities');
      const docRef = await activitiesRef.add(activityData);

      // 6️⃣ Retornar actividad creada
      return {
        id: docRef.id,
        ...activityData,
      } as Activity;
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

  async deleteActivity(activityId: string): Promise<void> {
    const db = this.firebaseService.getFirestore();
    const activityRef = db.collection('activities').doc(activityId);

    const doc = await activityRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Actividad no encontrada');
    }

    await activityRef.delete();
  }

  async getActivities(): Promise<Activity[]> {
    try {
      const db = this.firebaseService.getFirestore();
      const snapshot = await db.collection('activities').get();

      return snapshot.docs.map(
        (doc: any) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Activity,
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

  private validateRequiredFields(dto: CreateActivityDto) {
    const requiredFields = [
      'name',
      'description',
      'type',
      'minTime',
      'maxTime',
      'category',
      'videoUrl',
      'sensorEnabled',
      'duration',
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
}
