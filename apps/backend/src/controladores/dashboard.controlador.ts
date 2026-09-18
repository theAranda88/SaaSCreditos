import { Controller, Get, Inject } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { DashboardNegocio, PerfilUsuario } from '@creditos/shared-types';
import { Roles } from '../nucleo/decoradores/roles.decorador';
import { UsuarioActual } from '../nucleo/decoradores/usuario-actual.decorador';
import { DashboardServicio } from '../servicios/dashboard.servicio';

@ApiTags('dashboard')
@ApiBearerAuth()
@Roles('propietario', 'administrador')
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({
  description: 'Cobrador o usuario de plataforma sin negocio',
})
@Controller('dashboard')
export class DashboardControlador {
  constructor(@Inject(DashboardServicio) private readonly dashboardServicio: DashboardServicio) {}

  @Get()
  @ApiOperation({
    summary: 'Indicadores operativos del negocio',
    description:
      'RF-011. Totales de recaudo del día, cartera activa, cartera en mora y cobradores activos. Solo administración del negocio.',
  })
  @ApiOkResponse({ description: 'KPIs agregados del negocio autenticado' })
  async obtener(@UsuarioActual() usuario: PerfilUsuario): Promise<DashboardNegocio> {
    return this.dashboardServicio.obtener(usuario);
  }
}
