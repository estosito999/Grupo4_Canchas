import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { VerificationService } from '../mail/verification.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly verification: VerificationService,
  ) {}

  // RF04: Envío de correo de confirmación
  async sendConfirmationEmail(correo: string) {
    console.log(`[Email Service] Correo de confirmación enviado a: ${correo}`);
    return { message: `Correo de confirmación enviado a ${correo}` };
  }

  async create(createUserDto: CreateUserDto) {
    const { correo } = createUserDto;

    const existingUser = await this.userRepository.findOne({ where: { correo } });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(createUserDto.password, saltRounds);

    const userData = {
      ...createUserDto,
      password_hash,
    };

    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    // Ejecutar envío de correo tras registro exitoso (RF04)
    try { await this.verification.send(savedUser.id); } catch { /* Puede reenviarse desde el perfil. */ }

    return savedUser;
  }

  async login(correo: string, password: string) {
    const user = await this.userRepository.findOne({ where: { correo } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password_hash, ...userData } = user;
    return userData;
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // RF06: Actualización real de datos del usuario
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (updateUserDto.password) {
      user.password_hash = await bcrypt.hash(updateUserDto.password, 10);
      delete updateUserDto.password;
    }
    if (updateUserDto.correo && updateUserDto.correo !== user.correo) {
      user.correo_verificado = false;
      user.verificacion_hash = null;
      user.verificacion_expira = null;
    }
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  // RF07: Cambiar rol de usuario
  async changeRole(id: string, rol: any) {
    const user = await this.findOne(id);
    user.rol = rol;
    return await this.userRepository.save(user);
  }

  // RF07: Cambiar estado (Activo/Bloqueado)
  async changeStatus(id: string, estado: string) {
    const user = await this.findOne(id);
    user.estado = estado;
    return await this.userRepository.save(user);
  }

  // RF08: Búsqueda en directorio de clientes
  async getDirectory(search?: string) {
    if (!search) {
      return await this.userRepository.find({ where: { rol: 'CLIENTE' as any } });
    }
    return await this.userRepository.find({
      where: [
        { nombres: ILike(`%${search}%`), rol: 'CLIENTE' as any },
        { correo: ILike(`%${search}%`), rol: 'CLIENTE' as any },
        { celular: ILike(`%${search}%`), rol: 'CLIENTE' as any },
      ],
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return await this.userRepository.remove(user);
  }
}