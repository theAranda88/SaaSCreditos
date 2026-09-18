import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ESTADOS_ASIGNACION } from '../nucleo/constantes/asignaciones.constantes';

export class ConsultarAsignacionesDto {
  @ApiPropertyOptional({ example: '22222222-2222-4222-8222-222222222222' })
  @IsOptional()
  @IsUUID()
  cobradorId?: string;

  @ApiPropertyOptional({ example: '11111111-1111-4111-8111-111111111111' })
  @IsOptional()
  @IsUUID()
  creditoId?: string;

  @ApiPropertyOptional({ example: 'activa', enum: ESTADOS_ASIGNACION })
  @IsOptional()
  @IsIn(ESTADOS_ASIGNACION)
  estado?: (typeof ESTADOS_ASIGNACION)[number];
}
