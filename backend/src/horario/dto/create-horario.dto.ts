import { IsMilitaryTime, IsNotEmpty } from 'class-validator';

// RF-5: Configuración de horarios
export class CreateHorarioDto {
  @IsNotEmpty()
  @IsMilitaryTime({ message: 'hora_inicio debe tener formato HH:mm' })
  horaInicio: string;

  @IsNotEmpty()
  @IsMilitaryTime({ message: 'hora_final debe tener formato HH:mm' })
  horaFinal: string;
}
