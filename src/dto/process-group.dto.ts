import { IsString, IsNotEmpty, IsArray, IsOptional, IsHexColor } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessGroupMemberDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email!: string;
}

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

  @ApiProperty({ description: 'Lista de miembros del grupo', type: [ProcessGroupMemberDto] })
  @IsArray()
  @IsOptional()
  members: ProcessGroupMemberDto[] = [];
}

export class UpdateProcessGroupDto extends CreateProcessGroupDto {}

export class UpdateProcessGroupMembersDto {
  @ApiProperty({ type: [ProcessGroupMemberDto] })
  @IsArray()
  @IsNotEmpty()
  members!: ProcessGroupMemberDto[];
}
