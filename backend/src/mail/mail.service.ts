import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * RF04: correo automático de bienvenida al crear una cuenta.
   *
   * Nunca lanza excepciones: un timeout o un error de SMTP no debe bloquear ni
   * hacer fallar la respuesta HTTP del registro (RF01). Devuelve `true` cuando
   * el correo salió y `false` cuando se omitió o falló.
   */
  async enviarCorreoBienvenida(
    correoCliente: string,
    nombreCliente: string,
    rol?: string,
  ): Promise<boolean> {
    const usuario = this.configService.get<string>('MAIL_USER');
    const password = this.configService.get<string>('MAIL_PASS');

    if (!usuario || !password) {
      this.logger.warn(
        'MAIL_USER/MAIL_PASS no están configurados en el .env: se omite el correo de bienvenida (RF04).',
      );
      return false;
    }

    try {
      await this.mailerService.sendMail({
        to: correoCliente,
        subject: '¡Bienvenido a Reserva de Canchas!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #047857;">¡Hola, ${nombreCliente}! 👋</h2>
            <p>Tu cuenta ha sido creada con éxito en la plataforma de <b>Reserva de Canchas</b>.</p>
            <p>Ya puedes iniciar sesión con tu correo: <b>${correoCliente}</b>.</p>
            ${rol ? `<p>Rol asignado: <b>${rol}</b>.</p>` : ''}
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">Este es un mensaje automático, por favor no respondas a este correo.</p>
          </div>
        `,
      });
      this.logger.log(`Correo automático enviado a: ${correoCliente} (RF04)`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error al enviar el correo automático a ${correoCliente}: ${
          error instanceof Error ? error.message : 'error desconocido'
        }. Verifica MAIL_HOST/MAIL_PORT/MAIL_USER/MAIL_PASS (Gmail requiere una contraseña de aplicación).`,
      );
      return false;
    }
  }
}