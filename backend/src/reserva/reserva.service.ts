import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { Reserva} from './entities/reserva.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleReserva } from '../detalle_reserva/entities/detalle_reserva.entity';
import { In } from 'typeorm';
@Injectable()
export class ReservaService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepositorio : Repository<Reserva>,
    @InjectRepository(DetalleReserva)
    private readonly detalleRepositorio: Repository<DetalleReserva>
    ){}
  async crearReserva(createReservaDto: CreateReservaDto) {

    const idsCanchas = createReservaDto.detalles.map( d=> d.codCancha);
    const canchas = await this.canchaRepositorio.find({
      where: {codCancha: In(idsCanchas)}
    })

    if(canchas.length !== idsCanchas.length){
      throw new BadRequestException('No existe la cancha');
    }

    const detallesArmados = createReservaDto.detalles.map( item => {
      const cancha = canchas.find(c => c.codCancha === item.codCancha);

      const cantidadHoras = 1;
      const subtotalCalcualdo = cancha.precioHora * cantidadHoras;

      return this.detalleRepositorio.create({
        cancha: cancha,
        hora_inicio: item.hora_inicio,
        hora_fin: item.hora_fin,
        subtotal: subtotalCalcualdo,
      })
    })

    const nuevaReserva = this.reservaRepositorio.create({
      fecha_reserva: new Date().toISOString(),
      estado: 'PENDIENTE',
      detalles: detallesArmados,
      usuario: { id: createReservaDto.id_usuario}
    })

    return await this.reservaRepositorio.save(nuevaReserva);
  }

  async listarReservas() {
    return await this.reservaRepositorio.find();
  }

  async listarUnaReserva(id: number) {
    return await this.reservaRepositorio.findOne({
      where: { id_reserva: id},
      relations:{
        usuario:true
      }
    })
  }

  async actualizarReserva(id: number, updateReservaDto: UpdateReservaDto) {
    const reservaExistente = await this.reservaRepositorio.findOne({
      where: { id_reserva: id},
      relations: {
        usuario:true
      }
    })

    if(!reservaExistente){
      throw new BadRequestException(`La reserva ${id} no existe en el sistema`);
    }

    if(updateReservaDto.id_usuario !== undefined){
      reservaExistente.usuario.id = updateReservaDto.id_usuario;
    }

    return await this.reservaRepositorio.save(reservaExistente);
  }

  async cancelarReserva(id: number) {
    const reservaExistente = await this.reservaRepositorio.findOne({
      where: { id_reserva:id}
    })
    if(!reservaExistente){
      throw new BadRequestException(`La reserva ${id} no existe en el sistema`);
    }

    reservaExistente.estado = 'CANCELADO';

    return await this.reservaRepositorio.save(reservaExistente);
  }
}
