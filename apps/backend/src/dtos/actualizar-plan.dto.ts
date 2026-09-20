import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { ESTADOS_PLAN } from '../nucleo/constantes/planes.constantes';

export class ActualizarPlanDto {
  @ApiPropertyOptional({ example: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limiteCobradores?: number;

  @ApiPropertyOptional({ example: 2500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioImplementacion?: number;

  @ApiPropertyOptional({ example: 425000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioMensual?: number;

  @ApiPropertyOptional({ example: 'activo', enum: ESTADOS_PLAN })
  @IsOptional()
  @IsIn(ESTADOS_PLAN)
  estado?: (typeof ESTADOS_PLAN)[number];
}
