import { IsEmail, IsNotEmpty, IsString, MinLength, IsInt } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  lastName!: string;

  @IsEmail()
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'El género es obligatorio' })
  gender!: string;

  @IsInt({ message: 'El color del avatar debe ser un número entero' })
  @IsNotEmpty({ message: 'El color del avatar es obligatorio' })
  avatarColor!: number;
}
