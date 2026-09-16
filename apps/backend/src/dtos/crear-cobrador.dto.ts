import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class CrearCobradorDto {
  @ApiProperty({ example: 'Carlos Cobrador' })
  @IsString()
  @Length(2, 160)
  nombre!: string;

  @ApiProperty({ example: 'carlos@ejemplo.com' })
  @IsEmail()
  @Length(5, 180)
  correo!: string;

  @ApiProperty({ example: 'ClaveSegura123' })
  @IsString()
  @MinLength(8)
  @Length(8, 72)
  contrasena!: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsOptional()
  @IsString()
  @Length(7, 30)
  telefono?: string;
}
