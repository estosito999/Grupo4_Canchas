// backend/src/auth/jwt.strategy.ts (o la ruta correspondiente en tu proyecto)
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secreto_super_seguro',
    });
  }

  async validate(payload: any) {
    // Retorna los datos que se inyectarán en req.user
    return { id: payload.sub, correo: payload.correo };
  }
}