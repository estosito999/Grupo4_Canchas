import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** RF05: roles soportados por el sistema. */
export enum UserRole {
  ADMINISTRADOR = 'ADMINISTRADOR',
  EMPLEADO = 'EMPLEADO',
  CLIENTE = 'CLIENTE',
}

/** RF07: estado de la cuenta (Activo | Bloqueado). */
export enum UserEstado {
  ACTIVO = 'Activo',
  BLOQUEADO = 'Bloqueado',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombres: string;

  @Column({ type: 'varchar', length: 100 })
  apellido_paterno: string;

  @Column({ type: 'varchar', length: 100 })
  apellido_materno: string;

  // RF01/RF02: tipo 'date' => PostgreSQL entrega y recibe 'AAAA-MM-DD'.
  @Column({ type: 'date' })
  fecha_nacimiento: string;

  // RNF03: integridad => correo y celular únicos a nivel de base de datos.
  @Column({ type: 'varchar', length: 150, unique: true })
  correo: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  celular: string;

  // RNF01: solo se guarda el hash bcrypt; @Exclude evita que salga en las respuestas.
  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENTE })
  rol: UserRole; // 'ADMINISTRADOR' | 'EMPLEADO' | 'CLIENTE'

  @Column({ type: 'varchar', length: 20, default: UserEstado.ACTIVO })
  estado: UserEstado; // 'Activo' | 'Bloqueado'

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
