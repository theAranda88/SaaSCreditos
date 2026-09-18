import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ConsultarResumenDiarioDto {
  @ApiPropertyOptional({ example: '2026-09-21' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ example: '22222222-2222-4222-8222-222222222222' })
  @IsOptional()
  @IsUUID()
  cobradorId?: string;
}
