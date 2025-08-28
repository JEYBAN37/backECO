import {
  Controller,
  Get,
  Query,
  Post,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminAuthGuard } from 'src/admin/admin-auth.guard';

@ApiTags('History')
@Controller('admin/pause-history')
@UseGuards(AdminAuthGuard)
export class HistoryController {
  private readonly logger = new Logger(HistoryController.name);

  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Historial obtenido correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getPauseHistory(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() request: Request,
  ) {
    try {
      // Verificar token
      if (!request.user) {
        throw new UnauthorizedException('Usuario no autenticado');
      }

      this.logger.debug(`
📊 [History] Getting history:
- User: ${request.user.email}
- Start: ${startDate}
- End: ${endDate}
- Headers: ${JSON.stringify(request.headers)}
      `);

      const history = await this.historyService.getPauseHistory(
        new Date(startDate),
        new Date(endDate),
      );

      return {
        status: true,
        message: 'Historial obtenido correctamente',
        data: history,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('Error getting history:', error);
      throw new HttpException(
        {
          status: false,
          message: error instanceof Error ? error.message : 'Error desconocido',
          error: 'HISTORY_FETCH_ERROR',
        },
        error instanceof UnauthorizedException
          ? HttpStatus.UNAUTHORIZED
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('export')
  @ApiResponse({
    status: 200,
    description: 'Historial exportado correctamente',
  })
  async exportHistory(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      this.logger.log('📊 Exportando historial');
      const result = await this.historyService.exportHistory(
        new Date(startDate),
        new Date(endDate),
      );

      return {
        status: true,
        message: 'Historial exportado correctamente',
        data: result,
      };
    } catch (error) {
      this.logger.error('Error exporting history:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error
              ? error.message
              : 'Error exportando historial',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
