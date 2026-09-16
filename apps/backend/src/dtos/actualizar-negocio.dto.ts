import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, Length, Matches } from 'class-validator';

export class ActualizarNegocioDto {
  @ApiPropertyOptional({ example: 'Mi Préstamos Actualizado' })
  @IsOptional()
  @IsString()
  @Length(2, 180)
  nombreComercial?: string;

  @ApiPropertyOptional({ example: 'COP' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  moneda?: string;

  @ApiPropertyOptional({ example: { zona_horaria: 'America/Bogota' } })
  @IsOptional()
  @IsObject()
  configuracion?: Record<string, unknown>;
}
