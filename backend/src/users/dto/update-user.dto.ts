import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';

import { CreateUserDto } from './create-user.dto';
import { UserEstado } from '../entities/user.entity';

/**
 * RF07: el Administrador edita cualquier campo del usuario (incluido el rol,
 * heredado de CreateUserDto) y además puede activar o bloquear la cuenta.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEnum(UserEstado, { message: 'El estado debe ser Activo o Bloqueado' })
  estado?: UserEstado;
}
