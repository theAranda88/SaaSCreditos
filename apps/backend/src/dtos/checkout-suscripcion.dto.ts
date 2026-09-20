import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CheckoutSuscripcionDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  planId!: string;

  @ApiPropertyOptional({ example: 'stub-checkout-001' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  referenciaPagoExterno?: string;
}
