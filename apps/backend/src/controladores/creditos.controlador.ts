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
  CreditoCreado,
  CreditoPerfil,
  CuotaPerfil,
  PerfilUsuario,
} from '@creditos/shared-types';
import { ConsultarCreditosDto } from '../dtos/consultar-creditos.dto';
import { CrearCreditoDto } from '../dtos/crear-credito.dto';
import { Roles } from '../nucleo/decoradores/roles.decorador';
import { UsuarioActual } from '../nucleo/decoradores/usuario-actual.decorador';
import { CreditosServicio } from '../servicios/creditos.servicio';

@ApiTags('creditos')
@ApiBearerAuth()
@Roles('propietario', 'administrador')
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Rol no autorizado o usuario de plataforma sin negocio' })
@Controller('creditos')
export class CreditosControlador {
  constructor(
    @Inject(CreditosServicio) private readonly creditosServicio: CreditosServicio,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crea un crédito, genera el plan de cuotas y registra auditoría',
    description:
      'Roles: propietario, administrador. Transacción atómica: crédito + N cuotas + auditoría. condiciones_originales queda inmutable. El cobrador no crea créditos.',
  })
  @ApiCreatedResponse({ description: 'Crédito activo con plan de cuotas generado' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado en este negocio' })
  @ApiUnprocessableEntityResponse({
    description: 'Cliente inactivo o condiciones financieras inválidas',
  })
  async crear(
    @UsuarioActual() usuario: PerfilUsuario,
    @Body() dto: CrearCreditoDto,
  ): Promise<CreditoCreado> {
    return this.creditosServicio.crear(usuario, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista créditos del negocio autenticado',
    description: 'Roles: propietario, administrador. Filtra siempre por negocio_id del token.',
  })
  @ApiOkResponse({ description: 'Listado de créditos' })
  async listar(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query() consulta: ConsultarCreditosDto,
  ): Promise<CreditoPerfil[]> {
    return this.creditosServicio.listar(usuario, consulta);
  }

  @Get(':id/cuotas')
  @ApiOperation({
    summary: 'Consulta el plan de cuotas de un crédito',
    description: 'Roles: propietario, administrador. Ordenado por numero_cuota. Otro negocio → 404.',
  })
  @ApiOkResponse({ description: 'Plan de cuotas' })
  @ApiNotFoundResponse({ description: 'Crédito no encontrado en este negocio' })
  async listarCuotas(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CuotaPerfil[]> {
    return this.creditosServicio.listarCuotas(usuario, id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulta un crédito por id (incluye condiciones_originales)',
    description: 'Roles: propietario, administrador. Id de otro negocio → 404.',
  })
  @ApiOkResponse({ description: 'Datos del crédito' })
  @ApiNotFoundResponse({ description: 'Crédito no encontrado en este negocio' })
  async obtenerPorId(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CreditoPerfil> {
    return this.creditosServicio.obtenerPorId(usuario, id);
  }
}
