import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  Query,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express'; // <-- Cambiado a "import type"

import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { VerificationService } from '../mail/verification.service';

interface RequestWithUser extends Request {
  user?: { id: string; correo: string; rol: UserRole };
}

/**
 * RF01/RF03/RF04/RF06: registro público, inicio y cierre de sesión y edición del
 * propio perfil. Es el ÚNICO controlador con @Controller('auth') del proyecto.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verification: VerificationService,
  ) {}

  // -----------------------------------------------------------------------
  // ENDPOINTS DE VERIFICACIÓN DE CORREO
  // -----------------------------------------------------------------------

  @Post('reenviar-verificacion')
  @UseGuards(JwtAuthGuard)
  reenviar(@Req() req: RequestWithUser) {
    return this.verification.send(req.user!.id);
  }

  @Get('verificar-correo')
  async verificar(@Query('token') token: string, @Res() res: Response) {
    let message = 'Correo verificado';
    let status = 200;
    try { 
      await this.verification.verify(token); 
    } catch { 
      message = 'Enlace inválido, vencido o ya utilizado. Solicita otro desde tu perfil.'; 
      status = 400; 
    }
    res.status(status).set('Cache-Control', 'no-store').set('Referrer-Policy', 'no-referrer').type('html').send(
      '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verificación de correo</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#ecfdf5;font-family:Arial;color:#064e3b"><h1 style="padding:24px;text-align:center">' + message + '</h1></body></html>'
    );
  }

  // -----------------------------------------------------------------------
  // ENDPOINTS ORIGINALES
  // -----------------------------------------------------------------------

  @Post('registro')
  registro(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  login(@Req() req: RequestWithUser) {
    return this.authService.login(req.user!);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout() {
    return this.authService.logout();
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  perfil(@Req() req: RequestWithUser) {
    return this.authService.findById(req.user!.id);
  }

  @Put('perfil')
  @UseGuards(JwtAuthGuard)
  actualizarPerfil(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateProfile(req.user!.id, updateUserDto);
  }

  @Patch('perfil')
  @UseGuards(JwtAuthGuard)
  actualizarPerfilParcial(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateProfile(req.user!.id, updateUserDto);
  }
}