import {
  Controller,
  Query,
  Res,
  Get,
  Post,
  Put,
  Patch, // <-- Agregado nuevamente para evitar el error en @Patch(':id')
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { VerificationService } from '../mail/verification.service';

import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

interface RequestWithUser extends Request {
  user: any;
}

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

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly verification: VerificationService) {}

  @Post('reenviar-verificacion')
  @UseGuards(JwtAuthGuard)
  reenviar(@Req() req: RequestWithUser) {
    return this.verification.send(req.user.id);
  }

  @Get('verificar-correo')
  async verificar(@Query('token') token: string, @Res() res: Response) {
    let message = 'Correo verificado';
    let status = 200;
    try { await this.verification.verify(token); }
    catch { message = 'Enlace inválido, vencido o ya utilizado. Solicita otro desde tu perfil.'; status = 400; }
    res.status(status).set('Cache-Control', 'no-store').set('Referrer-Policy', 'no-referrer').type('html').send(
      '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verificación de correo</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#ecfdf5;font-family:Arial;color:#064e3b"><h1 style="padding:24px;text-align:center">' + message + '</h1></body></html>'
    );
  }

  @Post('registro')
  registro(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Req() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  perfil(@Req() req: RequestWithUser) {
    return this.authService.findById(req.user.id);
  }

  // Acepta PUT desde el frontend para actualizar perfil
  @Put('perfil')
  @UseGuards(JwtAuthGuard)
  actualizarPerfil(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.update(req.user.id, updateUserDto);
  }
}