import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { VerificationService } from '../mail/verification.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly verification: VerificationService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { correo, password } = createUserDto;

    // 1. Verificar si el correo ya existe
    const existingUser = await this.userRepository.findOne({ where: { correo } });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // 2. Hash de la contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 3. Preparar datos y guardar en PostgreSQL
    const { password: omittedPassword, ...fields } = createUserDto;
    const userData = {
      ...fields,
      password_hash,
    };


    const user = this.userRepository.create(userData);
    const usuarioGuardado = await this.userRepository.save(user);

    // 4. Enviar correo AUTOMÁTICO usando las variables destructuradas
    let message: string;
    try { message = (await this.verification.send(usuarioGuardado.id)).message; }
    catch { message = 'Cuenta creada. No se pudo enviar el correo de verificación; solicítalo desde tu perfil.'; }

    // 5. Retornar respuesta sin la contraseña
    const usuarioRespuesta = { ...usuarioGuardado };
        delete (usuarioRespuesta as any).password_hash;
    return { usuario: usuarioRespuesta, message };
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

    if (updateUserDto.correo && updateUserDto.correo !== user.correo) {
      user.correo_verificado = false;
      user.verificacion_hash = null;
      user.verificacion_expira = null;
    }
    if (updateUserDto.password) {
      user.password_hash = await bcrypt.hash(updateUserDto.password, 10);
      delete updateUserDto.password;
    }
    Object.assign(user, updateUserDto);
    const saved = await this.userRepository.save(user);
    const { password_hash, verificacion_hash, verificacion_expira, ...publicUser } = saved;
    return publicUser;
  }
}