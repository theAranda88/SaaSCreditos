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
import type { ClientePerfil, PerfilUsuario } from '@creditos/shared-types';
import { ActualizarClienteDto } from '../dtos/actualizar-cliente.dto';
import { CambiarEstadoClienteDto } from '../dtos/cambiar-estado-cliente.dto';
import { ConsultarClientesDto } from '../dtos/consultar-clientes.dto';
import { CrearClienteDto } from '../dtos/crear-cliente.dto';
import { Roles } from '../nucleo/decoradores/roles.decorador';
import { UsuarioActual } from '../nucleo/decoradores/usuario-actual.decorador';
import { ClientesServicio } from '../servicios/clientes.servicio';

@ApiTags('clientes')
@ApiBearerAuth()
@Roles('propietario', 'administrador')
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Rol no autorizado' })
@Controller('clientes')
export class ClientesControlador {
  constructor(
    @Inject(ClientesServicio) private readonly clientesServicio: ClientesServicio,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crea un cliente del negocio autenticado' })
  @ApiCreatedResponse({ description: 'Cliente creado' })
  @ApiConflictResponse({ description: 'Documento duplicado en el mismo negocio' })
  async crear(
    @UsuarioActual() usuario: PerfilUsuario,
    @Body() dto: CrearClienteDto,
  ): Promise<ClientePerfil> {
    return this.clientesServicio.crear(usuario, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista y busca clientes del negocio autenticado' })
  @ApiOkResponse({ description: 'Listado de clientes' })
  async listar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query() consulta: ConsultarClientesDto,
  ): Promise<ClientePerfil[]> {
    return this.clientesServicio.listar(usuario, consulta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta un cliente por id (solo del propio negocio)' })
  @ApiOkResponse({ description: 'Datos del cliente' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado en este negocio' })
  async obtenerPorId(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClientePerfil> {
    return this.clientesServicio.obtenerPorId(usuario, id);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Activa o inactiva un cliente (sin borrado físico)' })
  @ApiOkResponse({ description: 'Estado del cliente actualizado' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado en este negocio' })
  async cambiarEstado(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoClienteDto,
  ): Promise<ClientePerfil> {
    return this.clientesServicio.cambiarEstado(usuario, id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza datos de un cliente del propio negocio' })
  @ApiOkResponse({ description: 'Cliente actualizado' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado en este negocio' })
  @ApiConflictResponse({ description: 'Documento duplicado en el mismo negocio' })
  async actualizar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarClienteDto,
  ): Promise<ClientePerfil> {
    return this.clientesServicio.actualizar(usuario, id, dto);
  }
}
