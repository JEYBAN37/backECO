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
  nombre!: string;

  @IsArray()
  @IsNotEmpty()
  categories!: string[];

  @ApiProperty({ description: 'Fecha de inicio del proceso en formato ISO' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'Fecha de fin del proceso en formato ISO' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ description: 'Estado del proceso' })
  estado?: string;

  constructor(partial: Partial<ProcessUploadDto>) {
    Object.assign(this, partial);
  }
}
