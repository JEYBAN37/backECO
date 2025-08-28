import { IsString, IsArray, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessUploadDto {
  @ApiProperty({ description: 'ID del grupo al que pertenece el proceso' })
  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @ApiProperty({ description: 'Nombre del proceso' })
  @IsString()
  @IsNotEmpty()
  processName!: string;

  @ApiProperty({ 
    type: [String],
    description: 'Array de IDs de planes de pausa a incluir en el proceso'
  })
  @IsArray()
  @IsNotEmpty()
  pausePlanIds!: string[];

  @ApiProperty({ description: 'Fecha de inicio del proceso en formato ISO' })
  @IsDateString()
  startDate!: string;

  constructor(partial: Partial<ProcessUploadDto>) {
    Object.assign(this, partial);
  }
}
