import { Controller, Post, Get, Param, Body, UseGuards, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { SyncService } from 'src/procesos_cargados/process-sync.service';
import { ProcessUploadDto } from 'src/dto/process-upload.dto';
import { ProcessUploadService } from 'src/procesos_cargados/process-upload.service';
import { AdminAuthGuard } from '../admin/admin-auth.guard';


@ApiTags('Process Upload')
@Controller('admin/process-upload')
@UseGuards(AdminAuthGuard)
export class ProcessUploadController {
  private readonly logger = new Logger(ProcessUploadController.name);

  constructor(
    private readonly processUploadService: ProcessUploadService,
    private readonly syncService: SyncService,
  ) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Proceso creado exitosamente' })
  async uploadProcess(@Body() data: ProcessUploadDto) {
    try {
      this.logger.log(`📤 Subiendo proceso: ${data.processName}`);
      const process = await this.processUploadService.uploadProcess(data);

      this.logger.log(`🔄 Sincronizando proceso con usuarios del grupo: ${data.groupId}`);
      await this.syncService.syncProcessToUsers(process.id, data.groupId);

      return {
        status: true,
        message: 'Proceso subido y sincronizado correctamente',
        data: process,
      };
    } catch (error) {
      this.logger.error('❌ Error subiendo proceso:', error);
      throw new HttpException({
        status: false,
        message: error instanceof Error ? error.message : 'Error subiendo proceso',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/active')
  @ApiResponse({ status: 200, description: 'Lista de procesos activos obtenida' })
  async getActiveProcesses() {
    try {
      this.logger.log('📋 Obteniendo procesos activos...');
      const processes = await this.processUploadService.getActiveProcesses();
      
      return {
        status: true,
        data: processes,
      };
    } catch (error) {
      this.logger.error('Error getting active processes:', error);
      throw new HttpException({
        status: false,
        message: error instanceof Error ? error.message : 'Error getting active processes',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/:id/deactivate')
  @ApiResponse({ status: 200, description: 'Proceso desactivado exitosamente' })
  async deactivateProcess(@Param('id') id: string) {
    try {
      this.logger.log(`🔄 Desactivando proceso ${id}...`);
      await this.processUploadService.deactivateProcess(id);
      
      return {
        status: true,
        message: 'Proceso desactivado exitosamente'
      };
    } catch (error) {
      this.logger.error('Error deactivating process:', error);
      throw new HttpException({
        status: false,
        message: error instanceof Error ? error.message : 'Error deactivating process',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
