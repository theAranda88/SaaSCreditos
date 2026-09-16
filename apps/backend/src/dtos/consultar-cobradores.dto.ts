import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { ESTADOS_USUARIO } from '../nucleo/constantes/usuarios.constantes';

export class ConsultarCobradoresDto {
  @ApiPropertyOptional({ example: 'Carlos' })
  @IsOptional()
  @IsString()
  @Length(1, 160)
  nombre?: string;

  @ApiPropertyOptional({ example: 'carlos@ejemplo.com' })
  @IsOptional()
  @IsString()
  @Length(1, 180)
  correo?: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  telefono?: string;

  @ApiPropertyOptional({ example: 'activo', enum: ESTADOS_USUARIO })
  @IsOptional()
  @IsIn(ESTADOS_USUARIO)
  estado?: (typeof ESTADOS_USUARIO)[number];
}
