import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Disponibilidad } from '../disponibilidad/disponibilidad.entity';

export enum EstadoCancha {
  DISPONIBLE = 'Disponible',
  MANTENIMIENTO = 'Mantenimiento',
  INACTIVA = 'Inactiva',
}

@Entity({ name: 'cancha' })
export class Cancha {
  @PrimaryGeneratedColumn({ name: 'cod_cancha' })
  codCancha: number;

  @Column({ name: 'nombre_cancha', type: 'varchar', length: 100, unique: true })
  nombreCancha: string;

  @Column({ name: 'tipo_cancha', type: 'varchar', length: 50 })
  tipoCancha: string;

  @Column({ name: 'tipo_suelo', type: 'varchar', length: 50 })
  tipoSuelo: string;

  @Column({ name: 'precio_hora', type: 'decimal', precision: 10, scale: 2 })
  precioHora: number;

  // 'SI' | 'NO' según la tabla original (VARCHAR(2))
  @Column({ name: 'cubierta', type: 'varchar', length: 2, nullable: true })
  cubierta: string;

  @Column({
    name: 'estado',
    type: 'varchar',
    length: 30,
    default: EstadoCancha.DISPONIBLE,
  })
  estado: EstadoCancha;

  @OneToMany(() => Disponibilidad, (disponibilidad) => disponibilidad.cancha)
  disponibilidades: Disponibilidad[];
}
