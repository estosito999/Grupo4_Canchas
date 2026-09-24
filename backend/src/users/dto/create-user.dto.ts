import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

import { UserRole } from '../entities/user.entity';

/** Nombres y apellidos: solo letras (incluye acentos) y separadores simples. */
const SOLO_LETRAS = /^[\p{L}][\p{L}\s'.-]*$/u;

/**
 * RF02: calcula la edad en años cumplidos a partir de 'AAAA-MM-DD'.
 * Retorna NaN si el formato o la fecha son inválidos (por ejemplo 2021-02-31).
 */
export function calcularEdad(fechaISO: string): number {
  if (typeof fechaISO !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
    return Number.NaN;
  }

  const [anio, mes, dia] = fechaISO.split('-').map((parte) => Number(parte));
  const nacimiento = new Date(Date.UTC(anio, mes - 1, dia));

  if (
    nacimiento.getUTCFullYear() !== anio ||
    nacimiento.getUTCMonth() !== mes - 1 ||
    nacimiento.getUTCDate() !== dia
  ) {
    return Number.NaN;
  }

  const hoy = new Date();
  let edad = hoy.getUTCFullYear() - anio;
  const mesActual = hoy.getUTCMonth() + 1;
  const diaActual = hoy.getUTCDate();

  if (mesActual < mes || (mesActual === mes && diaActual < dia)) {
    edad -= 1;
  }

  return edad;
}

/**
 * RF02: exige la mayoría de edad. Se declara aquí para que lo hereden tanto el
 * alta (CreateUserDto) como la edición (UpdateUserDto vía PartialType).
 */
export function IsAdult(
  minAnios: number = 18,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    registerDecorator({
      name: 'isAdult',
      target: target.constructor,
      propertyName: String(propertyKey),
      constraints: [minAnios],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (typeof value !== 'string') {
            return false;
          }
          const edad = calcularEdad(value);
          const minimo = Number(args.constraints[0]);
          return Number.isFinite(edad) && edad >= minimo;
        },
        defaultMessage(args: ValidationArguments): string {
          return `Debes ser mayor de edad (mínimo ${args.constraints[0]} años)`;
        },
      },
    });
  };
}

/**
 * RF01: datos personales obligatorios (nombres, apellidos, fecha de nacimiento,
 * correo, celular y contraseña).
 * RF02: formato de correo (IsEmail) y mayoría de edad (IsAdult).
 * RNF02: nombres y apellidos en campos independientes (3FN).
 * RNF04: validación declarativa con class-validator antes de tocar la BD.
 */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  @MaxLength(100, { message: 'Los nombres no pueden superar 100 caracteres' })
  @Matches(SOLO_LETRAS, {
    message: 'Los nombres solo pueden contener letras y espacios',
  })
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido paterno es obligatorio' })
  @MaxLength(100, {
    message: 'El apellido paterno no puede superar 100 caracteres',
  })
  @Matches(SOLO_LETRAS, {
    message: 'El apellido paterno solo puede contener letras y espacios',
  })
  apellido_paterno: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido materno es obligatorio' })
  @MaxLength(100, {
    message: 'El apellido materno no puede superar 100 caracteres',
  })
  @Matches(SOLO_LETRAS, {
    message: 'El apellido materno solo puede contener letras y espacios',
  })
  apellido_materno: string;

  @IsDateString(
    {},
    { message: 'La fecha de nacimiento debe tener el formato AAAA-MM-DD' },
  )
  @IsAdult(18, {
    message: 'Debes ser mayor de edad (18 años) para crear tu cuenta',
  })
  fecha_nacimiento: string;

  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  @MaxLength(150, { message: 'El correo no puede superar 150 caracteres' })
  correo: string;

  @IsString({ message: 'El celular debe ser un texto numérico' })
  @Matches(/^\d{8,15}$/, {
    message: 'El celular debe contener entre 8 y 15 dígitos',
  })
  celular: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar 72 caracteres' })
  password: string;

  /**
   * RF05: solo el panel de administración envía este campo. El registro público
   * lo ignora y fuerza siempre el rol CLIENTE (AuthService.register).
   */
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'El rol debe ser ADMINISTRADOR, EMPLEADO o CLIENTE',
  })
  rol?: UserRole;
}
