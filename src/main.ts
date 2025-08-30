import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import { Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import * as net from 'net';

function getNetworkInfo(): string {
  const interfaces = os.networkInterfaces();
  for (const [name, nets] of Object.entries(interfaces)) {
    for (const net of nets || []) {
      if (!net.internal && net.family === 'IPv4') {
        return net.address; // Devuelve la primera IP pública encontrada
      }
    }
  }
  return 'localhost';
}

async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();

    const tryPort = (port: number) => {
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });

      server.once('listening', () => {
        server.close(() => resolve(port));
      });

      server.listen(port, '0.0.0.0');
    };

    tryPort(startPort);
  });
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'debug', 'log'],
    });

    const configService = app.get(ConfigService);
    let port = configService.get<number>('PORT') || 4300;
    const environment = configService.get<string>('NODE_ENV') || 'development';

    // Verificar si el puerto está disponible
    port = await findAvailablePort(port);

    // CORS seguro
    app.enableCors({
      origin: ['http://localhost:56881', 'http://127.0.0.1:56881'],
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: [
        'Content-Type',
        'Accept',
        'Authorization',
        'x-client-type',
        'Origin',
        'X-Requested-With',
      ],
    });

    // Middleware de logging de requests + token parcial
    app.use((req: Request, res: Response, next: NextFunction) => {
            console.log('👉 Origin recibido:', req.headers.origin);
      const clientType = req.headers['x-client-type'] || 'unknown';


      const origin = req.headers.origin || 'unknown';
      logger.debug(
        `📡 [${clientType}] ${req.method} ${req.path} from ${origin}`,
      );

      // Logging parcial del token como estabas haciendo
      const token = req.headers.authorization;
      if (token) {
        logger.debug(`🔑 Token received: ${token.substring(0, 20)}...`);
      }

      next();
    });

    // Global filters e interceptors
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 Server running on port ${port} in ${environment} mode`);
  } catch (error) {
    logger.error('❌ Server startup error:', error);
    process.exit(1);
  }
}

bootstrap();
