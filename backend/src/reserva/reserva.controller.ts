import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReservaService } from './reserva.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';

@Controller('reserva')
export class ReservaController {
  constructor(private readonly reservaService: ReservaService) {}

  @Post()
  create(@Body() createReservaDto: CreateReservaDto) {
    return this.reservaService.crearReserva(createReservaDto);
  }

  @Get()
  findAll() {
    return this.reservaService.listarReservas();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservaService.listarUnaReserva(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReservaDto: UpdateReservaDto) {
    return this.reservaService.actualizarReserva(+id, updateReservaDto);
  }

  @Patch(':id/cancelar')
  cancelarReserva(@Param('id') id:string){
    return this.reservaService.cancelarReserva(+id);
  }


}
