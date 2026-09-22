import { IsInt, IsPositive } from 'class-validator';

export class AsignarHorarioDto {
  @IsInt()
  @IsPositive()
  codHorario: number;
}
