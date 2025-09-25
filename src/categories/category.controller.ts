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
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminAuthGuard } from 'src/admin/admin-auth.guard';
import { CreateCategoryDto } from './dto/category.dto';
import { CategoryService } from './category.service';
import { UpdateCategoryDto } from './dto/category.update.dto';

@ApiTags('Categorías')
@Controller('admin/categorias') // Make sure base path matches
//@UseGuards(AdminAuthGuard)
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoryService: CategoryService) {}

  @Post() // Change from 'create' to just @Post()
  @ApiResponse({ status: 201, description: 'Categoría creada correctamente' })
  async createCategory(@Body() category: CreateCategoryDto) {
    try {
      this.logger.log('📝 Creando nueva categoría');
      const createdCategory = await this.categoryService.createCategory(category);

      return {
        status: true,
        message: 'Categoría creada exitosamente',
        data: createdCategory,
      };
    } catch (error) {
      this.logger.error('Error creando categoría:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error creando categoría',
          error: 'CATEGORY_CREATE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías obtenida correctamente',
  })
  async getCategories(@Req() request: Request) {
    try {
      this.logger.debug(`📋 Getting categories for user: ${request.user?.email}`);
      const categories = await this.categoryService.getCategories();

      return {
        status: true,
        message: 'Categorías obtenidas correctamente',
        data: categories,
      };
    } catch (error) {
      this.logger.error('Error obteniendo categorías:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error obteniendo categorías',
          error: 'CATEGORIES_FETCH_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @Put(':id')
  @ApiResponse({ status: 200, description: 'Plan actualizado correctamente' })
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdateCategoryDto,
  ) {
    try {
      const category = await this.categoryService.updateCategory(id, updatePlanDto);

      return {
        status: true,
        message: 'Categoría actualizada exitosamente',
        data: category,
      };
    } catch (error) {
      this.logger.error('Error actualizando categoría:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error actualizando categoría',
          error: 'CATEGORY_UPDATE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }



  @Post('pause-categories')
  async PausedCategories(response: any) {
    try {
      this.logger.log(`📝 Pausando categoría: ${response.id}`);
      const category = await this.categoryService.PausedCategories(response);
      return {
        status: true,
        message: 'Categoría pausada exitosamente',
        data: category,
      };
    } catch (error) {
      this.logger.error('Error pausando categoría:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error pausando categoría',
          error: 'CATEGORY_UPDATE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Categoría eliminada correctamente' })
  async deleteCategory(@Param('id') id: string) {
    try {
      this.logger.log(`📝 Eliminando categoría: ${id}`);
      await this.categoryService.deleteCategory(id);
      return {
        status: true,
        message: 'Categoría eliminada exitosamente',
      };
    } catch (error) {
      this.logger.error('Error eliminando categoría:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error eliminando categoría',
          error: 'CATEGORY_DELETE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @Post('get-categories-with-exercises')
  async getCategoriesWithExercises(@Body() { ids }: { ids: string[] }) {
    try {
      const categories = await this.categoryService.getCategoriesWithActivitiesByIds({ ids });
      return {
        status: true,
        message: 'Categorías obtenidas exitosamente',
        data: categories,
      };
    } catch (error) {
      this.logger.error('Error obteniendo categorías:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error obteniendo categorías',
          error: 'CATEGORY_UNPAUSE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-by-ids/:id')
  async getCategoriesByUser(@Param('id') ids: string): Promise<any[]> {
    try {
      return this.categoryService.getCategoryRecentActivities(ids);
    } catch (error) {
      this.logger.error('Error obteniendo categorías:', error);
      throw new HttpException(
        {
          status: false,
          message:
            error instanceof Error ? error.message : 'Error obteniendo categorías',
          error: 'CATEGORY_UNPAUSE_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
