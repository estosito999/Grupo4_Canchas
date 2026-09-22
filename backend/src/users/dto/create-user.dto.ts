import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsMobilePhone,
} from 'class-validator';

export enum UserRole {
  ADMINISTRADOR = 'ADMINISTRADOR',
  EMPLEADO = 'EMPLEADO',
  CLIENTE = 'CLIENTE',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido paterno es obligatorio' })
  apellido_paterno: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido materno es obligatorio' })
  apellido_materno: string;

  @IsDateString()
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  fecha_nacimiento: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  correo: string;

@IsMobilePhone('es-ES', {}, { message: 'El número de celular debe ser válido' })
@IsNotEmpty({ message: 'El celular es obligatorio' })
celular: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;

  @IsEnum(UserRole, { message: 'El rol debe ser ADMINISTRADOR, EMPLEADO o CLIENTE' })
  @IsOptional()
  rol?: UserRole;
}
