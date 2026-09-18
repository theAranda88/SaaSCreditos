import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CrearAsignacionDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  creditoId!: string;

  @ApiProperty({ example: '22222222-2222-4222-8222-222222222222' })
  @IsUUID()
  cobradorId!: string;
}
