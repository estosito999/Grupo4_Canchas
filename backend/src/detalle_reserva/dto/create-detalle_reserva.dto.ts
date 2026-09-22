import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDetalleReservaDto {
  @IsNumber()
  @IsNotEmpty({ message: 'El id es obligatorio' })
  id_detalle: number;

  @IsNumber()
  @IsNotEmpty({ message: 'El id de reserva es obligatorio' })
  id_reserva: number;

}
