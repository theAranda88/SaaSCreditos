import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class ActualizarCobradorDto {
  @ApiPropertyOptional({ example: 'Carlos Cobrador Gómez' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  nombre?: string;

  @ApiPropertyOptional({ example: 'carlos@ejemplo.com' })
  @IsOptional()
  @IsEmail()
  @Length(5, 180)
  correo?: string;

  @ApiPropertyOptional({ example: 'ClaveNueva123' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @Length(8, 72)
  contrasena?: string;

  @ApiPropertyOptional({ example: '3009876543', nullable: true })
  @IsOptional()
  @IsString()
  @Length(7, 30)
  telefono?: string | null;
}
