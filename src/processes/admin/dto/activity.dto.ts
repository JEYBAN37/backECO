import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty({ description: 'Nombre de la actividad' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Descripción de la actividad' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Tiempo mínimo en segundos' })
  @IsNumber()
  @IsNotEmpty()
  minTime!: number;

  @ApiProperty({ description: 'Tiempo máximo en segundos' })
  @IsNumber()
  @IsNotEmpty()
  maxTime!: number;

  @ApiProperty({ description: 'Categoría de la actividad' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ description: 'URL del video asociado' })
  @IsString()
  @IsNotEmpty()
  videoUrl!: string;

  @ApiProperty({ description: 'Indica si el sensor está habilitado' })
  @IsBoolean()
  sensorEnabled!: boolean;

  @ApiProperty({ description: 'ID del archivo en Drive', required: false })
  @IsString()
  @IsOptional()
  driveFileId?: string;

  @IsString()
  @IsOptional()
  createdBy?: string;
}

export interface Activity extends CreateActivityDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  duration: number;
}
