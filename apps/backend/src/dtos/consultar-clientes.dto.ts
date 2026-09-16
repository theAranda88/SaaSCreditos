import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { ESTADOS_CLIENTE } from '../nucleo/constantes/clientes.constantes';

export class ConsultarClientesDto {
  @ApiPropertyOptional({ example: 'María' })
  @IsOptional()
  @IsString()
  @Length(1, 180)
  nombre?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @Length(1, 40)
  numeroDocumento?: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  telefono?: string;

  @ApiPropertyOptional({ example: 'activo', enum: ESTADOS_CLIENTE })
  @IsOptional()
  @IsIn(ESTADOS_CLIENTE)
  estado?: (typeof ESTADOS_CLIENTE)[number];
}
