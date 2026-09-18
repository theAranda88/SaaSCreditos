import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AnularPagoDto {
  @ApiProperty({ example: 'Error de digitación en el monto registrado' })
  @IsString()
  @MinLength(5)
  @MaxLength(240)
  motivoAnulacion!: string;
}
