import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { AuthService } from '../users/auth.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secreto_super_seguro',
      signOptions: { expiresIn: '1d' },
    }),
    MailModule, // <--- Importante para inyectar MailService
  ],
  providers: [AuthService],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}