import { IsNotEmpty, IsString, IsArray, ValidateNested, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ActivitiesDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'El ID de la actividad es requerido' })
  actividadId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0, { message: 'El orden debe ser mayor o igual a 0' })
  order!: number;
}

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nombre del plan' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ description: 'Descripción del plan' })
  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @ApiProperty({ description: 'Color del plan' })
  @IsNotEmpty()
  color!: number;

  @ApiProperty({ description: 'Lista de actividades del plan' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivitiesDto)
  activities!: ActivitiesDto[];

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsDateString()
  @IsNotEmpty()
  createdAt!: string;

  status?: boolean;
}

export interface Category extends CreateCategoryDto {
  id?: string;
  updatedAt?: string;
}
