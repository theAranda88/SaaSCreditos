import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { METODOS_PAGO } from '../nucleo/constantes/pagos.constantes';
import type { MetodoPago } from '@creditos/shared-types';

export class RegistrarPagoDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  cuotaId!: string;

  @ApiProperty({ example: 6000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monto!: number;

  @ApiProperty({ example: 'efectivo', enum: METODOS_PAGO })
  @IsIn(METODOS_PAGO)
  metodoPago!: MetodoPago;

  @ApiPropertyOptional({ example: '2026-09-21T14:30:00.000Z' })
  @IsOptional()
  @IsISO8601()
  fechaPago?: string;
}
