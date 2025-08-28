import { FirebaseService } from '@firebase/firebase.service';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UpdateStatsDto } from '../dto/update-stats.dto';
import { UpdateNotificationSettingsDto } from '../dto/update-notification-settings.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';


@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async getUser(token: string) {
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decodedToken = await this.firebaseService.verifyToken(token);
      const uid = decodedToken.uid;

      const db = this.firebaseService.getFirestore();
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        throw new UnauthorizedException('Usuario no encontrado en Firestore');
      }

      const userData = userDoc.data();
      
      this.logger.debug('Datos del usuario obtenidos:', userData);

      return {
        uid,
        name: userData?.name ?? '',
        lastName: userData?.lastName ?? '',
        email: userData?.email ?? '',
        gender: userData?.gender ?? '',
        avatarColor: userData?.avatarColor?.toString() ?? '0xFF0067AC',
      };
    } catch (error) {
      this.logger.error('Error obteniendo datos del usuario:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUserStats(uid: string) {
    try {
      this.logger.log(`Obteniendo estadísticas del usuario ${uid}`);
      
      const db = this.firebaseService.getFirestore();
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        return {
          activities_done: 0,
          total_activities: 0,
          total_time: 0,
        };
      }

      const data = userDoc.data();
      return {
        activities_done: data?.activities_done ?? 0,
        total_activities: data?.total_activities ?? 0,
        total_time: data?.total_time ?? 0,
      };
      
    } catch (error: unknown) {
      this.logger.error('Error al obtener estadísticas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener estadísticas: ${errorMessage}`);
    }
  }

  async updateUserStats(uid: string, data: UpdateStatsDto) {
    try {
      this.logger.log(`Actualizando estadísticas para usuario ${uid}`);
      
      const db = this.firebaseService.getFirestore();
      const userRef = db.collection('users').doc(uid);

      await userRef.set(data, { merge: true });

      this.logger.log('✅ Estadísticas actualizadas correctamente');
      return {
        status: true,
        message: 'Estadísticas actualizadas correctamente',
        data
      };
    } catch (error: unknown) {
      this.logger.error('Error actualizando estadísticas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error actualizando estadísticas: ${errorMessage}`);
    }
  }

  async getAllUsersStats() {
    try {
      this.logger.log('Obteniendo estadísticas de todos los usuarios');
      
      const db = this.firebaseService.getFirestore();
      const usersSnapshot = await db.collection('users').get();

      const stats = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          name: data.name ?? '',
          lastName: data.lastName ?? '',
          email: data.email ?? '',
          activities_done: data.activities_done ?? 0,
          total_activities: data.total_activities ?? 0,
          total_time: data.total_time ?? 0,
        };
      });

      this.logger.debug(`Encontrados ${stats.length} usuarios con estadísticas`);
      return stats;
      
    } catch (error: unknown) {
      this.logger.error('Error al obtener estadísticas globales:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener estadísticas globales: ${errorMessage}`);
    }
  }

  async updateNotificationSettings(uid: string, settings: UpdateNotificationSettingsDto) {
    try {
      this.logger.log(`Actualizando configuración de notificaciones para usuario ${uid}`);
      
      const db = this.firebaseService.getFirestore();
      const userRef = db.collection('users').doc(uid);

      await userRef.set({ notificationSettings: settings }, { merge: true });

      this.logger.log('✅ Configuración de notificaciones actualizada');
      return {
        status: true,
        message: 'Preferencias de notificación actualizadas correctamente',
        data: settings
      };
    } catch (error: unknown) {
      this.logger.error('Error actualizando configuración:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error actualizando configuración: ${errorMessage}`);
    }
  }

  async updateUserProfile(uid: string, data: UpdateProfileDto) {
    try {
      this.logger.log(`✏️ Actualizando perfil de usuario ${uid}`);

      const db = this.firebaseService.getFirestore();
      const userRef = db.collection('users').doc(uid);

      await userRef.set(data, { merge: true });

      this.logger.log('✅ Perfil actualizado correctamente');
      return {
        status: true,
        message: 'Perfil actualizado correctamente',
        data,
      };
    } catch (error) {
      this.logger.error('❌ Error actualizando perfil:', error);
      throw new Error('Error actualizando perfil del usuario');
    }
  }
}
