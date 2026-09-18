import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class ConsultarPagosDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  creditoId!: string;

  @ApiPropertyOptional({ example: 'valido', enum: ['valido', 'anulado'] })
  @IsOptional()
  @IsIn(['valido', 'anulado'])
  estado?: 'valido' | 'anulado';
}
