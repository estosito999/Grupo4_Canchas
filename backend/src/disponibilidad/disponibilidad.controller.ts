import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { DisponibilidadService } from './disponibilidad.service';
import { AsignarHorarioDto } from './dto/asignar-horario.dto';

// RF-5/RF-6/RF-8: gestión de la relación cancha <-> horario
@Controller('canchas/:codCancha/horarios')
export class DisponibilidadController {
  constructor(private readonly disponibilidadService: DisponibilidadService) {}

  @Post()
  asignar(
    @Param('codCancha', ParseIntPipe) codCancha: number,
    @Body() dto: AsignarHorarioDto,
  ) {
    return this.disponibilidadService.asignar(codCancha, dto.codHorario);
  }

  @Get()
  listar(@Param('codCancha', ParseIntPipe) codCancha: number) {
    return this.disponibilidadService.horariosDeCancha(codCancha);
  }

  @Delete(':codHorario')
  quitar(
    @Param('codCancha', ParseIntPipe) codCancha: number,
    @Param('codHorario', ParseIntPipe) codHorario: number,
  ) {
    return this.disponibilidadService.quitar(codCancha, codHorario);
  }
}
