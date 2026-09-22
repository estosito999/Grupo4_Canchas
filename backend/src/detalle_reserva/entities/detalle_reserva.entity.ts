import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Reserva } from '../../reserva/entities/reserva.entity';

@Entity('detalle_reserva')
export class DetalleReserva {
  @PrimaryGeneratedColumn()
  id_detalle: number;

  @Column({ type: 'time' })
  hora_inicio: string;

  @Column({ type: 'time' })
  hora_fin: string;

  @ManyToOne(() => Reserva, (reserva) => reserva.detalles)
  @JoinColumn({ name: 'id_reserva' })
  reserva: Reserva;

  //pendnte para implementar con el modulo de  canchas
  @ManyToOne(() => Cancha, (cancha) => cancha.detalles)
  @JoinColumn({ name: 'cod_cancha' })
  cancha: Cancha;
}
