import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ESTADOS_CREDITO } from '../nucleo/constantes/creditos.constantes';

export class ConsultarCreditosDto {
  @ApiPropertyOptional({ example: '11111111-1111-4111-8111-111111111111' })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ example: 'activo', enum: ESTADOS_CREDITO })
  @IsOptional()
  @IsIn(ESTADOS_CREDITO)
  estado?: (typeof ESTADOS_CREDITO)[number];
}
