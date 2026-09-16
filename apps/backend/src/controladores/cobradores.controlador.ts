import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
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
} from '@nestjs/swagger';
import type { CobradorPerfil, PerfilUsuario } from '@creditos/shared-types';
import { ActualizarCobradorDto } from '../dtos/actualizar-cobrador.dto';
import { CambiarEstadoCobradorDto } from '../dtos/cambiar-estado-cobrador.dto';
import { ConsultarCobradoresDto } from '../dtos/consultar-cobradores.dto';
import { CrearCobradorDto } from '../dtos/crear-cobrador.dto';
import { Roles } from '../nucleo/decoradores/roles.decorador';
import { UsuarioActual } from '../nucleo/decoradores/usuario-actual.decorador';
import { CobradoresServicio } from '../servicios/cobradores.servicio';

@ApiTags('cobradores')
@ApiBearerAuth()
@Roles('propietario', 'administrador')
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Rol no autorizado' })
@Controller('cobradores')
export class CobradoresControlador {
  constructor(
    @Inject(CobradoresServicio) private readonly cobradoresServicio: CobradoresServicio,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crea un usuario cobrador del negocio autenticado' })
  @ApiCreatedResponse({ description: 'Cobrador creado' })
  @ApiConflictResponse({ description: 'Correo ya registrado' })
  async crear(
    @UsuarioActual() usuario: PerfilUsuario,
    @Body() dto: CrearCobradorDto,
  ): Promise<CobradorPerfil> {
    return this.cobradoresServicio.crear(usuario, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista y busca cobradores del negocio autenticado' })
  @ApiOkResponse({ description: 'Listado de cobradores' })
  async listar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query() consulta: ConsultarCobradoresDto,
  ): Promise<CobradorPerfil[]> {
    return this.cobradoresServicio.listar(usuario, consulta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta un cobrador por id (solo del propio negocio)' })
  @ApiOkResponse({ description: 'Datos del cobrador' })
  @ApiNotFoundResponse({ description: 'Cobrador no encontrado en este negocio' })
  async obtenerPorId(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CobradorPerfil> {
    return this.cobradoresServicio.obtenerPorId(usuario, id);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Activa o inactiva un cobrador (sin borrado físico)' })
  @ApiOkResponse({ description: 'Estado del cobrador actualizado' })
  @ApiNotFoundResponse({ description: 'Cobrador no encontrado en este negocio' })
  async cambiarEstado(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoCobradorDto,
  ): Promise<CobradorPerfil> {
    return this.cobradoresServicio.cambiarEstado(usuario, id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza datos de un cobrador del propio negocio' })
  @ApiOkResponse({ description: 'Cobrador actualizado' })
  @ApiNotFoundResponse({ description: 'Cobrador no encontrado en este negocio' })
  @ApiConflictResponse({ description: 'Correo ya registrado' })
  async actualizar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarCobradorDto,
  ): Promise<CobradorPerfil> {
    return this.cobradoresServicio.actualizar(usuario, id, dto);
  }
}
