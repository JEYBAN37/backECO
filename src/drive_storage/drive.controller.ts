import { ApiResponse } from '@nestjs/swagger';
import { DriveService } from './drive.service';
import { Controller, Get, HttpException, HttpStatus, Param, Res, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from 'src/admin/admin-auth.guard';

@Controller('admin/drive')
@UseGuards(AdminAuthGuard)
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @ApiResponse({
    status: 200,
    description: 'Lista de videos obtenida correctamente',
  })
  @ApiResponse({ status: 404, description: 'No se encontraron videos' })
  @Get('/videos')
  async listDriveVideos() {
    try {
      const videos = await this.driveService.listFolderVideos();

      if (videos.length === 0) {
        return {
          status: false,
          message: 'No se encontraron videos',
          data: [],
        };
      }

      return {
        status: true,
        message: 'Videos obtenidos correctamente',
        data: videos,
      };
    } catch (error: unknown) {
      throw new HttpException(
        {
          status: false,
          message: 'Error al listar videos',
          error: error instanceof Error ? error.message : 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/thumbnail/:id')
  async getVideoThumbnail(@Param('id') fileId: string, @Res() res: any) {
    try {
      const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300-n`;
      return res.redirect(thumbnailUrl);
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message: 'Error getting thumbnail',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/validate/:id')
  async validateVideo(@Param('id') fileId: string) {
    try {
      const isValid = await this.driveService.getAccessToken(fileId);
      return {
        status: true,
        message: 'Video validation successful',
        data: isValid,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message: 'Error validating video',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
