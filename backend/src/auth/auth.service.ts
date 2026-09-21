import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new ForbiddenException('La cuenta está inhabilitada');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        'Cuenta bloqueada temporalmente por intentos fallidos. Intenta más tarde.',
      );
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      await this.usersService.registerFailedAttempt(user);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.usersService.resetLoginAttempts(user);

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user,
    };
  }
}