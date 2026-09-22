import { IsIn, IsNotEmpty } from 'class-validator';
import { EstadoCancha } from '../cancha.entity';

export class UpdateEstadoCanchaDto {
  @IsNotEmpty()
  @IsIn([EstadoCancha.DISPONIBLE, EstadoCancha.MANTENIMIENTO, EstadoCancha.INACTIVA], {
    message: 'estado debe ser Disponible, Mantenimiento o Inactiva',
  })
  estado: EstadoCancha;
}
