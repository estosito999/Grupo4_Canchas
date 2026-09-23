import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

@Module({
  imports: [
    /**
     * RF04: la configuración se resuelve con ConfigService (forRootAsync) para
     * que las variables MAIL_* del .env ya estén cargadas. Con MailerModule.forRoot
     * el transporte se construía al importar el módulo (antes de que ConfigModule
     * leyera el .env), quedaba sin usuario/contraseña y el envío fallaba.
     */
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const port = Number(configService.get<string>('MAIL_PORT')) || 587;

        return {
          transport: {
            host: configService.get<string>('MAIL_HOST') || 'smtp.gmail.com',
            port,
            secure: port === 465,
            auth: {
              user: configService.get<string>('MAIL_USER'),
              pass: configService.get<string>('MAIL_PASS'),
            },
            // Evita que un SMTP lento deje colgada la petición HTTP.
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 10000,
          },
          defaults: {
            from:
              configService.get<string>('MAIL_FROM') ||
              '"Canchas Grupo 4" <no-reply@canchas.com>',
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}