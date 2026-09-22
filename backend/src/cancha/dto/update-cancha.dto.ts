import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCanchaDto } from './create-cancha.dto';

// RF-2: Modificación de canchas -> no permite tocar el estado desde aquí,
// eso se maneja con el endpoint dedicado (RF-3 / update-estado.dto.ts).
export class UpdateCanchaDto extends PartialType(
  OmitType(CreateCanchaDto, ['estado'] as const),
) {}
