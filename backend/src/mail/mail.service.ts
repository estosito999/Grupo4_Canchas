import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

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