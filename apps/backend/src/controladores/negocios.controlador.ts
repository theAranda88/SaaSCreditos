import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { NegocioPerfil, PerfilUsuario } from '@creditos/shared-types';
import { ActualizarNegocioDto } from '../dtos/actualizar-negocio.dto';
import { Roles } from '../nucleo/decoradores/roles.decorador';
import { UsuarioActual } from '../nucleo/decoradores/usuario-actual.decorador';
import { NegociosServicio } from '../servicios/negocios.servicio';

@ApiTags('negocios')
@ApiBearerAuth()
@Controller('negocios')
export class NegociosControlador {
  constructor(
    @Inject(NegociosServicio) private readonly negociosServicio: NegociosServicio,
  ) {}

  @Get('mi-negocio')
  @Roles('propietario', 'administrador')
  @ApiOperation({ summary: 'Consulta los datos del negocio del usuario autenticado' })
  @ApiOkResponse({ description: 'Datos del negocio' })
  @ApiForbiddenResponse({ description: 'Rol no autorizado o sin negocio asignado' })
  async obtenerMiNegocio(@UsuarioActual() usuario: PerfilUsuario): Promise<NegocioPerfil> {
    return this.negociosServicio.obtenerMiNegocio(usuario);
  }

  @Patch('mi-negocio')
  @Roles('propietario')
  @ApiOperation({ summary: 'Actualiza la configuración mínima del negocio' })
  @ApiOkResponse({ description: 'Negocio actualizado' })
  @ApiForbiddenResponse({ description: 'Solo el propietario puede actualizar' })
  async actualizarMiNegocio(
    @UsuarioActual() usuario: PerfilUsuario,
    @Body() dto: ActualizarNegocioDto,
  ): Promise<NegocioPerfil> {
    return this.negociosServicio.actualizarMiNegocio(usuario, dto);
  }

  @Get(':id')
  @Roles('propietario', 'administrador')
  @ApiOperation({ summary: 'Consulta un negocio por id (solo el propio)' })
  @ApiOkResponse({ description: 'Datos del negocio' })
  @ApiForbiddenResponse({ description: 'No puede consultar otro negocio' })
  @ApiNotFoundResponse({ description: 'Negocio no encontrado' })
  async obtenerPorId(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NegocioPerfil> {
    return this.negociosServicio.obtenerPorId(usuario, id);
  }
}
