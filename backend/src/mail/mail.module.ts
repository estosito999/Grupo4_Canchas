import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { VerificationService } from './verification.service';
import { MailService } from './mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
      transport: {
        host: config.get<string>('MAIL_HOST') || 'smtp.gmail.com',
        port: Number(config.get<string>('MAIL_PORT')) || 587,
        secure: Number(config.get<string>('MAIL_PORT')) === 465,
        auth: {
          user: config.get<string>('MAIL_USER'),
          pass: config.get<string>('MAIL_PASS'),
        },
      },
      defaults: {
        from: config.get<string>('MAIL_FROM') || config.get<string>('MAIL_USER') || 'no-reply@canchas.com',
      },
      }),
    }),
  ],
  providers: [MailService, VerificationService],
  exports: [MailService, VerificationService],
})
export class MailModule {}