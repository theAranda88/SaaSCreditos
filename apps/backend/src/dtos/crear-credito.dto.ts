import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';
import { PERIODICIDADES_CREDITO } from '../nucleo/constantes/creditos.constantes';

export class CrearCreditoDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  clienteId!: string;

  @ApiProperty({ example: 100000, description: 'Monto principal en COP. Debe ser > 0.' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  montoPrincipal!: number;

  @ApiProperty({
    example: 20,
    description: 'Porcentaje flat sobre el principal de este crédito (ej. 20 → 20%).',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  tasaInteres!: number;

  @ApiPropertyOptional({
    example: 5000,
    nullable: true,
    description: 'COP > 0 si el dueño cobra mora; omitir o null si no cobra.',
  })
  @IsOptional()
  @ValidateIf((_, valor) => valor !== null && valor !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  valorMora?: number | null;

  @ApiProperty({ example: 'diaria', enum: PERIODICIDADES_CREDITO })
  @IsIn(PERIODICIDADES_CREDITO)
  periodicidad!: (typeof PERIODICIDADES_CREDITO)[number];

  @ApiProperty({ example: 20, description: 'Cantidad de cuotas (>= 1). No existe cuota 0.' })
  @Type(() => Number)
  @IsInt()
  numeroCuotas!: number;

  @ApiProperty({
    example: '2026-09-16',
    description: 'Fecha de desembolso (YYYY-MM-DD). La primera cuota vence un período después.',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fechaDesembolso debe tener formato YYYY-MM-DD' })
  fechaDesembolso!: string;
}
