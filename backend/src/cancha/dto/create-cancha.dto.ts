import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateCanchaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la cancha es obligatorio' })
  @MaxLength(100)
  nombreCancha: string;

  @IsString()
  @IsNotEmpty({ message: 'El tipo de cancha es obligatorio' })
  @MaxLength(50)
  tipoCancha: string;

  @IsString()
  @IsNotEmpty({ message: 'El tipo de suelo es obligatorio' })
  @MaxLength(50)
  tipoSuelo: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio por hora no puede ser negativo' })
  precioHora: number;

  @IsOptional()
  @IsIn(['SI', 'NO'], { message: 'cubierta debe ser "SI" o "NO"' })
  cubierta?: string;

  // El estado inicial normalmente lo define el sistema (Disponible),
  // pero se deja opcional por si el administrador quiere fijarlo.
  @IsOptional()
  @IsIn(['Disponible', 'Mantenimiento', 'Inactiva'], {
    message: 'estado debe ser Disponible, Mantenimiento o Inactiva',
  })
  estado?: string;
}
