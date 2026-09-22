import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // RF08: Directorio con filtro de búsqueda (debe ir antes de :id)
  @Get('directory')
  getDirectory(@Query('search') search?: string) {
    return this.usersService.getDirectory(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  // RF07: Endpoint para cambiar rol
  @Patch(':id/role')
  changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('rol') rol: string,
  ) {
    return this.usersService.changeRole(id, rol);
  }

  // RF07: Endpoint para cambiar estado
  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estado') estado: string,
  ) {
    return this.usersService.changeStatus(id, estado);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('registro')
  registro(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  login(@Body('correo') correo: string, @Body('password') password: string) {
    return this.usersService.login(correo, password);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  perfil(@Body('user') user: User) {
    return this.usersService.findOne(user.id);
  }

  @Patch('perfil')
  @UseGuards(JwtAuthGuard)
  actualizarPerfil(
    @Body('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }
}