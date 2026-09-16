import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ana@ejemplo.com' })
  @IsEmail()
  @Length(5, 180)
  correo!: string;

  @ApiProperty({ example: 'ClaveSegura123' })
  @IsString()
  @MinLength(8)
  @Length(8, 72)
  contrasena!: string;
}
