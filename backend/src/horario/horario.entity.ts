import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Disponibilidad } from '../disponibilidad/disponibilidad.entity';

@Entity({ name: 'horario' })
export class Horario {
  @PrimaryGeneratedColumn({ name: 'cod_horario' })
  codHorario: number;

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string;

  @Column({ name: 'hora_final', type: 'time' })
  horaFinal: string;

  @OneToMany(() => Disponibilidad, (disponibilidad) => disponibilidad.horario)
  disponibilidades: Disponibilidad[];
}
