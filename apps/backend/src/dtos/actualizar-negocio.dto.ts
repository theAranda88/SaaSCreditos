import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, Length } from 'class-validator';
import { CODIGOS_MONEDA } from '../nucleo/constantes/monedas.constantes';

export class ActualizarNegocioDto {
  @ApiPropertyOptional({ example: 'Mi Préstamos Actualizado' })
  @IsOptional()
  @IsString()
  @Length(2, 180)
  nombreComercial?: string;

  @ApiPropertyOptional({ example: 'COP', enum: CODIGOS_MONEDA })
  @IsOptional()
  @IsIn(CODIGOS_MONEDA)
  moneda?: string;

  @ApiPropertyOptional({ example: { zona_horaria: 'America/Bogota' } })
  @IsOptional()
  @IsObject()
  configuracion?: Record<string, unknown>;
}
