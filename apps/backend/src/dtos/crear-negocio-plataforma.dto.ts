import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';
import type { CodigoPlan } from '@creditos/shared-types';

const CODIGOS_PLAN: CodigoPlan[] = ['emprendedor', 'profesional', 'empresarial'];

export class CrearNegocioPlataformaDto {
  @ApiProperty({ example: 'Mi Préstamos SAS' })
  @IsString()
  @Length(2, 180)
  nombreComercial!: string;

  @ApiProperty({ example: 'Ana Propietaria' })
  @IsString()
  @Length(2, 160)
  nombre!: string;

  @ApiProperty({ example: 'ana@ejemplo.com' })
  @IsEmail()
  @Length(5, 180)
  correo!: string;

  @ApiProperty({
    example: 'ClaveSegura123',
    description: 'Contraseña inicial del propietario; el admin no recibe sesión del negocio.',
  })
  @IsString()
  @MinLength(8)
  @Length(8, 72)
  contrasena!: string;

  @ApiPropertyOptional({ example: 'COP', default: 'COP' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  moneda?: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsOptional()
  @IsString()
  @Length(7, 30)
  telefono?: string;

  @ApiPropertyOptional({ example: 'emprendedor', default: 'emprendedor' })
  @IsOptional()
  @IsIn(CODIGOS_PLAN)
  codigoPlan?: CodigoPlan;
}
