import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, MoreThan } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';
import { MailService } from './mail.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async send(id: string) {
    const user = await this.users.findOneByOrFail({ id });
    if (user.correo_verificado) return { message: 'Tu correo ya está verificado.' };
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(token).digest('hex');
    await this.users.update({ id, correo: user.correo }, {
      verificacion_hash: hash,
      verificacion_expira: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const base = this.config.get<string>('PUBLIC_API_URL') || 'http://localhost:3000/api';
    try {
      await this.mail.enviarVerificacion(user.correo, `${base.replace(/\/$/, '')}/auth/verificar-correo?token=${token}`);
    } catch {
      await this.users.update({ id, verificacion_hash: hash }, { verificacion_hash: null, verificacion_expira: null });
      throw new ServiceUnavailableException('No se pudo enviar el correo. Inténtalo de nuevo desde tu perfil.');
    }
    return { message: 'Te enviamos un correo con el botón Verificar correo.' };
  }

  async verify(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token || '')) throw new BadRequestException('Enlace inválido o vencido. Solicita otro desde tu perfil.');
    const result = await this.users.update({
      verificacion_hash: createHash('sha256').update(token).digest('hex'),
      verificacion_expira: MoreThan(new Date()),
      correo_verificado: false,
    }, { correo_verificado: true, verificacion_hash: null, verificacion_expira: null });
    if (!result.affected) throw new BadRequestException('Enlace inválido, vencido o ya utilizado. Solicita otro desde tu perfil.');
  }
}
