import { FirebaseService } from '@firebase/firebase.service';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UpdateStatsDto } from '../dto/update-stats.dto';
import { UpdateNotificationSettingsDto } from '../dto/update-notification-settings.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { auth } from 'firebase-admin';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { MailService } from './email.service';
import {
  UserDataEcobreackDto,
  UserDataFireAccountDto,
  UserGroupAssignDto,
} from './dto/ecouser.dto';
import { log } from 'console';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService,
  ) {}

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

  async getUserStats(uid: string, date: string) {
    try {
      const db = this.firebaseService.getFirestore();

      // Obtener el groupId del usuario
      const userDoc = await db.collection('users').doc(uid).get();
      const groupId = userDoc.data()?.groupId;

      // fecha final del dia
      const endOfDay = `${date}T23:59:59.999Z`;

      // Obtener los planes asignados a ese grupo
      const planes = await this.getPlanesByGroupInNotification(
        groupId,
        db,
        endOfDay,
      );

      // Obtener los IDs de los planes y sus categorías asociadas
      const planIds = Object.keys(planes);

      let categorias: string[] = [];
      if (planIds.length > 0) {
        const plansSnapshot = await db
          .collection('plans')
          .where('__name__', 'in', planIds)
          .get();

        const filteredDocs = plansSnapshot.docs.filter(
          (doc: any) => doc.data().createdAt <= endOfDay,
        );

        categorias = filteredDocs.flatMap(
          (doc: any) => doc.data().categories || [],
        );
      }

      // Contar ocurrencias de cada categoría
      const categoriaCount = categorias.reduce<Record<string, number>>(
        (acc, cat) => {
          if (cat) acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        },
        {},
      );

      const categoriaIds = Object.keys(categoriaCount);

      let actividadIds: string[] = [];
      if (categoriaIds.length > 0) {
        const categoriesSnapshot = await db
          .collection('categoriesXexercise')
          .where('categoriaId', 'in', categoriaIds)
          .get();

        actividadIds = categoriesSnapshot.docs.flatMap(
          (doc: any) => doc.data().actividadId || [],
        );
      }

      const ejercicios = actividadIds.length;

      // Calcular totales
      const total_planes = Object.values(planes).reduce(
        (sum, count) => sum + Number(count),
        0,
      );
      const total_categorias = Object.values(categoriaCount).reduce(
        (sum, count) => sum + Number(count),
        0,
      );

      const total_activities = total_planes * total_categorias * ejercicios;

      // tengo que traer las actividades que se tiene programadas
      // para realizar ademas del tiempo total que se debe invertir en ellas
      const actividadesRealizadasSnap = await db
        .collection('exercisesHistory')
        .where('idUsuario', '==', uid)
        .where('createdAt', '<=', date)
        .get();

      const actividadesRealizadas = actividadesRealizadasSnap.docs.map(
        (doc) => {
          return {
            idEjercicio: doc.data().idEjercicio,
            repeticiones: doc.data().repeticiones,
            tiempo: doc.data().tiempo,
          };
        },
      );

      // sumar repeticiones y tiempo total y contar lso ejercisios
      const activities_done = actividadesRealizadas.length;

      this.logger.debug(
        `Usuario ${uid} ha realizado ${JSON.stringify(actividadesRealizadas)} actividades`,
      );

      const total_repeticiones = actividadesRealizadas.reduce(
        (sum, actividad) => sum + actividad.repeticiones,
        0,
      );

      const total_time = actividadesRealizadas.reduce(
        (sum, actividad) => sum + actividad.tiempo,
        0,
      );

      return {
        activities_done,
        total_activities,
        total_repeticiones,
        total_time,
      };
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas del usuario:', error);
      throw new Error('Error obteniendo estadísticas del usuario');
    }
  }

  // Obtener las actividades realizadas desde la coleccion
  // exercisesHistory para activities done ademas repeticiones y tiempo total

  // tengo que traer las actividades que se tiene programadas
  // para realizar ademas del tiempo total que se debe invertir en ellas

  // traer Ejercicios que tengo que hacer

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
        data,
      };
    } catch (error: unknown) {
      this.logger.error('Error actualizando estadísticas:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
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

      this.logger.debug(
        `Encontrados ${stats.length} usuarios con estadísticas`,
      );
      return stats;
    } catch (error: unknown) {
      this.logger.error('Error al obtener estadísticas globales:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(
        `Error al obtener estadísticas globales: ${errorMessage}`,
      );
    }
  }

  async getPlanesByGroupInNotification(
    groupId: string,
    db: any,
    endOfDay: string,
  ) {
    const planesNotificadosSnapshot = await db
      .collection('notificationPlans')
      .where('createdAt', '<=', endOfDay)
      .get();

    const planIds: string[] = [];

    planesNotificadosSnapshot.docs.forEach((doc: any) => {
      const assignedPlans = doc.data().assignedPlans || {};
      Object.values(assignedPlans).forEach((planesArr: any) => {
        if (Array.isArray(planesArr)) {
          planesArr.forEach((plan: any) => {
            if (plan.group === groupId && plan.id) {
              planIds.push(plan.id);
            }
          });
        }
      });
    });

    const planCount: Record<string, number> = {};
    planIds.forEach((id) => {
      planCount[id] = (planCount[id] || 0) + 1;
    });

    return planCount;
  }

  async updateNotificationSettings(
    uid: string,
    settings: UpdateNotificationSettingsDto,
  ) {
    try {
      this.logger.log(
        `Actualizando configuración de notificaciones para usuario ${uid}`,
      );

      const db = this.firebaseService.getFirestore();
      const userRef = db.collection('users').doc(uid);

      await userRef.set({ notificationSettings: settings }, { merge: true });

      this.logger.log('✅ Configuración de notificaciones actualizada');
      return {
        status: true,
        message: 'Preferencias de notificación actualizadas correctamente',
        data: settings,
      };
    } catch (error: unknown) {
      this.logger.error('Error actualizando configuración:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
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

  async createUser(data: CreateUserDto) {
    let userRecord: UserRecord | null = null;
    try {
      userRecord = await this.loadUserDataByFireAccount(data);
      await this.loadUserDataByEcobreack(userRecord.uid, data);
      this.logger.log('✅ Usuario creado correctamente');
      return {
        status: true,
        message: 'Usuario creado correctamente',
        data: { userRecord },
      };
    } catch (error: any) {
      this.logger.error('❌ Error creando usuario:', error);
      if (userRecord) await this.deleteUser(userRecord.uid);
      throw new Error(error || 'Error desconocido al crear usuario');
    }
  }

  private async loadUserDataByFireAccount(
    user: UserDataFireAccountDto,
  ): Promise<auth.UserRecord> {
    try {
      const auth = this.firebaseService.getAuth();
      return await auth.createUser({ ...user });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error desconocido',
      );
    }
  }

  private async loadUserDataByEcobreack(
    uid: string,
    user: UserDataEcobreackDto,
  ): Promise<void> {
    try {
      const userEcobreack: UserDataEcobreackDto = {
        email: user.email,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        avatarColor: user.avatarColor,
        name: user.name,
        lastName: user.lastName,
      };
      const db = this.firebaseService.getFirestore();
      const userRef = db.collection('users').doc(uid);
      await userRef.set({
        ...userEcobreack,
        numActivities: 0,
        numTimeInApp: 0,
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error desconocido',
      );
    }
  }

  private async deleteUser(uid: string): Promise<void> {
    try {
      const auth = this.firebaseService.getAuth();
      await auth.deleteUser(uid);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error desconocido',
      );
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const auth = this.firebaseService.getAuth();
      const link = await auth.generatePasswordResetLink(email);
      this.logger.log(`Password reset link generated: ${link}`);
      await this.mailService.sendPasswordResetEmail(email, link);
      this.logger.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      this.logger.error('Error generating password reset link:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Error desconocido',
      );
    }
  }

  async assignUserToGroup(
    users: UserGroupAssignDto,
  ): Promise<{ id: string; name: string; email: string }[]> {
    try {
      const db = this.firebaseService.getFirestore();
      const batch = db.batch();
      const validUids: string[] = [];

      // Verifica que el usuario exista antes de asignar el groupId
      for (const uid of users.users) {
        if (typeof uid === 'string' && uid.trim() !== '') {
          const userRef = db.collection('users').doc(uid);
          const userDoc = await userRef.get();
          if (userDoc.exists) {
            batch.set(userRef, { groupId: users.groupId }, { merge: true });
            validUids.push(uid);
            this.logger.debug(`Asignando groupId a UID válido: "${uid}"`);
          } else {
            this.logger.warn(`Usuario no existe: "${uid}"`);
          }
        } else {
          this.logger.warn(`UID inválido: "${uid}"`);
        }
      }

      this.logger.log(`Assigning users to group: ${users.groupId}`);
      await batch.commit();

      // Obtiene los datos actualizados solo de los usuarios válidos
      return await this.getUsersByUid({ ...users, users: validUids }, db);
    } catch (error) {
      this.logger.error('Error assigning user to group:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Error desconocido al asignar usuario al grupo',
      );
    }
  }
  public async getUsersByUid(
    users: UserGroupAssignDto,
    db: any,
  ): Promise<{ id: string; name: string; email: string }[]> {
    if (
      users.users.length === 0 ||
      !users.users ||
      users.users.every((uid) => typeof uid !== 'string' || uid.trim() === '')
    ) {
      return [];
    }

    return await Promise.all(
      users.users.map(async (uid) => {
        const doc = await db.collection('users').doc(uid).get();
        const data = doc.data();
        return {
          id: doc.id,
          name: `${data?.name ?? ''} ${data?.lastName ?? ''}`,
          email: data?.email ?? '',
          avatarColor: data?.avatarColor ?? '',
          telefono: data?.phoneNumber ?? '',
        };
      }),
    );
  }

  public async getUserAdditionalInfo(
    uid: string,
    db: any,
  ): Promise<{
    nombre: any;
    displayName: any;
    avatarColor: any;
    phoneNumber: any;
    historyActivities: any;
    groupId: any;
  }> {
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    this.logger.log(`User data: ${JSON.stringify(userData)}`);
    return {
      nombre: userData?.name + ' ' + userData?.lastName,
      displayName: userData?.displayName,
      avatarColor: userData?.avatarColor,
      phoneNumber: userData?.phoneNumber,
      historyActivities: userData?.historyActivities,
      groupId: userData?.groupId,
    };
  }
}
