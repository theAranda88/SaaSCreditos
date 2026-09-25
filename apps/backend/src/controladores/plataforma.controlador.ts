import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type {
  AuditoriaPlataforma,
  NegocioPlataforma,
  PerfilUsuario,
  PlanPerfil,
  UsuarioPlataforma,
} from '@creditos/shared-types';
import { ActualizarPlanDto } from '../dtos/actualizar-plan.dto';
import { CambiarEstadoNegocioDto } from '../dtos/cambiar-estado-negocio.dto';
import { CrearNegocioPlataformaDto } from '../dtos/crear-negocio-plataforma.dto';
import { ConsultarAuditoriasDto } from '../dtos/consultar-auditorias.dto';
import { WebhookSuscripcionDto } from '../dtos/webhook-suscripcion.dto';
import { Roles } from '../nucleo/decoradores/roles.decorador';
import { UsuarioActual } from '../nucleo/decoradores/usuario-actual.decorador';
import { PlataformaServicio } from '../servicios/plataforma.servicio';

@ApiTags('plataforma')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Solo roles de plataforma (sin negocio_id)' })
@Controller('plataforma')
export class PlataformaControlador {
  constructor(
    @Inject(PlataformaServicio) private readonly plataformaServicio: PlataformaServicio,
  ) {}

  @Get('negocios')
  @Roles('admin_plataforma', 'soporte')
  @ApiOperation({ summary: 'Lista negocios de la plataforma (RA-002)' })
  @ApiOkResponse({ description: 'Listado de negocios con suscripción' })
  async listarNegocios(@UsuarioActual() usuario: PerfilUsuario): Promise<NegocioPlataforma[]> {
    return this.plataformaServicio.listarNegocios(usuario);
  }

  @Post('negocios')
  @Roles('admin_plataforma')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crea un negocio con propietario y suscripción (RA-002)',
    description:
      'Alta asistida: transacción negocios + usuarios (propietario) + suscripciones + auditoría. El propietario inicia sesión por su cuenta.',
  })
  @ApiCreatedResponse({ description: 'Negocio creado' })
  @ApiUnprocessableEntityResponse({ description: 'Plan inicial no disponible' })
  async crearNegocio(
    @UsuarioActual() usuario: PerfilUsuario,
    @Body() dto: CrearNegocioPlataformaDto,
  ): Promise<NegocioPlataforma> {
    return this.plataformaServicio.crearNegocio(usuario, dto);
  }

  @Get('negocios/:id')
  @Roles('admin_plataforma', 'soporte')
  @ApiOperation({ summary: 'Consulta un negocio y su suscripción' })
  @ApiOkResponse({ description: 'Detalle del negocio' })
  @ApiNotFoundResponse({ description: 'Negocio no encontrado' })
  async obtenerNegocio(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NegocioPlataforma> {
    return this.plataformaServicio.obtenerNegocio(usuario, id);
  }

  @Patch('negocios/:id/estado')
  @Roles('admin_plataforma')
  @ApiOperation({
    summary: 'Activa, suspende o cancela un negocio',
    description:
      'Transacción: sincroniza negocios.estado y suscripciones.estado y deja auditoría. Negocio suspendido → 403 en operaciones de negocio.',
  })
  @ApiOkResponse({ description: 'Estado actualizado' })
  @ApiNotFoundResponse({ description: 'Negocio no encontrado' })
  async cambiarEstadoNegocio(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoNegocioDto,
  ): Promise<NegocioPlataforma> {
    return this.plataformaServicio.cambiarEstadoNegocio(usuario, id, dto);
  }

  @Get('negocios/:id/usuarios')
  @Roles('admin_plataforma', 'soporte')
  @ApiOperation({ summary: 'Lista usuarios de un negocio (RA-003)' })
  @ApiOkResponse({ description: 'Usuarios del negocio (sin hash)' })
  @ApiNotFoundResponse({ description: 'Negocio no encontrado' })
  async listarUsuarios(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UsuarioPlataforma[]> {
    return this.plataformaServicio.listarUsuarios(usuario, id);
  }

  @Patch('planes/:id')
  @Roles('admin_plataforma')
  @ApiOperation({
    summary: 'Edita límites, precios o estado de un plan (RA-004)',
    description: 'Inactivar un plan con suscripciones activas responde 422.',
  })
  @ApiOkResponse({ description: 'Plan actualizado' })
  @ApiNotFoundResponse({ description: 'Plan no encontrado' })
  @ApiUnprocessableEntityResponse({ description: 'Hay suscripciones activas en el plan' })
  async actualizarPlan(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarPlanDto,
  ): Promise<PlanPerfil> {
    return this.plataformaServicio.actualizarPlan(usuario, id, dto);
  }

  @Post('webhooks/suscripcion-stub')
  @Roles('admin_plataforma')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aplica un evento de facturación stub (sin pasarela)',
    description: 'pago_aprobado, pago_fallido o cancelacion. Actualiza suscripción, negocio y auditoría.',
  })
  @ApiOkResponse({ description: 'Evento aplicado' })
  @ApiNotFoundResponse({ description: 'Suscripción no encontrada' })
  async aplicarWebhook(
    @UsuarioActual() usuario: PerfilUsuario,
    @Body() dto: WebhookSuscripcionDto,
  ): Promise<NegocioPlataforma> {
    return this.plataformaServicio.aplicarWebhookStub(usuario, dto);
  }

  @Get('auditorias')
  @Roles('admin_plataforma', 'soporte')
  @ApiOperation({ summary: 'Consulta auditorías administrativas (RA-007)' })
  @ApiOkResponse({ description: 'Últimas 100 filas filtradas' })
  async listarAuditorias(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query() consulta: ConsultarAuditoriasDto,
  ): Promise<AuditoriaPlataforma[]> {
    return this.plataformaServicio.listarAuditorias(usuario, consulta);
  }
}
