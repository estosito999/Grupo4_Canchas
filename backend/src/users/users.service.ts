import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCK_MINUTES = 15;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return user;
  }

  // Lo usa el AuthModule para el login
  async findByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailTaken = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (emailTaken) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  // Baja lógica: "inhabilitar usuario" según el caso de uso de la iteración 1
  async remove(id: string) {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.userRepository.save(user);
    return { message: 'Usuario inhabilitado correctamente' };
  }

  // Cambio de contraseña del propio usuario (perfil)
  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.findOne(id);

    const ok = await bcrypt.compare(dto.currentPassword, user.password);
    if (!ok) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    user.password = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);
    await this.userRepository.save(user);
    return { message: 'Contraseña actualizada correctamente' };
  }

  // Bloqueo por intentos fallidos de login
  async registerFailedAttempt(user: User) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= this.MAX_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + this.LOCK_MINUTES * 60 * 1000);
      user.failedLoginAttempts = 0;
    }
    await this.userRepository.save(user);
  }

  async resetLoginAttempts(user: User) {
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await this.userRepository.save(user);
  }

  // Lo usa el script seed-admin.ts
  async setRole(id: string, role: UserRole) {
    const user = await this.findOne(id);
    user.role = role;
    return await this.userRepository.save(user);
  }
}