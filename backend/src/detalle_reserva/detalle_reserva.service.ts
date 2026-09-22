import { Injectable } from '@nestjs/common';
import { CreateDetalleReservaDto } from './dto/create-detalle_reserva.dto';
import { UpdateDetalleReservaDto } from './dto/update-detalle_reserva.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DetalleReserva } from './entities/detalle_reserva.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DetalleReservaService {
  constructor(
    @InjectRepository(DetalleReserva)
    private readonly detalleReservaRepositorio: Repository<DetalleReserva>
  ){}

  async listarDetalles() {
    return await this.detalleReservaRepositorio.find();
  }

  async listarUnDetalle(id: number) {
    return await this.detalleReservaRepositorio.find({
      where: { id_detalle: id}
    })
  }

}
