import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'debug', 'log'],
    });

    const configService = app.get(ConfigService);
    const port = process.env.PORT || 4300;
    const environment = configService.get<string>('NODE_ENV') || 'development';

    // CORS seguro
    app.enableCors({
      origin: true,
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

    // Middleware de logging
    app.use((req: Request, res: Response, next: NextFunction) => {
      console.log('👉 Origin recibido:', req.headers.origin);
      const clientType = req.headers['x-client-type'] || 'unknown';
      const origin = req.headers.origin || 'unknown';
      logger.debug(`📡 [${clientType}] ${req.method} ${req.path} from ${origin}`);

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
