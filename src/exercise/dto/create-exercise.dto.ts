import { IsNotEmpty, IsString, IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExerciseDto {
  @ApiProperty({ description: 'Nombre de la actividad' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ description: 'Duración de la actividad (formato mm:ss)' })
  @IsString()
  @IsNotEmpty()
  duracion!: string;

  @ApiProperty({ description: 'Descripción de la actividad' })
  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @ApiProperty({ description: 'Pasos de la actividad' })
  @IsArray()
  @IsString({ each: true })
  pasos!: string[];

  @ApiProperty({ description: 'Icono de la actividad', required: false })
  @IsString()
  @IsOptional()
  icono?: string;

  @ApiProperty({ description: 'URL del video asociado' })
  @IsString()
  @IsNotEmpty()
  videoUrl!: string;

  @ApiProperty({ description: 'Fecha de creación', required: true })
  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @ApiProperty({ description: 'Fecha de última actualización', required: true })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @ApiProperty({ description: 'Indica si el sensor está habilitado', required: true })
  @IsOptional()
  sensorEnabled?: boolean;
}

