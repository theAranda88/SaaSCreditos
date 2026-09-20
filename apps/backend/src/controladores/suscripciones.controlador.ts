import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { PerfilUsuario, SuscripcionPerfil } from '@creditos/shared-types';
import { CheckoutSuscripcionDto } from '../dtos/checkout-suscripcion.dto';
import { PermitirNegocioNoOperativo } from '../nucleo/decoradores/permitir-negocio-no-operativo.decorador';
import { Roles } from '../nucleo/decoradores/roles.decorador';
import { UsuarioActual } from '../nucleo/decoradores/usuario-actual.decorador';
import { SuscripcionesServicio } from '../servicios/suscripciones.servicio';

@ApiTags('suscripciones')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Rol no autorizado o negocio no operativo' })
@Controller('suscripciones')
export class SuscripcionesControlador {
  constructor(
    @Inject(SuscripcionesServicio) private readonly suscripcionesServicio: SuscripcionesServicio,
  ) {}

  @Get('mia')
  @Roles('propietario', 'administrador')
  @PermitirNegocioNoOperativo()
  @ApiOperation({
    summary: 'Consulta la suscripción del negocio autenticado',
    description:
      'RF-015. Incluye plan, límites, cobradores activos y estado. Disponible aunque el negocio esté suspendido.',
  })
  @ApiOkResponse({ description: 'Suscripción del negocio' })
  @ApiNotFoundResponse({ description: 'Suscripción no encontrada' })
  async obtenerMia(@UsuarioActual() usuario: PerfilUsuario): Promise<SuscripcionPerfil> {
    return this.suscripcionesServicio.obtenerMia(usuario);
  }

  @Post('checkout-stub')
  @Roles('propietario')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambia de plan (stub de checkout, sin pasarela)',
    description:
      'Actualiza plan_id si el cupo de cobradores cabe en el destino. 422 si supera el límite.',
  })
  @ApiOkResponse({ description: 'Suscripción actualizada' })
  @ApiUnprocessableEntityResponse({ description: 'El cupo actual no cabe en el plan destino' })
  async checkoutStub(
    @UsuarioActual() usuario: PerfilUsuario,
    @Body() dto: CheckoutSuscripcionDto,
  ): Promise<SuscripcionPerfil> {
    return this.suscripcionesServicio.checkoutStub(usuario, dto);
  }
}
