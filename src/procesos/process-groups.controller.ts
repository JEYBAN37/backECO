import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AdminAuthGuard } from '../admin/admin-auth.guard';
import { ProcessGroupService } from './process-group.service';
import {
  CreateProcessGroupDto,
  UpdateProcessGroupDto,
  UpdateProcessGroupMembersDto,
} from '../dto/process-group.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Process Groups')
@Controller('admin/process-groups')
export class ProcessGroupsController {
  private readonly logger = new Logger(ProcessGroupsController.name);

  constructor(private readonly processGroupService: ProcessGroupService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Lista de grupos obtenida correctamente',
  })
  async getProcessGroups() {
    try {
      const groups = await this.processGroupService.getProcessGroups();
      return {
        status: true,
        message: 'Grupos obtenidos correctamente',
        data: groups,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error getting groups',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Grupo creado correctamente' })
  async createProcessGroup(@Body() data: CreateProcessGroupDto) {
    try {
      const group = await this.processGroupService.createProcessGroup(data);
      return {
        status: true,
        message: 'Grupo creado correctamente',
        data: group,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error creating group',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiResponse({ status: 200, description: 'Grupo actualizado correctamente' })
  async updateProcessGroup(
    @Param('id') id: string,
    @Body() data: UpdateProcessGroupDto,
  ) {
    try {
      const group = await this.processGroupService.updateProcessGroup(id, data);
      return {
        status: true,
        message: 'Grupo actualizado correctamente',
        data: group,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error updating group',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Grupo eliminado correctamente' })
  async deleteProcessGroup(@Param('id') id: string) {
    try {
      await this.processGroupService.deleteProcessGroup(id);
      return {
        status: true,
        message: 'Grupo eliminado correctamente',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error deleting group',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/members')
  @ApiResponse({
    status: 200,
    description: 'Miembros del grupo actualizados correctamente',
  })
  async updateGroupMembers(
    @Param('id') id: string,
    @Body() data: UpdateProcessGroupMembersDto,
  ) {
    try {
      const group = await this.processGroupService.updateGroupMembers(id, data);
      return {
        status: true,
        message: 'Miembros actualizados correctamente',
        data: group,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error updating members',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Detalles del grupo obtenidos correctamente',
  })
  async getProcessGroupById(@Param('id') id: string) {
    try {
      const group = await this.processGroupService.getProcessesByGroupId(id);
      return {
        status: true,
        message: 'Detalles del grupo obtenidos correctamente',
        data: group,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error
              ? error.message
              : 'Error getting group details',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('/:id/plans')
  @ApiResponse({
    status: 200,
    description: 'Planes del grupo eliminados correctamente',
  })
  async deleteGroupPlans(@Param('id') id: string, @Body() ids: string[]) {
    try {
      await this.processGroupService.deleteGroupPlans(id, ids);
      return {
        status: true,
        message: 'Planes del grupo eliminados correctamente',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error
              ? error.message
              : 'Error deleting group plans',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/plans/all')
  @ApiResponse({
    status: 200,
    description: 'Todos los planes obtenidos correctamente',
  })
  async getAllPlans() {
    try {
      const plans = await this.processGroupService.getAllPlans();
      return {
        status: true,
        message: 'Planes obtenidos correctamente',
        data: plans,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error getting all plans',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
