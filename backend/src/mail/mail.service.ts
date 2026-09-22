import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async enviarVerificacion(correo: string, enlace: string) {
    await this.mailerService.sendMail({
      to: correo,
      subject: 'Verifica tu correo — Canchas Grupo 4',
      text: 'Verifica tu correo abriendo este enlace (válido por 24 horas): ' + enlace,
      html: '<div style="font-family:Arial;padding:24px"><h2>Verifica tu correo</h2><p>Confirma tu dirección para completar tu registro.</p><a style="display:inline-block;background:#047857;color:white;padding:14px 24px;border-radius:8px;text-decoration:none" href="' + enlace + '">Verificar correo</a><p>El enlace vence en 24 horas.</p></div>',
    });
  }

  async enviarCorreoBienvenida(correoCliente: string, nombreCliente: string) {
    try {
      await this.mailerService.sendMail({
        to: correoCliente,
        subject: '¡Bienvenido a Reserva de Canchas!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #047857;">¡Hola, ${nombreCliente}! 👋</h2>
            <p>Tu cuenta ha sido creada con éxito en la plataforma de <b>Reserva de Canchas</b>.</p>
            <p>Ya puedes iniciar sesión con tu correo: <b>${correoCliente}</b>.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">Este es un mensaje automático, por favor no respondas a este correo.</p>
          </div>
        `,
      });
      console.log(`Correo automático enviado a: ${correoCliente}`);
    } catch (error) {
      console.error('Error al enviar el correo automático:', error);
    }
  }
}