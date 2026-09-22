import { IsOptional, IsString } from 'class-validator';

// RF-9: Búsqueda de canchas por tipo (fecha/horario se filtran
// contra el módulo de Reservas, fuera del alcance de esta tabla)
export class FiltroCanchaDto {
  @IsOptional()
  @IsString()
  tipoCancha?: string;
}
