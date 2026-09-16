import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { TIPOS_DOCUMENTO } from '../nucleo/constantes/clientes.constantes';

export class ActualizarClienteDto {
  @ApiPropertyOptional({ example: 'María Pérez Gómez' })
  @IsOptional()
  @IsString()
  @Length(2, 180)
  nombreCompleto?: string;

  @ApiPropertyOptional({ example: 'CC', enum: TIPOS_DOCUMENTO })
  @IsOptional()
  @IsIn(TIPOS_DOCUMENTO)
  tipoDocumento?: (typeof TIPOS_DOCUMENTO)[number];

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @Length(3, 40)
  numeroDocumento?: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsOptional()
  @IsString()
  @Length(7, 30)
  telefono?: string;

  @ApiPropertyOptional({ example: 'Calle 10 # 5-20', nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 220)
  direccion?: string | null;

  @ApiPropertyOptional({ example: 'Frente al parque principal', nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 220)
  referenciaUbicacion?: string | null;
}
