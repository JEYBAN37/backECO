import { IsString, IsNumber, IsDate, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateMotivoDto {
  @ApiProperty()
  @IsString()
  titulo!: string;

  @ApiProperty()
  @IsString()
  descripcion!: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  estado!: boolean;
}
