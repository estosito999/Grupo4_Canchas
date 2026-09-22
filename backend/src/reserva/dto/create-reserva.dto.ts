import {
  IsDateString,
  IsMilitaryTime,
  IsNotEmpty,
  IsNumber, IsString, IsArray, ValidateNested, IsUUID
} from 'class-validator';

import { Type } from 'class-transformer';

class DetalleReservaDto {
  @IsNumber()
  @IsNotEmpty({ message: 'El codigo de la cancha es obligatorio' })
  codCancha: number;

  @IsString()
  @IsNotEmpty({ message: 'La hora de inicio es obligatorio' })
  hora_inicio: string;

  @IsString()
  @IsNotEmpty({ message: 'La hora de fin es obligatorio' })
  hora_fin: string;
}


export class CreateReservaDto {
  @IsUUID('all', { message: 'El ID del cliente debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El id del cliente es obligatorio' })
  id_usuario: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleReservaDto)
  @IsNotEmpty({ message: 'enviar al menos un detalle de reserva' })
  detalles: DetalleReservaDto[];
}
