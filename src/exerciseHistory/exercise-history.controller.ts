import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateExerciseHistoryDto } from './dto/create-exercise-history.dto';
import { ExerciseHistoryService } from './exercise-history.service';
import { GetExerciseHistoryDto } from './dto/get-exercise-history.dto';

// Controlador POST para cargar el historial de ejercicios
@Controller('user/exercise-history')
export class ExerciseHistoryController {

  constructor(private readonly exerciseHistoryService: ExerciseHistoryService) {};
  @Post()
  async postExerciseHistory(@Body() create: CreateExerciseHistoryDto) {
    try {
      const history = await this.exerciseHistoryService.createHistory(create);
      return {
        status: true,
        message: 'Ejercicio actualizado exitosamente',
        data: history,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('by-user')
  async getExerciseHistoryByUser(@Body() parameters: GetExerciseHistoryDto) {
    try {
      const history = await this.exerciseHistoryService.getHistoryByUser(parameters);
      return {
        status: true,
        message: 'Historial de ejercicios obtenido exitosamente',
        data: history,
      };
    } catch (error) {
      this.handleError(error);
    }
  }


  @Get(':id/exercises')
  async getAllExercises(@Param('id')id: string , @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    try {
      const exercises = await this.exerciseHistoryService.getAllExercises( id, startDate, endDate);
      return {
        status: true,
        message: 'Lista de ejercicios obtenida exitosamente',
        data: exercises,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get(':id/history')
  async getHistoryExercise(@Param('id')id: string) {
    try {
      const history = await this.exerciseHistoryService.getHistoryByUserToday(id);
      return {
        status: true,
        message: 'Historial de ejercicios obtenido exitosamente',
        data: history,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any) {
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
