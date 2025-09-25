import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UserResponseDto } from '../dto/user.response.dto';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { AdminLoginDto } from 'src/dto/admin-login.dto';
import { UserService } from 'src/user_phone/user.service';
import { ideahub } from 'googleapis/build/src/apis/ideahub';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly ADMIN_EMAIL: string;
  private readonly ADMIN_PASSWORD: string;
  private readonly JWT_SECRET: string;

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.ADMIN_EMAIL =
      this.configService.get<string>('ADMIN_EMAIL') || 'default_admin_email';
    this.ADMIN_PASSWORD =
      this.configService.get<string>('ADMIN_PASSWORD') ||
      'default_admin_password';
    this.JWT_SECRET =
      this.configService.get<string>('JWT_SECRET') || 'default_secret_key';
    // Debug: confirmar carga de variables de entorno
    this.logger.debug(
      `Config loaded: ADMIN_EMAIL=${this.ADMIN_EMAIL}, ADMIN_PASSWORD=${this.ADMIN_PASSWORD}`,
    );
  }

  async getUsers(): Promise<{
    status: boolean;
    data: UserResponseDto[];
    message: string;
  }> {
    try {
      this.logger.debug('🔍 Intentando obtener lista de usuarios...');
      const auth = this.firebaseService.getAuth();
      const listUsersResult = await auth.listUsers();

      this.logger.debug(
        `✅ ${listUsersResult.users.length} usuarios encontrados`,
      );

      const users: UserResponseDto[] = listUsersResult.users.map(
        (user: admin.auth.UserRecord): UserResponseDto => ({
          uid: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? 'Sin nombre',
          photoURL: user.photoURL ?? null, // Manejo explícito de null
          disabled: user.disabled,
          metadata: {
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
          },
        }),
      );

      return {
        status: true,
        data: users,
        message: 'Users retrieved successfully',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('❌ Error getting users:', errorMessage);

      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'app/no-app'
      ) {
        this.logger.error('Firebase app not initialized');
        throw new Error('Firebase no está inicializado correctamente');
      }

      throw new Error(`Error al obtener usuarios: ${errorMessage}`);
    }
  }

  async validateUser(
    loginDto: AdminLoginDto,
  ): Promise<{ status: boolean; message: string; data: any }> {
    try {
      const userRecord = await this.firebaseService
        .getAuth()
        .getUserByEmail(loginDto.email);
      this.logger.log(`Admin user found: ${userRecord.email}`);
      const db = this.firebaseService.getFirestore();
      const userAdditionalInfo = await this.userService.getUserAdditionalInfo(
        userRecord.uid,
        db,
      );

      const customToken = await this.firebaseService
        .getAuth()
        .createCustomToken(userRecord.uid, {
          admin: true,
          email: userRecord.email,
        });
      return {
        status: true,
        message: 'Login usuario exitoso',
        data: {
          id: userRecord.uid,
          email: userRecord.email,
          permissions: ['full_access'],
          token: customToken,
          timestamp: new Date().toISOString(),
          userdata: userAdditionalInfo,
        },
      };
    } catch (error) {
      this.logger.error('Error en validación de usuario:', error);
      throw new UnauthorizedException(
        'Credenciales inválidas' +
          (error instanceof Error ? `: ${error.message}` : ''),
      );
    }
  }

  async validateAdmin(loginDto: AdminLoginDto) {
    try {
      const userRecord = await this.firebaseService
        .getAuth()
        .getUserByEmail(loginDto.email);
      this.logger.log(`Admin user found: ${userRecord.email}`);

      if(!this.verifyAdmin(loginDto)) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const db = this.firebaseService.getFirestore();
      const userAdditionalInfo = await this.userService.getUserAdditionalInfo(
        userRecord.uid,
        db,
      );

      const customToken = await this.firebaseService
        .getAuth()
        .createCustomToken(userRecord.uid, {
          admin: true,
          email: userRecord.email,
        });
      return {
        status: true,
        message: 'Login Admin exitoso',
        data: {
          id: userRecord.uid,
          email: userRecord.email,
          permissions: ['full_access'],
          token: customToken,
          timestamp: new Date().toISOString(),
          userdata: userAdditionalInfo,
        },
      };
    } catch (error) {
      this.logger.error('Error en validación de admin:', error);
      throw new UnauthorizedException(
        'Error en la autenticación' +
          (error instanceof Error ? `: ${error.message}` : ''),
      );
    }
  }

  verifyAdmin(loginDto: AdminLoginDto) {
    if (
      loginDto.email === this.ADMIN_EMAIL ||
      loginDto.password === this.ADMIN_PASSWORD
    ) {
      return true;
    }
  }

  async getFirebaseUsers(): Promise<UserResponseDto[]> {
    this.logger.debug('🔍 Iniciando obtención de usuarios de Firebase...');
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

      this.logger.debug(
        `✅ Se encontraron ${listUsersResult.users.length} usuarios`,
      );
      if (listUsersResult.users.length > 0) {
        const firstUser = listUsersResult.users[0];
        this.logger.debug(
          `Atributos del primer usuario: ${Object.keys(firstUser).join(', ')}`,
        );
      }

      return listUsersResult.users.map(
        (user: admin.auth.UserRecord): UserResponseDto => ({
          uid: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? 'Sin nombre',
          photoURL: user.photoURL ?? null,
          disabled: user.disabled,
          metadata: {
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
          },
        }),
      );
    } catch (error) {
      this.logger.error('❌ Error obteniendo usuarios de Firebase:', error);
      throw new Error(
        `Error al obtener usuarios de Firebase: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }
}
