import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  displayName!: string;

  @IsString()
  phoneNumber!: string;

  @IsString()
  password!: string;

  @IsString()
  gender!: string;

  @IsString()
  avatarColor!: string;

  @IsString()
  name!: string;
  
  @IsString()
  lastName!: string;
}
