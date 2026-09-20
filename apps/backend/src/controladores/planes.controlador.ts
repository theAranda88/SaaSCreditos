import { Controller, Get, Inject } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { PerfilUsuario, PlanPerfil } from '@creditos/shared-types';
import { Roles } from '../nucleo/decoradores/roles.decorador';
import { UsuarioActual } from '../nucleo/decoradores/usuario-actual.decorador';
import { PlanesServicio } from '../servicios/planes.servicio';

@ApiTags('planes')
@ApiBearerAuth()
@Roles('propietario', 'administrador', 'cobrador', 'soporte', 'admin_plataforma')
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Rol no autorizado' })
@Controller('planes')
export class PlanesControlador {
  constructor(@Inject(PlanesServicio) private readonly planesServicio: PlanesServicio) {}

  @Get()
  @ApiOperation({
    summary: 'Lista el catálogo comercial de planes',
    description:
      'Roles de negocio ven planes activos. Roles de plataforma ven el catálogo completo, incluidos inactivos.',
  })
  @ApiOkResponse({ description: 'Catálogo de planes' })
  async listar(@UsuarioActual() usuario: PerfilUsuario): Promise<PlanPerfil[]> {
    return this.planesServicio.listar(usuario);
  }
}
