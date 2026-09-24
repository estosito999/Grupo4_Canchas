// backend/src/users/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserEstado, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

/** Contenido que AuthService firma dentro del token. */
interface JwtPayload {
  sub: string;
  correo: string;
  rol: UserRole;
}

/**
 * RF03: valida el token Bearer en cada petición protegida.
 * RF07: además confirma contra la base de datos que la cuenta siga activa, así
 * un usuario bloqueado pierde el acceso de inmediato aunque tenga token.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'secreto_super_seguro',
    });
  }

  async validate(payload: JwtPayload) {
    // Retorna los datos que se inyectarán en req.user
    const usuario = await this.usersService.findEntityById(payload.sub);

    if (usuario.estado !== UserEstado.ACTIVO) {
      throw new UnauthorizedException(
        'Tu cuenta se encuentra bloqueada. Contacta al administrador.',
      );
    }

    return {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    };
  }
}