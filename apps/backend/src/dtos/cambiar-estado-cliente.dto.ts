import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ESTADOS_CLIENTE } from '../nucleo/constantes/clientes.constantes';

export class CambiarEstadoClienteDto {
  @ApiProperty({ example: 'inactivo', enum: ESTADOS_CLIENTE })
  @IsIn(ESTADOS_CLIENTE)
  estado!: (typeof ESTADOS_CLIENTE)[number];
}
