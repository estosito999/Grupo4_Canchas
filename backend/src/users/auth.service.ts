import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(createUserDto: any) {
    const { correo, password, nombres } = createUserDto;

    // 1. Verificar si el correo ya existe
    const existingUser = await this.userRepository.findOne({ where: { correo } });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // 2. Hash de la contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 3. Preparar datos y guardar en PostgreSQL
    const userData = {
      ...createUserDto,
      password_hash,
    };
    delete userData.password;

    const user = this.userRepository.create(userData);
    const usuarioGuardado = await this.userRepository.save(user);

    // 4. Enviar correo AUTOMÁTICO usando las variables destructuradas
    await this.mailService.enviarCorreoBienvenida(correo, nombres);

    // 5. Retornar respuesta sin la contraseña
    const usuarioRespuesta = { ...usuarioGuardado };
        delete (usuarioRespuesta as any).password_hash;
  }

  async validateUser(correo: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { correo } });
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, correo: user.correo, rol: user.rol };
    return {
      token: this.jwtService.sign(payload),
      usuario: user,
    };
  }

  async findById(id: string) {
    return await this.userRepository.findOne({ where: { id } });
  }

  async update(id: string, updateUserDto: any) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }
}