import { PartialType } from '@nestjs/mapped-types';
import { CreateDetalleReservaDto } from './create-detalle_reserva.dto';

export class UpdateDetalleReservaDto extends PartialType(CreateDetalleReservaDto) {}
