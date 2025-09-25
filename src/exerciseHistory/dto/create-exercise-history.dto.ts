import { IsString, IsNumber, IsDate, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateExerciseHistoryDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  idUsuario!: string;

  @ApiProperty()
  @IsString()
  idGrupo!: string;

  @ApiProperty()
  @IsString()
  idPlan!: string;

  @ApiProperty()
  @IsString()
  idEjercicio!: string;

  @ApiProperty()
  @IsNumber()
  tiempo!: number;

  @ApiProperty()
  @IsDate()
  fecha!: Date;

  @ApiProperty()
  @IsString()
  categoria!: string;

  @ApiProperty({ description: 'Fecha de creación', required: true })
  @IsOptional()
  @IsDateString()
  createdAt?: string;

  // Campos adicionales según tu ejemplo
  @ApiProperty()
  @IsString()
  nombre!: string;

  @ApiProperty()
  @IsNumber()
  repeticiones!: number;

  @ApiProperty()
  @IsNumber()
  sensorEnabled!: boolean;

  @ApiProperty()
  @IsString()
  estado!: string;

  @ApiProperty()
  @IsString()
  grupoId!: string;

  @ApiProperty()
  @IsString()
  proceso!: string;

  @ApiProperty()
  @IsString()
  planDePausa!: string;

  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsString()
  actividadId!: string;
}
