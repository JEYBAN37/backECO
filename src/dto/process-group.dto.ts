import { IsString, IsNotEmpty, IsArray, IsOptional, IsHexColor } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProcessGroupDto {
  @ApiProperty({ description: 'Nombre del grupo de proceso' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Descripción del grupo' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Color en formato hexadecimal' })
  @IsHexColor()
  @IsNotEmpty()
  color!: string;

  @ApiProperty({ description: 'Lista de miembros del grupo' })
  @IsArray()
  @IsOptional()
  members: string[] = [];
}

export class UpdateProcessGroupDto extends CreateProcessGroupDto {}

export class UpdateProcessGroupMembersDto {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  members!: string[];
}
