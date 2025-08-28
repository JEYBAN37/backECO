import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsIn, Min, Max, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ActivityType {
  EXERCISE = 'exercise',
  MEDITATION = 'meditation',
  BREATHING = 'breathing'
}

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
  @Min(10)
  @Max(30)
  minTime!: number;

  @ApiProperty({ description: 'Tiempo máximo en segundos' })
  @IsNumber()
  @Min(10)
  @Max(120)
  maxTime!: number;

  @ApiProperty({ description: 'Categoría de la actividad' })
  @IsString()
  @IsIn([
    'Visual',
    'Auditiva',
    'Cognitiva',
    'Tren Superior',
    'Tren Inferior',
    'Movilidad Articular',
    'Estiramientos Generales',
  ])
  category!: string;

  @ApiProperty({ description: 'URL del video asociado' })
  @IsString()
  @IsNotEmpty()
  videoUrl!: string;

  @ApiProperty({ description: 'Indica si el sensor está habilitado' })
  @IsBoolean()
  sensorEnabled!: boolean;

  @ApiProperty({ description: 'Fecha de creación', required: false })
  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @ApiProperty({ description: 'Fecha de última actualización', required: false })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @IsNotEmpty()
  @IsEnum(ActivityType)
  type!: ActivityType;

  @IsNotEmpty()
  @IsNumber()
  duration!: number;
  
  @ApiProperty({ description: 'ID del archivo en Drive', required: false })
  @IsString()
  @IsOptional()
  driveFileId?: string;

}
