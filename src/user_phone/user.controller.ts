import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { UpdateStatsDto } from '../dto/update-stats.dto';
import { FirebaseService } from '@firebase/firebase.service';
import { UpdateNotificationSettingsDto } from '../dto/update-notification-settings.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { AdminAuthGuard } from 'src/admin/admin-auth.guard';
import { CreateUserDto } from 'src/dto/create-user.dto';

@Controller('admin/users/')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Get()
  @UseGuards(AdminAuthGuard)
  async getUser(@Req() request: Request) {
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }

    return this.userService.getUser(token);
  }

  @Get(':id/stats')
  //@UseGuards(AdminAuthGuard)
  async getUserStats(@Param('id') userId: string, @Query('date') date: string) {
    try {
      this.logger.log('📊 Recibiendo petición GET /user/stats');
      this.logger.debug('👉 User ID recibido:', userId);
      if (!userId) {
        throw new HttpException('No user ID found', HttpStatus.UNAUTHORIZED);
      }

      const stats = await this.userService.getUserStats(userId , date);

      const response = {
        status: true,
        data: stats,
        message: 'Estadísticas obtenidas correctamente',
      };

      this.logger.log('✅ Respuesta exitosa:');
      return response;
    } catch (error: unknown) {
      this.logger.error('❌ Error en getUserStats:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          message: 'Error al obtener estadísticas',
          status: false,
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/all')
  @UseGuards(AdminAuthGuard)
  async getAllUserStats() {
    try {
      this.logger.log('📊 Recibiendo petición GET /user/stats/all');

      const stats = await this.userService.getAllUsersStats();

      const response = {
        status: true,
        data: stats,
        message: 'Estadísticas globales obtenidas correctamente',
      };

      this.logger.log('✅ Respuesta exitosa con datos globales');
      return response;
    } catch (error: unknown) {
      this.logger.error('❌ Error en getAllUserStats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          message: 'Error al obtener estadísticas globales',
          status: false,
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('stats')
  @UseGuards(AdminAuthGuard)
  async updateUserStats(@Body() statsData: UpdateStatsDto) {
    try {
      this.logger.log('📊 Recibiendo petición PATCH /user/stats');
      this.logger.debug('Datos recibidos:', JSON.stringify(statsData, null, 2));

      // TODO: Reemplazar con el UID del token cuando implementes la autenticación
      const uid = 'UIHLeSVc7dbtfys1m5tIqGWaJU73';

      const result = await this.userService.updateUserStats(uid, statsData);
      
      this.logger.log('✅ Estadísticas actualizadas');
      return result;
      
    } catch (error: unknown) {
      this.logger.error('Error en updateUserStats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        { 
          message: 'Error al actualizar estadísticas',
          status: false,
          error: errorMessage
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch('notification-settings')
  @UseGuards(AdminAuthGuard)
  async updateSettings(@Body() settings: UpdateNotificationSettingsDto) {
    try {
      this.logger.log('📱 Recibiendo petición PATCH /user/notification-settings');
      this.logger.debug('Configuración recibida:', JSON.stringify(settings, null, 2));

      // TODO: Reemplazar con el UID del token cuando implementes autenticación
      const uid = 'UIHLeSVc7dbtfys1m5tIqGWaJU73';

      const result = await this.userService.updateNotificationSettings(uid, settings);
      
      this.logger.log('✅ Configuración actualizada');
      return result;
    } catch (error: unknown) {
      this.logger.error('Error en updateSettings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        { 
          message: 'Error al actualizar configuración',
          status: false,
          error: errorMessage
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch('profile')
  @UseGuards(AdminAuthGuard)
  async updateUserProfile(@Body() body: UpdateProfileDto, @Req() request: Request) {
    try {
      this.logger.log('📝 Recibiendo petición PATCH /user/profile');
      const token = request.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
      }

      const decodedToken = await this.firebaseService.verifyToken(token);
      const uid = decodedToken.uid;

      const result = await this.userService.updateUserProfile(uid, body);
      
      this.logger.log('✅ Perfil actualizado');
      return result;
    } catch (error) {
      this.logger.error('❌ Error en updateUserProfile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        { 
          message: 'Error al actualizar perfil',
          status: false,
          error: errorMessage
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('register')
  async registerUser(@Body() registerDto: CreateUserDto) {
    try {
      const result = await this.userService.createUser(registerDto);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          message: 'Error al registrar usuario',
          status: false,
          error: errorMessage
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('reset-password')
  async resetPassword(@Body('email') email: string) {
    try {
      if (!email) {
        throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
      }

      await this.userService.sendPasswordResetEmail(email);
      return {
        status: true,
        message: 'Password reset email sent successfully',
      };
    } catch (error: unknown) {
      this.logger.error('❌ Error en resetPassword:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          message: 'Error al enviar correo de restablecimiento de contraseña',
          status: false,
          error: errorMessage
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}