import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { AsignacionPerfil, PerfilUsuario } from '@creditos/shared-types';
import { ConsultarAsignacionesDto } from '../dtos/consultar-asignaciones.dto';
import { CrearAsignacionDto } from '../dtos/crear-asignacion.dto';
import { Roles } from '../nucleo/decoradores/roles.decorador';
import { UsuarioActual } from '../nucleo/decoradores/usuario-actual.decorador';
import { AsignacionesServicio } from '../servicios/asignaciones.servicio';

@ApiTags('asignaciones')
@ApiBearerAuth()
@Roles('propietario', 'administrador', 'cobrador')
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({
  description: 'Rol no autorizado, usuario de plataforma sin negocio o cartera de otro cobrador',
})
@Controller('asignaciones')
export class AsignacionesControlador {
  constructor(
    @Inject(AsignacionesServicio) private readonly asignacionesServicio: AsignacionesServicio,
  ) {}

  @Post()
  @Roles('propietario', 'administrador')
  @ApiOperation({
    summary: 'Asigna o reasigna un crédito a un cobrador',
    description:
      'Roles: propietario, administrador. Si ya hay asignación activa, la cierra y crea la nueva en la misma transacción + auditoría (crear o reasignar). Unique: una activa por crédito. Cobrador → 403.',
  })
  @ApiCreatedResponse({ description: 'Asignación activa creada' })
  @ApiNotFoundResponse({ description: 'Crédito o cobrador no encontrado en este negocio' })
  @ApiConflictResponse({ description: 'El crédito ya tiene una asignación activa (condición de carrera)' })
  @ApiUnprocessableEntityResponse({
    description:
      'Crédito no asignable, cobrador inactivo o el crédito ya está asignado a ese cobrador',
  })
  async asignar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Body() dto: CrearAsignacionDto,
  ): Promise<AsignacionPerfil> {
    return this.asignacionesServicio.asignar(usuario, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista asignaciones de cartera del negocio autenticado',
    description:
      'Propietario/administrador: filtra por cobradorId, creditoId y estado. Cobrador: solo sus asignaciones activas. Siempre filtra por negocio_id del token.',
  })
  @ApiOkResponse({ description: 'Listado de asignaciones con crédito y cliente' })
  async listar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query() consulta: ConsultarAsignacionesDto,
  ): Promise<AsignacionPerfil[]> {
    return this.asignacionesServicio.listar(usuario, consulta);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulta una asignación por id',
    description:
      'Roles: propietario, administrador, cobrador. Cobrador de otra cartera → 403. Id de otro negocio → 404.',
  })
  @ApiOkResponse({ description: 'Datos de la asignación' })
  @ApiNotFoundResponse({ description: 'Asignación no encontrada en este negocio' })
  async obtenerPorId(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AsignacionPerfil> {
    return this.asignacionesServicio.obtenerPorId(usuario, id);
  }
}
