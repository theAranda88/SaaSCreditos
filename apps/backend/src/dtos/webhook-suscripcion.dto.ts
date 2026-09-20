import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { EVENTOS_WEBHOOK_SUSCRIPCION } from '../nucleo/constantes/planes.constantes';

export class WebhookSuscripcionDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  suscripcionId!: string;

  @ApiProperty({ example: 'pago_aprobado', enum: EVENTOS_WEBHOOK_SUSCRIPCION })
  @IsIn(EVENTOS_WEBHOOK_SUSCRIPCION)
  evento!: (typeof EVENTOS_WEBHOOK_SUSCRIPCION)[number];

  @ApiPropertyOptional({ example: 'pasarela-ref-001' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  referenciaPagoExterno?: string;
}
