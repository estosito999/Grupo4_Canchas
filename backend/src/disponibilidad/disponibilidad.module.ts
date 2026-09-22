import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Disponibilidad } from './disponibilidad.entity';
import { Cancha } from '../cancha/cancha.entity';
import { Horario } from '../horario/horario.entity';
import { DisponibilidadService } from './disponibilidad.service';
import { DisponibilidadController } from './disponibilidad.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Disponibilidad, Cancha, Horario])],
  controllers: [DisponibilidadController],
  providers: [DisponibilidadService],
  exports: [DisponibilidadService],
})
export class DisponibilidadModule {}
