import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Disponibilidad } from './disponibilidad.entity';
import { Cancha } from '../cancha/cancha.entity';
import { Horario } from '../horario/horario.entity';

@Injectable()
export class DisponibilidadService {
  constructor(
    @InjectRepository(Disponibilidad)
    private readonly disponibilidadRepo: Repository<Disponibilidad>,
    @InjectRepository(Cancha)
    private readonly canchaRepo: Repository<Cancha>,
    @InjectRepository(Horario)
    private readonly horarioRepo: Repository<Horario>,
  ) {}

  // Vincula un horario existente a una cancha (RF-5)
  async asignar(codCancha: number, codHorario: number): Promise<Disponibilidad> {
    const cancha = await this.canchaRepo.findOne({ where: { codCancha } });
    if (!cancha) {
      throw new NotFoundException(`No se encontró la cancha ${codCancha}`);
    }
    const horario = await this.horarioRepo.findOne({ where: { codHorario } });
    if (!horario) {
      throw new NotFoundException(`No se encontró el horario ${codHorario}`);
    }

    const yaExiste = await this.disponibilidadRepo.findOne({
      where: { codCancha, codHorario },
    });
    if (yaExiste) {
      throw new ConflictException(
        'Ese horario ya está asignado a esta cancha',
      );
    }

    const disponibilidad = this.disponibilidadRepo.create({ codCancha, codHorario });
    return this.disponibilidadRepo.save(disponibilidad);
  }

  // RF-6: quitar un horario de una cancha
  async quitar(codCancha: number, codHorario: number): Promise<void> {
    const disponibilidad = await this.disponibilidadRepo.findOne({
      where: { codCancha, codHorario },
    });
    if (!disponibilidad) {
      throw new NotFoundException(
        'Esa cancha no tiene asignado ese horario',
      );
    }
    await this.disponibilidadRepo.remove(disponibilidad);
  }

  // RF-8: consulta de disponibilidad (horarios de una cancha)
  async horariosDeCancha(codCancha: number): Promise<Horario[]> {
    const registros = await this.disponibilidadRepo.find({
      where: { codCancha },
      relations: { horario: true },
    });
    return registros.map((r) => r.horario);
  }

  // RC-10: punto de integración con Reservas — dado cancha + horario,
  // confirma si esa combinación está habilitada como franja de atención
  // (esto NO valida si ya está reservada; eso lo hace el módulo de Reservas)
  async estaHabilitada(codCancha: number, codHorario: number): Promise<boolean> {
    const registro = await this.disponibilidadRepo.findOne({
      where: { codCancha, codHorario },
    });
    return !!registro;
  }
}
