import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Cancha } from '../cancha/cancha.entity';
import { Horario } from '../horario/horario.entity';

@Entity({ name: 'disponibilidad' })
export class Disponibilidad {
  @PrimaryColumn({ name: 'cod_cancha' })
  codCancha: number;

  @PrimaryColumn({ name: 'cod_horario' })
  codHorario: number;

  @ManyToOne(() => Cancha, (cancha) => cancha.disponibilidades, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cod_cancha' })
  cancha: Cancha;

  @ManyToOne(() => Horario, (horario) => horario.disponibilidades, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cod_horario' })
  horario: Horario;
}
