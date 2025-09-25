import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { MotivosService } from './motivos.service';
import { CreateMotivoDto } from './dto/motivo.create.dto';
import { MotivosRespuestaService } from './motivos.respuesta.service';
import { CreateMotivoRespuestaDto } from './dto/motivo.respuesta.create';

@Controller('admin/motivos')
export class MotivosController {
    constructor(
        private readonly motivosService: MotivosService,
        private readonly motivosRespuestaService: MotivosRespuestaService
    ) {}

    @Get()
    async getAll() {
        try {
            const motivos = await this.motivosService.findAll();
            return {
                status: true,
                message: 'Lista de motivos obtenida exitosamente',
                data: motivos,
            };
        } catch (error) {
            this.handleError(error);
        }
    }

    @Post()
    async post(@Body() createMotivoDto: CreateMotivoDto) {
        try {
            const nuevoMotivo =  await this.motivosService.create(createMotivoDto);
            return {
                status: true,
                message: 'Motivo creado exitosamente',
                data: nuevoMotivo,
            };
        } catch (error) {
            this.handleError(error);
        }
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        try {
            const resultado = this.motivosService.remove(id);
            return {
                status: true,
                message: 'Motivo eliminado exitosamente',
                data: resultado,
            };
        } catch (error) {
            this.handleError(error);
        }
    }

    @Put(':id')
    put(@Param('id') id: string, @Body() createMotivoDto: CreateMotivoDto) {
        try {
            const motivoActualizado = this.motivosService.update(id, createMotivoDto);
            return {
                status: true,
                message: 'Motivo actualizado exitosamente',
                data: motivoActualizado,
            };
        } catch (error) {
            this.handleError(error);
        }
    }

    @Get('active')
    async getActive() {
        try {
            const motivosActivos = await this.motivosService.findActive();
            return {
                status: true,
                message: 'Lista de motivos activos obtenida exitosamente',
                data: motivosActivos,
            };
        } catch (error) {
            this.handleError(error);
        }
    }


    @Post('comentarios')
    async postComentario(@Body() createMotivoDto: CreateMotivoRespuestaDto) {
        try {
            const nuevoComentario = await this.motivosRespuestaService.create(createMotivoDto);
            return {
                status: true,
                message: 'Comentario creado exitosamente',
                data: nuevoComentario,
            };
        } catch (error) {
            this.handleError(error);
        }
    }

    @Get('comentarios')
    async getComentarios() {
        try {
            const comentarios = await this.motivosRespuestaService.findMotivosRespuesta();
            return {
                status: true,
                message: 'Lista de comentarios obtenida exitosamente',
                data: comentarios,
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
