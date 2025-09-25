import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Logger,
  HttpException,
  HttpStatus,
  Req,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { NotificationPlanDto } from '../dto/notification-plan.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationPlanService } from './notification-plan.service';
import { AdminAuthGuard } from 'src/admin/admin-auth.guard';
import { NotificationPauseService } from './notification-pause.service';

@ApiTags('Notification Plans')
//@UseGuards(AdminAuthGuard)
@Controller('admin/notification-plans')
export class NotificationPlanController {
  private readonly logger = new Logger(NotificationPlanController.name);

  constructor(
    private readonly notificationPlanService: NotificationPlanService,
    private readonly notificationPauseService: NotificationPauseService,
  ) {}

  @Get('/test')
  async test() {
    await this.notificationPlanService.getActivePlansByGroup();
    return {
      status: true,
      message: 'Test endpoint reached successfully',
    };
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Plan de notificación creado' })
  async createNotificationPlan(@Body() createPlanDto: NotificationPlanDto) {
    this.logger.log(`Creating notification plan: ${createPlanDto.name}`);
    const plan =
      await this.notificationPlanService.createNotificationPlan(createPlanDto);
    return {
      status: true,
      message: 'Plan de notificación creado exitosamente',
      data: plan,
    };
  }

  @Get()
  async getNotificationPlans(@Req() request: Request) {
    try {
      this.logger.debug(
        `🔍 Getting notification plans for user: ${request.user?.email}`,
      );
      const plans = await this.notificationPlanService.getNotificationPlans();

      return {
        status: true,
        message: 'Planes obtenidos exitosamente',
        data: plans,
      };
    } catch (error: unknown) {
      this.logger.error('Error getting notification plans:', error);
      throw new HttpException(
        {
          status: false,
          message: error instanceof Error ? error.message : 'Error desconocido',
          error: 'NOTIFICATION_PLANS_FETCH_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/status')
  @ApiResponse({ status: 200, description: 'Estado del plan actualizado' })
  async updatePlanStatus(
    @Param('id') id: string,
    @Body() updateData: { isActive: boolean },
  ) {
    this.logger.log(`Updating plan status: ${id} -> ${updateData.isActive}`);
    const plan = await this.notificationPlanService.updatePlanStatus(
      id,
      updateData.isActive,
    );
    return {
      status: true,
      message: 'Estado del plan actualizado exitosamente',
      data: plan,
    };
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Plan de notificación eliminado' })
  async deleteNotificationPlan(@Param('id') id: string) {
    this.logger.log(`Deleting notification plan: ${id}`);
    await this.notificationPlanService.deleteNotificationPlan(id);
    return {
      status: true,
      message: 'Plan de notificación eliminado exitosamente',
    };
  }

  @Post('interruptions')
  @ApiResponse({ status: 201, description: 'Interrupción creada' })
  async createInterruption(@Body() interruptionDto: any) {
    try {
      this.logger.log(`Creating interruption`);
      const interruption =
        await this.notificationPauseService.createInterruption(interruptionDto);
      return {
        status: true,
        message: 'Interrupción creada exitosamente',
        data: interruption,
      };
    } catch (error: unknown) {
      this.logger.error('Error creating interruption:', error);
      throw new HttpException(
        {
          status: false,
          message: error instanceof Error ? error.message : 'Error desconocido',
          error: 'INTERRUPTION_CREATION_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('interruptions/:idUser')
  @ApiResponse({ status: 200, description: 'Interrupción actualizada' })
  async updateInterruptionByUserId(
    @Param('idUser') idUser: string,
    @Body() interruptionDto: any,
  ) {
    try {
      this.logger.log(`Updating interruption for user: ${idUser}`);
      const interruption =
        await this.notificationPauseService.updateInterruptionByUserId(
          idUser,
          interruptionDto,
        );
      if (!interruption) {
        throw new HttpException(
          {
            status: false,
            message: 'Interrupción no encontrada para el usuario',
            error: 'INTERRUPTION_NOT_FOUND',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        status: true,
        message: 'Interrupción actualizada exitosamente',
        data: interruption,
      };
    } catch (error: unknown) {
      this.logger.error('Error updating interruption:', error);
      throw new HttpException(
        {
          status: false,
          message: error instanceof Error ? error.message : 'Error desconocido',
          error: 'INTERRUPTION_UPDATE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('interruptions/:idUser')
  @ApiResponse({ status: 200, description: 'Interrupciones obtenidas' })
  async getActiveInterruptions(@Param('idUser') idUser: string) {
    try {
      this.logger.log(`Getting active interruptions for user: ${idUser}`);
      const interruptions =
        await this.notificationPauseService.getActiveInterruptions(idUser);
      return {
        status: true,
        message: 'Interrupciones obtenidas exitosamente',
        data: interruptions,
      };
    } catch (error: unknown) {
      this.logger.error('Error getting interruptions:', error);
      throw new HttpException(
        {
          status: false,
          message: error instanceof Error ? error.message : 'Error desconocido',
          error: 'INTERRUPTIONS_FETCH_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
