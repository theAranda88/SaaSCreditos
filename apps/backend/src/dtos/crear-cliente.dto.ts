import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { TIPOS_DOCUMENTO } from '../nucleo/constantes/clientes.constantes';

export class CrearClienteDto {
  @ApiProperty({ example: 'María Pérez' })
  @IsString()
  @Length(2, 180)
  nombreCompleto!: string;

  @ApiProperty({ example: 'CC', enum: TIPOS_DOCUMENTO })
  @IsIn(TIPOS_DOCUMENTO)
  tipoDocumento!: (typeof TIPOS_DOCUMENTO)[number];

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @Length(3, 40)
  numeroDocumento!: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  @Length(7, 30)
  telefono!: string;

  @ApiPropertyOptional({ example: 'Calle 10 # 5-20' })
  @IsOptional()
  @IsString()
  @Length(1, 220)
  direccion?: string;

  @ApiPropertyOptional({ example: 'Frente al parque principal' })
  @IsOptional()
  @IsString()
  @Length(1, 220)
  referenciaUbicacion?: string;
}
