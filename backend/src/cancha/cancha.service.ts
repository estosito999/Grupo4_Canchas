import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cancha, EstadoCancha } from './cancha.entity';
import { CreateCanchaDto } from './dto/create-cancha.dto';
import { UpdateCanchaDto } from './dto/update-cancha.dto';
import { UpdateEstadoCanchaDto } from './dto/update-estado-cancha.dto';
import { FiltroCanchaDto } from './dto/filtro-cancha.dto';
import { Disponibilidad } from '../disponibilidad/disponibilidad.entity';

@Injectable()
export class CanchaService {
  constructor(
    @InjectRepository(Cancha)
    private readonly canchaRepo: Repository<Cancha>,
    @InjectRepository(Disponibilidad)
    private readonly disponibilidadRepo: Repository<Disponibilidad>,
  ) {}

  // R-1: Registro de canchas
  async create(dto: CreateCanchaDto): Promise<Cancha> {
    const existente = await this.canchaRepo.findOne({
      where: { nombreCancha: dto.nombreCancha },
    });
    if (existente) {
      // Flujo alternativo: "Identificador de cancha repetido"
      throw new ConflictException(
        `Ya existe una cancha registrada con el nombre "${dto.nombreCancha}"`,
      );
    }

    const cancha = this.canchaRepo.create({
      ...dto,
      estado: (dto.estado as EstadoCancha) ?? EstadoCancha.DISPONIBLE,
    });
    return this.canchaRepo.save(cancha);
  }

  // RF-4 / RC-08: Consulta de canchas (uso interno: admin/empleado)
  async findAll(filtro?: FiltroCanchaDto): Promise<Cancha[]> {
    const where = filtro?.tipoCancha
      ? { tipoCancha: filtro.tipoCancha }
      : {};
    return this.canchaRepo.find({
      where,
      relations: { disponibilidades: { horario: true } },
    });
  }

  // RF-7: Consulta para el cliente -> solo canchas habilitadas (Disponible)
  async findDisponiblesParaCliente(filtro?: FiltroCanchaDto): Promise<Cancha[]> {
    const query = this.canchaRepo
      .createQueryBuilder('cancha')
      .leftJoinAndSelect('cancha.disponibilidades', 'disponibilidad')
      .leftJoinAndSelect('disponibilidad.horario', 'horario')
      .where('cancha.estado = :estado', { estado: EstadoCancha.DISPONIBLE });

    if (filtro?.tipoCancha) {
      query.andWhere('cancha.tipoCancha = :tipo', { tipo: filtro.tipoCancha });
    }
    return query.getMany();
  }

  async findOne(codCancha: number): Promise<Cancha> {
    const cancha = await this.canchaRepo.findOne({
      where: { codCancha },
      relations: { disponibilidades: { horario: true } },
    });
    if (!cancha) {
      // Flujo alternativo: "Cancha no encontrada"
      throw new NotFoundException(`No se encontró la cancha con código ${codCancha}`);
    }
    return cancha;
  }

  // RF-2: Modificación de canchas
  async update(codCancha: number, dto: UpdateCanchaDto): Promise<Cancha> {
    const cancha = await this.findOne(codCancha);

    if (dto.nombreCancha && dto.nombreCancha !== cancha.nombreCancha) {
      const duplicada = await this.canchaRepo.findOne({
        where: { nombreCancha: dto.nombreCancha },
      });
      if (duplicada) {
        throw new ConflictException(
          `Ya existe una cancha registrada con el nombre "${dto.nombreCancha}"`,
        );
      }
    }

    Object.assign(cancha, dto);
    return this.canchaRepo.save(cancha);
  }

  // RF-3 / RNF-04: Actualizar estado de una cancha
  async updateEstado(codCancha: number, dto: UpdateEstadoCanchaDto): Promise<Cancha> {
    const cancha = await this.findOne(codCancha);

    if (
      dto.estado !== EstadoCancha.DISPONIBLE &&
      cancha.estado === EstadoCancha.DISPONIBLE
    ) {
      // Flujo alternativo: "La cancha tiene una reserva vigente"
      // NOTA: aquí se debe consultar al módulo de Reservas (fuera de este
      // servicio). Se deja el punto de integración marcado explícitamente:
      const tieneReservaVigente = await this.tieneReservaVigente(codCancha);
      if (tieneReservaVigente) {
        throw new BadRequestException(
          'No se puede cambiar el estado: la cancha tiene una reserva vigente',
        );
      }
    }

    cancha.estado = dto.estado;
    return this.canchaRepo.save(cancha);
  }

  // RC-09: Validación del estado antes de una reserva.
  // Este método está pensado para ser llamado desde el módulo de Reservas.
  async estaDisponible(codCancha: number): Promise<boolean> {
    const cancha = await this.findOne(codCancha);
    return cancha.estado === EstadoCancha.DISPONIBLE;
  }

  // Punto de integración con el futuro módulo de Reservas (RC-10).
  // Por ahora retorna false; reemplazar por una consulta real cuando
  // exista la tabla/servicio de reservas.
  private async tieneReservaVigente(_codCancha: number): Promise<boolean> {
    return false;
  }

  async remove(codCancha: number): Promise<void> {
    const cancha = await this.findOne(codCancha);
    await this.canchaRepo.remove(cancha);
  }
}
