import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateExerciseDto {
    
  @ApiProperty({ description: 'Nombre de la actividad', required: false })
  nombre?: string;

  @ApiProperty({ description: 'Duración de la actividad (formato mm:ss)', required: false })
  @IsString()
  @IsOptional()
  duracion?: string;

  @ApiProperty({ description: 'Descripción de la actividad', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Pasos de la actividad', required: false })
  @IsArray()
  @IsString({ each: true })
  pasos?: string[];

  @ApiProperty({ description: 'Icono de la actividad', required: false })
  @IsString()
  @IsOptional()
  icono?: string;

  @ApiProperty({ description: 'URL del video asociado', required: false })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiProperty({ description: 'Indica si el sensor está habilitado', required: false })
  @IsOptional()
  sensorEnabled?: boolean;
}

