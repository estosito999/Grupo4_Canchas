import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { UserRole } from './entities/user.entity';

/** Clave de metadatos que consume RolesGuard. */
export const ROLES_KEY = 'roles';

/**
 * RF05/RF07/RF08: declara los roles autorizados para un controlador o handler.
 * Ejemplo: @Roles(UserRole.ADMINISTRADOR)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** RF03: exige un JWT válido (Bearer) en la cabecera Authorization. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/**
 * RF05/RF07/RF08: autoriza comparando el rol firmado en el JWT con los roles
 * declarados con @Roles(). Siempre se usa después de JwtAuthGuard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { rol?: UserRole } }>();

    if (!request.user?.rol) {
      throw new ForbiddenException(
        'No se pudo identificar al usuario autenticado',
      );
    }

    if (!rolesRequeridos.includes(request.user.rol)) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción con tu rol actual',
      );
    }

    return true;
  }
}