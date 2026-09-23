import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';

import { AuthController } from '../users/auth.controller';
import { AuthService } from '../users/auth.service';
import { JwtAuthGuard, RolesGuard } from '../users/jwt-auth.guard';
import { JwtStrategy } from '../users/jwt.strategy';
import { LocalStrategy } from '../users/local.strategy';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

/**
 * RF03: módulo de autenticación.
 *
 * Dependencias en UNA sola dirección para evitar ciclos:
 *   AuthModule -> UsersModule (reutiliza UsersService, no duplica lógica)
 *   AuthModule -> MailModule  (RF04)
 * El módulo de usuarios NO importa este módulo, así que ya no hay AuthService
 * duplicado ni riesgo de dependencias circulares/UnknownDependenciesException.
 *
 * JwtModule.registerAsync se usa para que JWT_SECRET ya esté leído del .env
 * (con register() el secreto se resolvía antes de cargar ConfigModule).
 */
@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') || 'secreto_super_seguro',
        signOptions: {
          expiresIn: configService.get<StringValue>('JWT_EXPIRES_IN') ?? '1d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}