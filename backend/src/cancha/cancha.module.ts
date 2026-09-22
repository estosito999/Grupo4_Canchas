import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cancha } from './cancha.entity';
import { Disponibilidad } from '../disponibilidad/disponibilidad.entity';
import { CanchaService } from './cancha.service';
import { CanchaController } from './cancha.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cancha, Disponibilidad])],
  controllers: [CanchaController],
  providers: [CanchaService],
  exports: [CanchaService], // para que el futuro módulo de Reservas lo use (RC-10)
})
export class CanchaModule {}
