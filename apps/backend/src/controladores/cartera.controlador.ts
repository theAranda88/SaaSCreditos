import { Controller, Get, Inject, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { ItemCartera, PerfilUsuario, ResultadoAplicarMora } from '@creditos/shared-types';
import { ConsultarCarteraDto } from '../dtos/consultar-cartera.dto';
import { Roles } from '../nucleo/decoradores/roles.decorador';
import { UsuarioActual } from '../nucleo/decoradores/usuario-actual.decorador';
import { CarteraServicio } from '../servicios/cartera.servicio';

@ApiTags('cartera')
@ApiBearerAuth()
@Roles('propietario', 'administrador', 'cobrador')
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({
  description: 'Usuario de plataforma sin negocio, cobrador aplicando mora o cartera de otro negocio',
})
@Controller('cartera')
export class CarteraControlador {
  constructor(@Inject(CarteraServicio) private readonly carteraServicio: CarteraServicio) {}

  @Get()
  @ApiOperation({
    summary: 'Lista cartera por segmento operativo',
    description:
      'RF-010. Segmentos: vigente, mora, pagada. Propietario/administrador pueden filtrar por cobradorId. Cobrador solo ve su cartera asignada.',
  })
  @ApiOkResponse({ description: 'Listado agregado de créditos en cartera' })
  @ApiNotFoundResponse({ description: 'Cobrador no encontrado en este negocio' })
  async listar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query() consulta: ConsultarCarteraDto,
  ): Promise<ItemCartera[]> {
    return this.carteraServicio.listar(usuario, consulta);
  }

  @Post('aplicar-mora')
  @Roles('propietario', 'administrador')
  @ApiOperation({
    summary: 'Aplica mora a cuotas vencidas del negocio',
    description:
      'RF-013. Cuota con vencimiento anterior a hoy y saldo > 0 pasa a mora. Si el crédito tiene valor_mora, se suma una sola vez. Transacción atómica + auditoría.',
  })
  @ApiCreatedResponse({ description: 'Mora aplicada sobre cuotas vencidas' })
  async aplicarMora(@UsuarioActual() usuario: PerfilUsuario): Promise<ResultadoAplicarMora> {
    return this.carteraServicio.aplicarMora(usuario);
  }
}
