import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'correo', // <-- IMPRESCINDIBLE: Passport busca 'username' por defecto
      passwordField: 'password',
    });
  }

  async validate(correo: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(correo, password);
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    return user;
  }
}