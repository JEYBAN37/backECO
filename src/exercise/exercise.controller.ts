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
  Put,
} from '@nestjs/common';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { AdminAuthGuard } from '../admin/admin-auth.guard';
import { ApiResponse } from '@nestjs/swagger';
import { ExerciseService } from './exercise.service';


@Controller('admin/exercises')
export class ExerciseController {
  private readonly logger = new Logger(ExerciseController.name);

  constructor(private readonly exerciseService: ExerciseService) {}
  @ApiResponse({
    status: 201,
    description: 'Ejercicio creado correctamente',
  })
  @Post()
  async createExercise(@Body() createExerciseDto: CreateExerciseDto) {
    try {
      const exercise =
        await this.exerciseService.createExercise(createExerciseDto);

      return {
        status: true,
        message: 'Ejercicio creado exitosamente',
        data: exercise,
      };
    } catch (error) {
      this.logger.error('Error creando ejercicio:', error);
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
    description: 'Ejercicio actualizado correctamente',
  })
  @ApiResponse({ status: 404, description: 'Ejercicio no encontrado' })
  @Put('/:id')
  async updateExercise(
    @Param('id') id: string,
    @Body() updateExerciseDto: CreateExerciseDto,
  ) {
    try {
      const exercise = await this.exerciseService.updateExercise(
        id,
        updateExerciseDto,
      );

      return {
        status: true,
        message: 'Ejercicio actualizado exitosamente',
        data: exercise,
      };
    } catch (error) {
      this.logger.error('Error actualizando ejercicio:', error);
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
    description: 'Lista de Ejercicios obtenida correctamente',
  })
  @Get()
  async getExercises() {
    try {
      this.logger.log('📋 Obteniendo lista de Ejercicios');
      const exercises = await this.exerciseService.getExercises();

      return {
        status: true,
        message: 'Ejercicios obtenidos correctamente',
        data: exercises,
      };
    } catch (error: unknown) {
      this.logger.error('Error obteniendo ejercicios:', error);
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
    description: 'Ejercicio eliminado correctamente',
  })
  @ApiResponse({ status: 404, description: 'Ejercicio no encontrado' })
  @Delete('/:id')
  async deleteExercise(@Param('id') id: string) {
    try {
      this.logger.log(`🗑️ Eliminando ejercicio: ${id}`);
      await this.exerciseService.deleteExercise(id);

      return {
        status: true,
        message: 'Ejercicio eliminado correctamente',
      };
    } catch (error: unknown) {
      this.logger.error('Error eliminando ejercicio:', error);
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

  // Nuevo endpoint para obtener actividades por una lista de IDs No Utilizado
  @Post('/getActivitiesUser')
  async getActivitiesUser(@Body() list:{ activityId: string }[]) {
    try {
      this.logger.log(`🔍 Obteniendo actividad por ID: ${list.map(item => item.activityId).join(', ')}`);
      const activities = await this.exerciseService.getActivityById(list);
      return {
        status: true,
        message: 'Actividad obtenida correctamente',
        data: activities,
      };
    } catch (error) {
      this.logger.error('Error obteniendo actividad por ID:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error
              ? error.message
              : 'Error obteniendo actividad por ID',
          error: 'ACTIVITY_FETCH_BY_ID_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}