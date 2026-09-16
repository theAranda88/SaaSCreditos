import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ESTADOS_USUARIO } from '../nucleo/constantes/usuarios.constantes';

export class CambiarEstadoCobradorDto {
  @ApiProperty({ example: 'inactivo', enum: ESTADOS_USUARIO })
  @IsIn(ESTADOS_USUARIO)
  estado!: (typeof ESTADOS_USUARIO)[number];
}
