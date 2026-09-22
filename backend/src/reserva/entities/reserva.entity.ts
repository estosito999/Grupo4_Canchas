import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { DetalleReserva } from '../../detalle_reserva/entities/detalle_reserva.entity';
import { User} from '../../users/entities/user.entity';

@Entity('reserva')
export class Reserva {
  @PrimaryGeneratedColumn()
  id_reserva: number;

  @IsOptional()
  @IsDateString()
  @Column({ type: 'timestamp', nullable: true })
  fecha_reserva: string;

  @IsOptional()
  @IsString()
  @Column({ type: 'varchar', default: 'PENDIENTE' })
  estado: string;

  @OneToMany(() => DetalleReserva, (detalleReserva) => detalleReserva.reserva)
  detalles: DetalleReserva[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_usuario' })
  usuario: User;
}
