import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class ConsultarAuditoriasDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  negocioId?: string;

  @ApiPropertyOptional({ example: 'negocios' })
  @IsOptional()
  @IsString()
  @Length(1, 60)
  entidad?: string;

  @ApiPropertyOptional({ example: 'suspender' })
  @IsOptional()
  @IsString()
  @Length(1, 40)
  accion?: string;
}
