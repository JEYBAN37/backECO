import { IsNotEmpty, IsString, IsArray, ValidateNested, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class PlanActivityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'El ID de la actividad es requerido' })
  activityId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0, { message: 'El orden debe ser mayor o igual a 0' })
  order!: number;
}

export class CreatePlanDto {
  @ApiProperty({ description: 'Nombre del plan' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Descripción del plan' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Lista de actividades del plan' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanActivityDto)
  activities!: PlanActivityDto[];

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsDateString()
  @IsNotEmpty()
  createdAt!: string;
}

export interface Plan extends CreatePlanDto {
  id: string;
  updatedAt: string;
}
