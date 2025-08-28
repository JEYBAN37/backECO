import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  name!: string;

  @IsString()
  lastName!: string;

  @IsString()
  avatarColor!: string;
}
