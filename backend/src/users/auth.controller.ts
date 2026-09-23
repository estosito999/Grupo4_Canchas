import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';

interface RequestWithUser extends Request {
  user?: { id: string; correo: string; rol: UserRole };
}

/**
 * RF01/RF03/RF04/RF06: registro público, inicio y cierre de sesión y edición del
 * propio perfil. Es el ÚNICO controlador con @Controller('auth') del proyecto
 * (antes existía una copia duplicada dentro de users.controller.ts).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  registro(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  /** RF03: login validado con la estrategia local (contraseña con bcrypt). */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  login(@Req() req: RequestWithUser) {
    return this.authService.login(req.user!);
  }

  /** RF03: cierre de sesión (el cliente descarta el token). */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout() {
    return this.authService.logout();
  }

  /** RF06: perfil del usuario autenticado. */
  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  perfil(@Req() req: RequestWithUser) {
    return this.authService.findById(req.user!.id);
  }

  // Acepta PUT desde el frontend para actualizar perfil (RF06)
  @Put('perfil')
  @UseGuards(JwtAuthGuard)
  actualizarPerfil(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateProfile(req.user!.id, updateUserDto);
  }

  /** RF06: se acepta también PATCH para el mismo recurso. */
  @Patch('perfil')
  @UseGuards(JwtAuthGuard)
  actualizarPerfilParcial(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateProfile(req.user!.id, updateUserDto);
  }
}