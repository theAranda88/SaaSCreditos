import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Length } from 'class-validator';

export class RecuperarAccesoDto {
  @ApiProperty({ example: 'ana@ejemplo.com' })
  @IsEmail()
  @Length(5, 180)
  correo!: string;
}
