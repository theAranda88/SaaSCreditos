import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ESTADOS_NEGOCIO } from '../nucleo/constantes/planes.constantes';

export class CambiarEstadoNegocioDto {
  @ApiProperty({ example: 'suspendido', enum: ESTADOS_NEGOCIO })
  @IsIn(ESTADOS_NEGOCIO)
  estado!: (typeof ESTADOS_NEGOCIO)[number];
}
