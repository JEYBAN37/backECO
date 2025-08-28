import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UserResponseDto } from './dto/user.response.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(private readonly firebaseService: FirebaseService) { }

    async getUsers(): Promise<{ status: boolean; data: UserResponseDto[]; message: string }> {
        try {
            this.logger.debug('🔍 Intentando obtener lista de usuarios...');
            const auth = this.firebaseService.getAuth();
            const listUsersResult = await auth.listUsers();

            this.logger.debug(`✅ ${listUsersResult.users.length} usuarios encontrados`);

            const users: UserResponseDto[] = listUsersResult.users.map((user: admin.auth.UserRecord): UserResponseDto => ({
                uid: user.uid,
                email: user.email ?? null,
                displayName: user.displayName ?? 'Sin nombre',
                photoURL: user.photoURL ?? null,  // Manejo explícito de null
                disabled: user.disabled,
                metadata: {
                    creationTime: user.metadata.creationTime,
                    lastSignInTime: user.metadata.lastSignInTime
                }
            }));

            return {
                status: true,
                data: users,
                message: 'Users retrieved successfully'
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('❌ Error getting users:', errorMessage);

            if (error instanceof Error && 'code' in error && error.code === 'app/no-app') {
                this.logger.error('Firebase app not initialized');
                throw new Error('Firebase no está inicializado correctamente');
            }

            throw new Error(`Error al obtener usuarios: ${errorMessage}`);
        }
    }

    async createActivity(activityData: CreateActivityDto) {
        try {
            this.logger.debug(`📝 Creating activity: ${activityData.name}`);

            // Extraer el ID del video de Drive si existe
            const driveFileId = activityData.videoUrl.includes('drive.google.com')
                ? activityData.videoUrl.split('/d/')[1]?.split('/')[0]
                : null;

            // Normalizar caracteres especiales
            const normalizedData = {
                ...activityData,
                name: activityData.name.normalize('NFD').replace(/[\u0300-\u036f]/g, ""),
                description: activityData.description.normalize('NFD').replace(/[\u0300-\u036f]/g, ""),
                driveFileId,
                id: Math.random().toString(36).substring(2, 15),
            };

            this.logger.log(`✅ Activity created: ${normalizedData.id}`);

            return {
                status: true,
                message: 'Actividad creada correctamente',
                data: normalizedData
            };
        } catch (error) {
            this.logger.error('❌ Error creating activity:', error);
            throw new Error('Error al crear la actividad');
        }
    }
}
