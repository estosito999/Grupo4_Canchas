import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @Column({ default: false })
  correo_verificado: boolean;

  @Column({ type: 'varchar', nullable: true, select: false })
  verificacion_hash: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  verificacion_expira: Date | null;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombres: string;

  @Column({ type: 'varchar', length: 100 })
  apellido_paterno: string;

  @Column({ type: 'varchar', length: 100 })
  apellido_materno: string;

  @Column({ type: 'date' })
  fecha_nacimiento: Date;

  @Column({ type: 'varchar', length: 150, unique: true })
  correo: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  celular: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'enum', enum: ['ADMINISTRADOR', 'EMPLEADO', 'CLIENTE'], default: 'CLIENTE' })
  rol: string; // 'ADMINISTRADOR', 'EMPLEADO', 'CLIENTE'

  // Agrega esta columna
  @Column({ type: 'varchar', default: 'Activo' })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
