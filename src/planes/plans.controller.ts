import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { CreatePlanDto } from '../processes/admin/dto/plan.dto';
import { FirebaseAuthGuard } from '../processes/auth/guards/firebase-auth.guard';
import { PlansService } from './plans.service'; // Updated import path
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Plans')
@Controller('admin/plans') // Make sure base path matches
@UseGuards(FirebaseAuthGuard)
export class PlansController {
  private readonly logger = new Logger(PlansController.name);

  constructor(private readonly plansService: PlansService) {}

  @Post() // Change from 'create' to just @Post()
  @ApiResponse({ status: 201, description: 'Plan creado correctamente' })
  async createPlan(@Body() createPlanDto: CreatePlanDto) {
    try {
      this.logger.log('📝 Creando nuevo plan de pausas');
      const plan = await this.plansService.createPlan(createPlanDto);

      return {
        status: true,
        message: 'Plan creado exitosamente',
        data: plan,
      };
    } catch (error) {
      this.logger.error('Error creando plan:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error creando plan',
          error: 'PLAN_CREATE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Lista de planes obtenida correctamente',
  })
  async getPlans(@Req() request: Request) {
    try {
      this.logger.debug(`📋 Getting plans for user: ${request.user?.email}`);
      const plans = await this.plansService.getPlans();

      return {
        status: true,
        message: 'Planes obtenidos correctamente',
        data: plans,
      };
    } catch (error) {
      this.logger.error('Error obteniendo planes:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error obteniendo planes',
          error: 'PLANS_FETCH_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiResponse({ status: 200, description: 'Plan actualizado correctamente' })
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: CreatePlanDto,
  ) {
    try {
      this.logger.log(`📝 Actualizando plan: ${id}`);
      const plan = await this.plansService.updatePlan(id, updatePlanDto);

      return {
        status: true,
        message: 'Plan actualizado exitosamente',
        data: plan,
      };
    } catch (error) {
      this.logger.error('Error actualizando plan:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error actualizando plan',
          error: 'PLAN_UPDATE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('pause-plans')
  async PausedPlans(response: any) {
    try {
      this.logger.log(`📝 Pausando plan: ${response.id}`);
      const plan = await this.plansService.PausedPlans(response);
      return {
        status: true,
        message: 'Plan pausado exitosamente',
        data: plan,
      };
    } catch (error) {
      this.logger.error('Error pausando plan:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error pausando plan',
          error: 'PLAN_UPDATE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
