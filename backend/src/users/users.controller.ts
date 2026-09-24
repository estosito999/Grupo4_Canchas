import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEstado, UserRole } from './entities/user.entity';
import { JwtAuthGuard, Roles, RolesGuard } from './jwt-auth.guard';

/** `req.user` lo inyecta JwtStrategy con los datos firmados en el token. */
interface RequestWithUser extends Request {
  user?: { id: string; correo: string; rol: UserRole };
}

/**
 * RF07 (Administrador) y RF08 (Empleado): gestión de usuarios protegida con JWT
 * y por rol. El Empleado solo accede al directorio de clientes y a la edición
 * limitada de sus datos de contacto: no puede cambiar roles, estados ni borrar.
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** RF07: el Administrador crea usuarios completos y decide el rol. */
  @Post()
  @Roles(UserRole.ADMINISTRADOR)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /** RF07: listado completo de usuarios. */
  @Get()
  @Roles(UserRole.ADMINISTRADOR)
  findAll() {
    return this.usersService.findAll();
  }

  /** RF08: directorio con filtro de búsqueda (debe ir antes de :id). */
  @Get('directory')
  @Roles(UserRole.ADMINISTRADOR, UserRole.EMPLEADO)
  getDirectory(@Query('search') search?: string) {
    return this.usersService.getDirectory(search);
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRADOR)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  /** RF07: edición completa de datos, rol y estado. */
  @Patch(':id')
  @Roles(UserRole.ADMINISTRADOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    return this.usersService.update(id, updateUserDto, req.user?.id);
  }

  /** RF08: edición LIMITADA de contacto de un cliente (Admin y Empleado). */
  @Patch(':id/contacto')
  @Roles(UserRole.ADMINISTRADOR, UserRole.EMPLEADO)
  updateContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateClientContact(id, updateUserDto);
  }

  /** RF07: cambio de rol (exclusivo del Administrador). */
  @Patch(':id/role')
  @Roles(UserRole.ADMINISTRADOR)
  changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('rol') rol: string,
    @Req() req: RequestWithUser,
  ) {
    return this.usersService.changeRole(id, rol as UserRole, req.user?.id);
  }

  /** RF07: activar / bloquear cuenta (exclusivo del Administrador). */
  @Patch(':id/status')
  @Roles(UserRole.ADMINISTRADOR)
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estado') estado: string,
    @Req() req: RequestWithUser,
  ) {
    return this.usersService.changeStatus(
      id,
      estado as UserEstado,
      req.user?.id,
    );
  }

  /** RF07: eliminar usuario (exclusivo del Administrador). */
  @Delete(':id')
  @Roles(UserRole.ADMINISTRADOR)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.usersService.remove(id, req.user?.id);
  }
}

// Los endpoints de autenticación viven en ./auth.controller.ts (AuthModule),
// que es el único controlador con @Controller('auth') del proyecto.
