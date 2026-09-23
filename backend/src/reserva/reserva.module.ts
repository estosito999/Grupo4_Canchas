import { Module } from '@nestjs/common';
import { ReservaService } from './reserva.service';
import { ReservaController } from './reserva.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reserva } from './entities/reserva.entity';
import { Cancha } from '../cancha/cancha.entity';
import { DetalleReserva } from '../detalle_reserva/entities/detalle_reserva.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Reserva, Cancha, DetalleReserva])],
  controllers: [ReservaController],
  providers: [ReservaService],
})
export class ReservaModule {}
