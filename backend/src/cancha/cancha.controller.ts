import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CanchaService } from './cancha.service';
import { CreateCanchaDto } from './dto/create-cancha.dto';
import { UpdateCanchaDto } from './dto/update-cancha.dto';
import { UpdateEstadoCanchaDto } from './dto/update-estado-cancha.dto';
import { FiltroCanchaDto } from './dto/filtro-cancha.dto';

@Controller('canchas')
export class CanchaController {
  constructor(private readonly canchaService: CanchaService) {}

  // R-1: POST /canchas  (solo administrador -> ver nota de seguridad al final)
  @Post()
  create(@Body() dto: CreateCanchaDto) {
    return this.canchaService.create(dto);
  }

  // RF-4 / RC-08: GET /canchas  (uso administrador/empleado)
  @Get()
  findAll(@Query() filtro: FiltroCanchaDto) {
    return this.canchaService.findAll(filtro);
  }

  // RF-7 / RF-9: GET /canchas/disponibles  (uso cliente)
  @Get('disponibles')
  findDisponibles(@Query() filtro: FiltroCanchaDto) {
    return this.canchaService.findDisponiblesParaCliente(filtro);
  }

  // RF-4: GET /canchas/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.canchaService.findOne(id);
  }

  // RF-2: PATCH /canchas/:id
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCanchaDto) {
    return this.canchaService.update(id, dto);
  }

  // RF-3: PATCH /canchas/:id/estado
  @Patch(':id/estado')
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoCanchaDto,
  ) {
    return this.canchaService.updateEstado(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.canchaService.remove(id);
  }
}
