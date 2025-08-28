import { Controller, Get, UseGuards, Logger, HttpException, HttpStatus, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AdminAuthGuard } from 'src/admin/admin-auth.guard';
import { SyncService } from 'src/procesos_cargados/process-sync.service';

interface AssignedProcess {
  id: string;
  status: string;
  startDate: string;
  pausePlans?: any[];
  [key: string]: any;
}

@Controller('user/activities')
@UseGuards(AdminAuthGuard) // Asegura que todas las rutas requieren autenticación
export class UserActivitiesController {
  private readonly logger = new Logger(UserActivitiesController.name);

  constructor(private readonly syncService: SyncService) {}

  @Get('today')
  async getTodayActivities(@Req() request: Request) {
    try {
      this.logger.log(`📱 Processing request from ${request.ip}`);
      const user = request.user;

      if (!user?.uid) {
        this.logger.error('🚫 No user ID found in request');
        throw new UnauthorizedException({
          status: false,
          message: 'User not authenticated',
          error: 'AUTH_REQUIRED'
        });
      }

      const activities = await this.syncService.getUserTodayActivities(user.uid);
      
      // Log the response being sent
      this.logger.debug(`Sending response:`, {
        activitiesCount: activities.length,
        timestamp: new Date().toISOString()
      });

      return {
        status: true,
        message: activities.length > 0 ? 'Actividades encontradas' : 'No hay actividades para hoy',
        data: activities,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('❌ [Controller] Error getting today activities:', error);
      throw new HttpException(
        {
          status: false,
          message: 'Error obteniendo actividades',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('debug/assigned')
  async getAssignedProcesses(@Req() request: Request) {
    try {
      const user = request.user;
      if (!user?.uid) {
        throw new UnauthorizedException('User not authenticated');
      }

      this.logger.debug(`🔍 Checking assigned processes for user: ${user.uid}`);
      const processes = await this.syncService.getUserAssignedProcesses(user.uid) as AssignedProcess[];

      return {
        status: true,
        message: 'Debug information retrieved',
        data: {
          processCount: processes.length,
          processes: processes.map(p => ({
            id: p.id,
            status: p.status,
            startDate: p.startDate,
            planCount: p.pausePlans?.length || 0
          }))
        }
      };
    } catch (error) {
      this.logger.error('Error in debug endpoint:', error);
      throw error;
    }
  }
}
