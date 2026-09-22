import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: any) {
    const { correo } = createUserDto;

    // Verificar si el correo ya existe
    const existingUser = await this.userRepository.findOne({ where: { correo } });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(createUserDto.password, saltRounds);

    // Preparar el usuario para crear
    const userData = {
      ...createUserDto,
      password_hash,
    };

    // Crear el usuario
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
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