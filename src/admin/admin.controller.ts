import { Controller, Post, Body, Get, UseGuards, Logger, HttpStatus, HttpException, Req } from '@nestjs/common';

import { AdminLoginDto } from '../dto/admin-login.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from './admin-auth.guard';

interface AdminError {
  message?: string;
  status?: boolean;
  error?: string;
}

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService) { }

  @UseGuards() // Disable guards for this route
  @Post('login')
  async login(@Body() loginDto: AdminLoginDto) {
    try {
      this.logger.log('Intento de login administrativo');
      const result = await this.adminService.validateAdmin(loginDto);

      if (!result.status) {
        throw new HttpException(result, HttpStatus.UNAUTHORIZED);
      }

      return result;
    } catch (error: unknown) {
      this.logger.error('Error en login:', error);
      const adminError: AdminError = {
        status: false,
        message: error instanceof Error ? error.message : 'Error en la autenticación',
        error: 'AUTH_ERROR',
      };
      throw new HttpException(adminError, HttpStatus.UNAUTHORIZED);
    }
  }

  @Get()
  @UseGuards(AdminAuthGuard) // Add guard explicitly here
  async validateAdminAccess() {
    return {
      status: true,
      message: 'Acceso administrativo confirmado',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('check')
  async checkAdminConnection() {
    try {
      return {
        status: true,
        message: 'Admin backend connection successful',
        timestamp: new Date().toISOString(),
        endpoint: '/admin/check'
      };
    } catch (error) {
      this.logger.error('Error checking admin connection:', error);
      throw new HttpException({
        status: false,
        message: 'Error checking admin connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('health')
  getHealth() {
    return {
      status: true,
      message: 'Admin API is healthy',
    };
  }

  @Get('users')
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida' })
  async getUsers(@Req() request: Request) {
    try {
      this.logger.log('📋 Obteniendo lista de usuarios...');
      this.logger.debug(`Headers recibidos: ${JSON.stringify(request.headers)}`);

      const users = await this.adminService.getFirebaseUsers();

      this.logger.debug(`✅ ${users.length} usuarios encontrados`);

      return {
        status: true,
        message: 'Usuarios obtenidos correctamente',
        data: users,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('❌ Error getting users:', error);
      throw new HttpException({
        status: false,
        message: error instanceof Error ? error.message : 'Error getting users',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
