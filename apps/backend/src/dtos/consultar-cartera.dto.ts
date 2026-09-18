import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { SEGMENTOS_CARTERA } from '../nucleo/constantes/cartera.constantes';

export class ConsultarCarteraDto {
  @ApiProperty({ example: 'vigente', enum: SEGMENTOS_CARTERA })
  @IsIn(SEGMENTOS_CARTERA)
  segmento!: (typeof SEGMENTOS_CARTERA)[number];

  @ApiPropertyOptional({ example: '11111111-1111-4111-8111-111111111111' })
  @IsOptional()
  @IsUUID()
  cobradorId?: string;
}
