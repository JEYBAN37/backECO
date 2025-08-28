import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  Delete,
  Param,
  Get,
} from '@nestjs/common';
import { CreateActivityDto } from '../processes/admin/dto/create-activity.dto';
import { AdminAuthGuard } from '../processes/admin/guards/admin-auth.guard';
import { ApiResponse } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';


@Controller('admin/activities')
@UseGuards(AdminAuthGuard)
export class ActivitiesController {
  private readonly logger = new Logger(ActivitiesController.name);

  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  async createActivity(@Body() createActivityDto: CreateActivityDto) {
    try {
      const activity =
        await this.activitiesService.createActivity(createActivityDto);

      return {
        status: true,
        message: 'Actividad creada exitosamente',
        data: activity,
      };
    } catch (error) {
      this.logger.error('Error creando actividad:', error);
      throw new HttpException(
        {
          status: false,
          message: error instanceof Error ? error.message : 'Error desconocido',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiResponse({
    status: 200,
    description: 'Lista de actividades obtenida correctamente',
  })
  @Get()
  async getActivities() {
    try {
      this.logger.log('📋 Obteniendo lista de actividades');
      const activities = await this.activitiesService.getActivities();

      return {
        status: true,
        message: 'Actividades obtenidas correctamente',
        data: activities,
      };
    } catch (error: unknown) {
      this.logger.error('Error obteniendo actividades:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error
              ? error.message
              : 'Error obteniendo actividades',
          error: 'ACTIVITIES_FETCH_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiResponse({
    status: 200,
    description: 'Actividad eliminada correctamente',
  })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  @Delete('/:id')
  async deleteActivity(@Param('id') id: string) {
    try {
      this.logger.log(`🗑️ Eliminando actividad: ${id}`);
      await this.activitiesService.deleteActivity(id);

      return {
        status: true,
        message: 'Actividad eliminada correctamente',
      };
    } catch (error: unknown) {
      this.logger.error('Error eliminando actividad:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error
              ? error.message
              : 'Error eliminando actividad',
          error: 'ACTIVITY_DELETE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
