// users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy'; // <-- 1. Importar JwtStrategy
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
    MailModule,
  ],
  controllers: [UsersController, AuthController],
  providers: [
    UsersService,
    AuthService,
    JwtAuthGuard,
    LocalStrategy,
    JwtStrategy, // <-- 2. Agregar aquí para registrar la estrategia "jwt"
  ],
  exports: [UsersService, TypeOrmModule, JwtAuthGuard],
})
export class UsersModule {}