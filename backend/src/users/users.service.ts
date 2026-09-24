import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserEstado, UserRole } from './entities/user.entity';
import { VerificationService } from '../mail/verification.service'; // <-- Adaptado (antes MailService)
import * as bcrypt from 'bcrypt';

/** RNF01: bcrypt con 10 rondas, único algoritmo de hashing permitido. */
export const BCRYPT_SALT_ROUNDS = 10;

/** Campos de contacto editables sin tocar rol ni estado. */
type DatosContactoActualizables = {
  nombres?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  fecha_nacimiento?: string;
  correo?: string;
  celular?: string;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly verification: VerificationService, // <-- Inyectado el de tu compañero
  ) {}

  // ---------------------------------------------------------------------------
  // Helpers internos
  // ---------------------------------------------------------------------------

  /** RNF01: hashea la contraseña en texto plano con bcrypt (10 rondas). */
  private hashPassword(passwordPlano: string): Promise<string> {
    return bcrypt.hash(passwordPlano, BCRYPT_SALT_ROUNDS);
  }

  private normalizarCorreo(correo: string): string {
    return correo.trim().toLowerCase();
  }

  /** RNF04: neutraliza comodines de LIKE; el valor viaja como parámetro. */
  private escaparPatronLike(termino: string): string {
    return termino.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
  }

  /** Quita el hash de la respuesta HTTP (RNF01). */
  private sinPasswordHash(usuario: User): Omit<User, 'password_hash' | 'verificacion_hash' | 'verificacion_expira'> {
    const { password_hash, verificacion_hash, verificacion_expira, ...resto } = usuario;
    void password_hash;
    void verificacion_hash;
    void verificacion_expira;
    return resto;
  }

  /**
   * RF02/RF06: verifica en la base de datos que ni el correo ni el celular
   * pertenezcan a otro usuario antes de insertar/actualizar (RNF03 unique).
   */
  private async validarDuplicados(
    correo?: string,
    celular?: string,
    excluirId?: string,
  ): Promise<void> {
    if (correo) {
      const duplicado = await this.userRepository.findOne({
        where: excluirId ? { correo, id: Not(excluirId) } : { correo },
        withDeleted: true,
      });
      if (duplicado) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
    }

    if (celular) {
      const duplicado = await this.userRepository.findOne({
        where: excluirId ? { celular, id: Not(excluirId) } : { celular },
        withDeleted: true,
      });
      if (duplicado) {
        throw new ConflictException('El número de celular ya está registrado');
      }
    }
  }

  /** Traduce la violación de los índices UNIQUE de PostgreSQL (RNF03). */
  private traducirErrorBd(error: unknown): Error {
    if (error instanceof QueryFailedError) {
      const driverError = (
        error as QueryFailedError & {
          driverError?: { code?: string; detail?: string };
        }
      ).driverError;

      if (driverError?.code === '23505') {
        const detalle = driverError.detail ?? '';
        if (detalle.includes('celular')) {
          return new ConflictException(
            'El número de celular ya está registrado',
          );
        }
        if (detalle.includes('correo')) {
          return new ConflictException(
            'El correo electrónico ya está registrado',
          );
        }
        return new ConflictException('El usuario ya se encuentra registrado');
      }
    }

    return error instanceof Error ? error : new Error('Error desconocido');
  }

  /**
   * RF04: correo automático de bienvenida. Se dispara SIN await para que un
   * timeout de SMTP nunca bloquee ni haga fallar la respuesta HTTP.
   */
  private dispararCorreoBienvenida(usuario: User): void {
    // <-- Adaptado a la lógica de tu compañero usando verification.send
    void this.verification
      .send(usuario.id)
      .catch((error: unknown) => {
        this.logger.warn(
          `No se pudo enviar el correo de verificación a ${usuario.correo}: ${
            error instanceof Error ? error.message : 'error desconocido'
          }`,
        );
      });
  }

  /** Copia solo los campos de contacto presentes en el DTO. */
  private aplicarDatosContacto(
    usuario: User,
    datos: DatosContactoActualizables,
  ): void {
    if (datos.nombres !== undefined) {
      usuario.nombres = datos.nombres.trim();
    }
    if (datos.apellido_paterno !== undefined) {
      usuario.apellido_paterno = datos.apellido_paterno.trim();
    }
    if (datos.apellido_materno !== undefined) {
      usuario.apellido_materno = datos.apellido_materno.trim();
    }
    if (datos.fecha_nacimiento !== undefined) {
      usuario.fecha_nacimiento = datos.fecha_nacimiento;
    }
    if (datos.correo !== undefined) {
      if (datos.correo !== usuario.correo) {
        usuario.correo_verificado = false;
        usuario.verificacion_hash = null;
        usuario.verificacion_expira = null;
      }
      usuario.correo = datos.correo;
    }
    if (datos.celular !== undefined) {
      usuario.celular = datos.celular;
    }
  }

  // ---------------------------------------------------------------------------
  // RF01 / RF02 / RF04 / RF05: alta de usuarios
  // ---------------------------------------------------------------------------

  /**
   * Crea un usuario. `rolForzado` lo usa el registro público para garantizar que
   * toda cuenta nueva sea CLIENTE (RF05) aunque el body intente otra cosa.
   * `enviarCorreo` permite que AuthService sea quien dispare el correo (RF04) y
   * evitar envíos duplicados.
   */
  async create(
    createUserDto: CreateUserDto,
    rolForzado?: UserRole,
    enviarCorreo = true,
  ): Promise<Omit<User, 'password_hash' | 'verificacion_hash' | 'verificacion_expira'>> {
    const correo = this.normalizarCorreo(createUserDto.correo);
    const celular = createUserDto.celular.trim();

    // RF02: duplicidad de correo Y celular verificada contra la BD.
    await this.validarDuplicados(correo, celular);

    const usuario = this.userRepository.create({
      nombres: createUserDto.nombres.trim(),
      apellido_paterno: createUserDto.apellido_paterno.trim(),
      apellido_materno: createUserDto.apellido_materno.trim(),
      fecha_nacimiento: createUserDto.fecha_nacimiento,
      correo,
      celular,
      password_hash: await this.hashPassword(createUserDto.password),
      rol: rolForzado ?? createUserDto.rol ?? UserRole.CLIENTE,
      estado: UserEstado.ACTIVO,
    });

    try {
      const guardado = await this.userRepository.save(usuario);

      if (enviarCorreo) {
        this.dispararCorreoBienvenida(guardado); // RF04
      }

      return this.sinPasswordHash(guardado);
    } catch (error) {
      throw this.traducirErrorBd(error);
    }
  }

  // ---------------------------------------------------------------------------
  // Consultas
  // ---------------------------------------------------------------------------

  /** Uso interno (login y JwtStrategy): incluye el hash para poder compararlo. */
  async findEntityById(id: string): Promise<User> {
    const usuario = await this.userRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  /** Uso interno del login (RF03). */
  async findEntityByCorreo(correo: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { correo: this.normalizarCorreo(correo) },
    });
  }

  /** RF07: listado completo para el panel de administración. */
  async findAll(): Promise<Omit<User, 'password_hash' | 'verificacion_hash' | 'verificacion_expira'>[]> {
    const usuarios = await this.userRepository.find({
      order: { apellido_paterno: 'ASC', nombres: 'ASC' },
    });
    return usuarios.map((usuario) => this.sinPasswordHash(usuario));
  }

  async findOne(id: string): Promise<Omit<User, 'password_hash' | 'verificacion_hash' | 'verificacion_expira'>> {
    return this.sinPasswordHash(await this.findEntityById(id));
  }

  /**
   * RF07: edición completa por el Administrador (incluye rol y estado).
   * RF06/RNF01: si llega `password` se hashea con bcrypt (10 rondas) antes de
   * guardar y se elimina el texto plano del DTO.
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actorId?: string,
  ): Promise<Omit<User, 'password_hash' | 'verificacion_hash' | 'verificacion_expira'>> {
    const usuario = await this.findEntityById(id);
    const correo = updateUserDto.correo
      ? this.normalizarCorreo(updateUserDto.correo)
      : undefined;
    const celular = updateUserDto.celular?.trim();

    // RF06: se mantienen las validaciones de datos duplicados al editar.
    await this.validarDuplicados(correo, celular, usuario.id);

    this.aplicarDatosContacto(usuario, {
      nombres: updateUserDto.nombres,
      apellido_paterno: updateUserDto.apellido_paterno,
      apellido_materno: updateUserDto.apellido_materno,
      fecha_nacimiento: updateUserDto.fecha_nacimiento,
      correo,
      celular,
    });

    if (updateUserDto.password) {
      usuario.password_hash = await this.hashPassword(updateUserDto.password);
    }

    if (updateUserDto.rol && updateUserDto.rol !== usuario.rol) {
      if (actorId === usuario.id) {
        throw new BadRequestException('No puedes cambiar tu propio rol');
      }
      usuario.rol = updateUserDto.rol;
    }

    if (updateUserDto.estado && updateUserDto.estado !== usuario.estado) {
      if (
        actorId === usuario.id &&
        updateUserDto.estado === UserEstado.BLOQUEADO
      ) {
        throw new BadRequestException('No puedes bloquear tu propia cuenta');
      }
      usuario.estado = updateUserDto.estado;
    }

    try {
      return this.sinPasswordHash(await this.userRepository.save(usuario));
    } catch (error) {
      throw this.traducirErrorBd(error);
    }
  }

  /**
   * RF06: el propio usuario actualiza sus datos de contacto y, si lo desea, su
   * contraseña. Solo se aplican campos de contacto + password: `rol` y `estado`
   * se ignoran aunque lleguen en el body, por lo que nadie puede auto-ascenderse.
   */
  async updateProfile(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'password_hash' | 'verificacion_hash' | 'verificacion_expira'>> {
    const usuario = await this.findEntityById(id);
    const correo = dto.correo ? this.normalizarCorreo(dto.correo) : undefined;
    const celular = dto.celular?.trim();

    await this.validarDuplicados(correo, celular, usuario.id);

    this.aplicarDatosContacto(usuario, {
      nombres: dto.nombres,
      apellido_paterno: dto.apellido_paterno,
      apellido_materno: dto.apellido_materno,
      fecha_nacimiento: dto.fecha_nacimiento,
      correo,
      celular,
    });

    if (dto.password) {
      usuario.password_hash = await this.hashPassword(dto.password);
    }

    try {
      return this.sinPasswordHash(await this.userRepository.save(usuario));
    } catch (error) {
      throw this.traducirErrorBd(error);
    }
  }

  /**
   * RF08: edición LIMITADA para el Empleado. Solo datos de contacto de clientes.
   * Rechaza explícitamente rol, estado y contraseña (el Empleado no puede
   * alterar roles, estados ni borrar usuarios).
   */
  async updateClientContact(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'password_hash' | 'verificacion_hash' | 'verificacion_expira'>> {
    if (dto.rol || dto.estado || dto.password) {
      throw new BadRequestException(
        'El rol EMPLEADO solo puede actualizar datos de contacto de clientes',
      );
    }

    const cliente = await this.findEntityById(id);

    if (cliente.rol !== UserRole.CLIENTE) {
      throw new BadRequestException(
        'El directorio de empleados solo permite editar datos de clientes',
      );
    }

    const correo = dto.correo ? this.normalizarCorreo(dto.correo) : undefined;
    const celular = dto.celular?.trim();

    await this.validarDuplicados(correo, celular, cliente.id);

    this.aplicarDatosContacto(cliente, {
      nombres: dto.nombres,
      apellido_paterno: dto.apellido_paterno,
      apellido_materno: dto.apellido_materno,
      correo,
      celular,
    });

    try {
      return this.sinPasswordHash(await this.userRepository.save(cliente));
    } catch (error) {
      throw this.traducirErrorBd(error);
    }
  }

  /** RF07: cambio de rol exclusivo del Administrador. */
  async changeRole(
    id: string,
    rol: UserRole,
    actorId?: string,
  ): Promise<Omit<User, 'password_hash' | 'verificacion_hash' | 'verificacion_expira'>> {
    if (!Object.values(UserRole).includes(rol)) {
      throw new BadRequestException(
        'El rol debe ser ADMINISTRADOR, EMPLEADO o CLIENTE',
      );
    }
    if (actorId === id) {
      throw new BadRequestException('No puedes cambiar tu propio rol');
    }
    const usuario = await this.findEntityById(id);
    usuario.rol = rol;
    return this.sinPasswordHash(await this.userRepository.save(usuario));
  }

  /** RF07: activar / bloquear cuentas (Activo | Bloqueado). */
  async changeStatus(
    id: string,
    estado: UserEstado,
    actorId?: string,
  ): Promise<Omit<User, 'password_hash' | 'verificacion_hash' | 'verificacion_expira'>> {
    if (!Object.values(UserEstado).includes(estado)) {
      throw new BadRequestException('El estado debe ser Activo o Bloqueado');
    }
    if (actorId === id && estado === UserEstado.BLOQUEADO) {
      throw new BadRequestException('No puedes bloquear tu propia cuenta');
    }
    const usuario = await this.findEntityById(id);
    usuario.estado = estado;
    return this.sinPasswordHash(await this.userRepository.save(usuario));
  }

  /**
   * RF08: directorio de clientes con búsqueda por nombres, apellidos, correo o
   * celular. RNF04: TypeORM envía el patrón como parámetro (sin concatenar SQL).
   */
  async getDirectory(search?: string): Promise<Omit<User, 'password_hash' | 'verificacion_hash' | 'verificacion_expira'>[]> {
    const termino = search?.trim();

    if (!termino) {
      const clientes = await this.userRepository.find({
        where: { rol: UserRole.CLIENTE },
        order: { apellido_paterno: 'ASC', nombres: 'ASC' },
      });
      return clientes.map((cliente) => this.sinPasswordHash(cliente));
    }

    if (termino.length > 80) {
      throw new BadRequestException(
        'El término de búsqueda no puede superar 80 caracteres',
      );
    }

    const patron = ILike(`%${this.escaparPatronLike(termino)}%`);
    const clientes = await this.userRepository.find({
      where: [
        { rol: UserRole.CLIENTE, nombres: patron },
        { rol: UserRole.CLIENTE, apellido_paterno: patron },
        { rol: UserRole.CLIENTE, apellido_materno: patron },
        { rol: UserRole.CLIENTE, correo: patron },
        { rol: UserRole.CLIENTE, celular: patron },
      ],
      order: { apellido_paterno: 'ASC', nombres: 'ASC' },
    });
    return clientes.map((cliente) => this.sinPasswordHash(cliente));
  }

  /** RF07: eliminación de usuarios, exclusiva del Administrador. */
  async remove(id: string, actorId?: string): Promise<{ message: string }> {
    if (actorId === id) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    }
    const usuario = await this.findEntityById(id);
    await this.userRepository.softRemove(usuario);
    return { message: 'Usuario eliminado correctamente' };
  }
}
