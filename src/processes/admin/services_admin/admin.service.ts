import { Injectable, UnauthorizedException, Logger, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { FirebaseService } from '../../../firebase/firebase.service';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserStats } from '../dto/user-stats.dto';
import { CreateActivityDto, Activity } from '../dto/activity.dto';
import { DriveService } from '../../../drive_storage/drive.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly ADMIN_EMAIL: string;
  private readonly ADMIN_PASSWORD: string;
  private readonly JWT_SECRET: string;

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly configService: ConfigService,
  ) {
    this.ADMIN_EMAIL = this.configService.get<string>('ADMIN_EMAIL') || 'default_admin_email';
    this.ADMIN_PASSWORD = this.configService.get<string>('ADMIN_PASSWORD') || 'default_admin_password';
    this.JWT_SECRET = this.configService.get<string>('JWT_SECRET') || 'default_secret_key';
    // Debug: confirmar carga de variables de entorno
    this.logger.debug(`Config loaded: ADMIN_EMAIL=${this.ADMIN_EMAIL}, ADMIN_PASSWORD=${this.ADMIN_PASSWORD}`);
  }

  async validateAdmin(loginDto: AdminLoginDto): Promise<{ status: boolean; message: string; data: any }> {
    this.logger.debug(`Login attempt for: ${loginDto.email}`);
    this.logger.debug(`Received password: ${loginDto.password}`);
    this.logger.debug(`Expected password: ${this.ADMIN_PASSWORD}`);

    if (loginDto.email !== this.ADMIN_EMAIL || loginDto.password !== this.ADMIN_PASSWORD) {
      this.logger.warn('Invalid admin credentials');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    try {
      // Crear un custom token usando Firebase Admin
      const uid = 'admin-' + Date.now();
      const customToken = await this.firebaseService.getAuth().createCustomToken(uid, {
        admin: true,
        email: loginDto.email
      });

      this.logger.log('Admin login successful');
      return {
        status: true,
        message: 'Login administrativo exitoso',
        data: {
          email: loginDto.email,
          role: 'admin',
          permissions: ['full_access'],
          token: customToken,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Error en validación de admin:', error);
      throw new UnauthorizedException('Error en la autenticación');
    }
  }

  async getFirebaseUsers(): Promise<UserResponseDto[]> {
    try {
      this.logger.debug('🔍 Iniciando obtención de usuarios de Firebase...');

      const auth = this.firebaseService.getAuth();
      if (!auth) {
        this.logger.error('❌ Firebase Auth no está inicializado');
        throw new Error('Firebase Auth no está inicializado');
      }

      if (typeof auth.listUsers !== 'function') {
        this.logger.error('🔥 Firebase Auth no tiene el método listUsers');
        throw new Error('Firebase Auth no está correctamente configurado');
      }

      this.logger.debug('📨 Llamando a auth.listUsers()...');
      const listUsersResult = await auth.listUsers();

      if (!listUsersResult || !listUsersResult.users) {
        this.logger.error('❌ listUsers() no devolvió un resultado válido');
        throw new Error('No se pudo obtener la lista de usuarios');
      }

      this.logger.debug(`✅ Se encontraron ${listUsersResult.users.length} usuarios`);

      const db = this.firebaseService.getFirestore();

      const usersData = await Promise.all(listUsersResult.users.map(async (user) => {
        try {
          const userDoc = await db.collection('users').doc(user.uid).get();
          const userData = userDoc.data() || {};

          const userResponse: UserResponseDto = {
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || userData.name || null,
            photoURL: user.photoURL || null,
            disabled: user.disabled,
            metadata: {
              creationTime: user.metadata.creationTime,
              lastSignInTime: user.metadata.lastSignInTime
            },
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
            status: user.disabled ? 'disabled' : 'active'
          };

          return userResponse;
        } catch (error) {
          this.logger.error(`Error obteniendo datos de usuario ${user.uid}:`, error);
          return null;
        }
      }));

      return usersData.filter((user): user is UserResponseDto => user !== null);

    } catch (error) {
      this.logger.error('❌ Error obteniendo usuarios de Firebase:', error);
      throw new Error(`Error al obtener usuarios de Firebase: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    try {
      this.logger.debug(`Obteniendo estadísticas del usuario ${userId}`);

      const db = this.firebaseService.getFirestore();
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        this.logger.warn(`Usuario ${userId} no encontrado, retornando estadísticas vacías`);
        return {
          activities_done: 0,
          total_activities: 0,
          total_time: 0
        };
      }

      const userData = userDoc.data() || {};

      const stats = {
        activities_done: Number(userData.activities_done) || 0,
        total_activities: Number(userData.total_activities) || 0,
        total_time: Number(userData.total_time) || 0
      };

      this.logger.debug('Estadísticas obtenidas:', stats);
      return stats;

    } catch (error: unknown) {
      this.logger.error(`Error obteniendo estadísticas para usuario ${userId}:`, error);
      throw new HttpException({
        status: false,
        message: 'Error al obtener estadísticas del usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}
