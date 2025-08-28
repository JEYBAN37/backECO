import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private auth!: admin.auth.Auth;
  private db!: admin.firestore.Firestore;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.logger.log('🔄 Inicializando Firebase con variables separadas...');
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );
      let privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('❌ Faltan variables de entorno de Firebase');
      }

      // Arreglar el formato de la clave (las claves suelen venir con \n en una sola línea)
      privateKey = privateKey.replace(/\\n/g, '\n');

      const serviceAccount: admin.ServiceAccount = {
        projectId,
        clientEmail,
        privateKey,
      };

      if (!admin.apps.length) {
        const app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.auth = app.auth();
        this.db = app.firestore();
        this.logger.log(
          '✅ Firebase inicializado correctamente con variables separadas',
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('❌ Error inicializando Firebase:', error.message);
      } else {
        this.logger.error('❌ Error inicializando Firebase:', error);
      }
      throw error;
    }
  }

  getAuth(): admin.auth.Auth {
    if (!this.auth) {
      throw new Error('Firebase Auth no inicializado');
    }
    return this.auth;
  }

  getFirestore(): admin.firestore.Firestore {
    if (!this.db) {
      throw new Error('Firebase Firestore no inicializado');
    }
    return this.db;
  }

  async verifyToken(
    token: string,
  ): Promise<{ uid: string; email: string; role: string }> {
    try {
      if (!token || !token.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token inválido');
      }
      const tokenId = token.split('Bearer ')[1].trim();
      this.logger.debug(`🔍 Verificando token: ${tokenId.slice(0, 20)}...`);
      const decodedToken = await this.auth.verifyIdToken(tokenId);
      if (!decodedToken.email) {
        throw new Error('Email not found in decoded token');
      }
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role:
          decodedToken.email === this.configService.get('ADMIN_EMAIL')
            ? 'admin'
            : 'user',
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('❌ Error verificando token:', error.message);
      } else {
        this.logger.error('❌ Error verificando token:', error);
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
