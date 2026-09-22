import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './horario.entity';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';

@Injectable()
export class HorarioService {
  constructor(
    @InjectRepository(Horario)
    private readonly horarioRepo: Repository<Horario>,
  ) {}

  // RF-5: Configuración de horarios
  async create(dto: CreateHorarioDto): Promise<Horario> {
    this.validarRango(dto.horaInicio, dto.horaFinal);
    await this.validarSolapamiento(dto.horaInicio, dto.horaFinal);

    const horario = this.horarioRepo.create(dto);
    return this.horarioRepo.save(horario);
  }

  findAll(): Promise<Horario[]> {
    return this.horarioRepo.find();
  }

  async findOne(codHorario: number): Promise<Horario> {
    const horario = await this.horarioRepo.findOne({ where: { codHorario } });
    if (!horario) {
      throw new NotFoundException(`No se encontró el horario ${codHorario}`);
    }
    return horario;
  }

  // RF-6: Modificación de horarios
  async update(codHorario: number, dto: UpdateHorarioDto): Promise<Horario> {
    const horario = await this.findOne(codHorario);
    const horaInicio = dto.horaInicio ?? horario.horaInicio;
    const horaFinal = dto.horaFinal ?? horario.horaFinal;

    this.validarRango(horaInicio, horaFinal);
    await this.validarSolapamiento(horaInicio, horaFinal, codHorario);

    Object.assign(horario, { horaInicio, horaFinal });
    return this.horarioRepo.save(horario);
  }

  // RF-6: eliminar horario
  async remove(codHorario: number): Promise<void> {
    const horario = await this.findOne(codHorario);
    await this.horarioRepo.remove(horario);
  }

  // RF-6: "verificará que los horarios no se superpongan ni tengan una
  // hora de inicio posterior a la hora de finalización"
  private validarRango(horaInicio: string, horaFinal: string) {
    if (horaInicio >= horaFinal) {
      throw new BadRequestException(
        'La hora de inicio debe ser anterior a la hora de finalización',
      );
    }
  }

  private async validarSolapamiento(
    horaInicio: string,
    horaFinal: string,
    excluirCodHorario?: number,
  ) {
    const query = this.horarioRepo
      .createQueryBuilder('h')
      .where('h.hora_inicio < :horaFinal', { horaFinal })
      .andWhere('h.hora_final > :horaInicio', { horaInicio });

    if (excluirCodHorario) {
      query.andWhere('h.cod_horario != :id', { id: excluirCodHorario });
    }

    const solapado = await query.getOne();
    if (solapado) {
      throw new BadRequestException(
        `El horario se superpone con uno existente (${solapado.horaInicio} - ${solapado.horaFinal})`,
      );
    }
  }
}
