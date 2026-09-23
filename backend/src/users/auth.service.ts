import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEstado, UserRole } from './entities/user.entity';
import { MailService } from '../mail/mail.service';
import { UsersService } from './users.service';

/** Datos que viajan firmados en el JWT y quedan disponibles en `req.user`. */
export interface UsuarioAutenticado {
  id: string;
  correo: string;
  rol: UserRole;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /**
   * RF01/RF02/RF04: registro público. UsersService.create valida la duplicidad de
   * correo y celular, aplica bcrypt y persiste el usuario. El rol se fuerza a
   * CLIENTE (RF05) y el correo de bienvenida se envía desde aquí SIN await para
   * que un timeout de SMTP no bloquee ni haga fallar la respuesta HTTP.
   */
  async register(createUserDto: CreateUserDto) {
    const usuario = await this.usersService.create(
      createUserDto,
      UserRole.CLIENTE,
      false, // el correo lo dispara este servicio justo debajo
    );

    // RF04: MailService nunca lanza excepciones, solo registra el error.
    void this.mailService
      .enviarCorreoBienvenida(usuario.correo, usuario.nombres, usuario.rol)
      .catch((error: unknown) =>
        this.logger.warn(
          `Correo de bienvenida no enviado a ${usuario.correo}: ${
            error instanceof Error ? error.message : 'error desconocido'
          }`,
        ),
      );

    return {
      message:
        'Cuenta creada correctamente. Te enviamos un correo de confirmación (RF04).',
      usuario,
    };
  }

  /**
   * RF03: valida las credenciales que consume LocalStrategy comparando el hash
   * con bcrypt. RF07: una cuenta bloqueada no puede iniciar sesión.
   */
  async validateUser(
    correo: string,
    password: string,
  ): Promise<UsuarioAutenticado | null> {
    const usuario = await this.usersService.findEntityByCorreo(correo);

    if (!usuario) {
      return null;
    }

    if (usuario.estado !== UserEstado.ACTIVO) {
      throw new UnauthorizedException(
        'Tu cuenta está bloqueada. Contacta al administrador.',
      );
    }

    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) {
      return null;
    }

    return { id: usuario.id, correo: usuario.correo, rol: usuario.rol };
  }

  /** RF03: emite el JWT y devuelve el perfil completo, sin el hash (RNF01). */
  async login(usuario: UsuarioAutenticado) {
    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    return {
      token: this.jwtService.sign(payload),
      usuario: await this.usersService.findOne(usuario.id),
    };
  }

  /** RF03: cierre de sesión; el cliente descarta el token. */
  logout() {
    return { message: 'Sesión cerrada correctamente' };
  }

  /** RF06: perfil del usuario autenticado. */
  async findById(id: string) {
    const usuario = await this.usersService.findEntityById(id);

    if (usuario.estado !== UserEstado.ACTIVO) {
      throw new UnauthorizedException(
        'Tu cuenta está bloqueada. Contacta al administrador.',
      );
    }

    return this.usersService.findOne(id);
  }

  /**
   * RF06: actualiza los datos de contacto y, si viene `password`, la contraseña
   * (bcrypt + validación de duplicados dentro de UsersService).
   */
  updateProfile(id: string, updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(id, updateUserDto);
  }
}