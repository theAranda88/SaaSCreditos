import {
  Body,
  Controller,
  Get,
  HttpCode,
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
  CobrosDelDiaRespuesta,
  PagoPerfil,
  PerfilUsuario,
  ResumenDiarioPago,
} from '@creditos/shared-types';
import { AnularPagoDto } from '../dtos/anular-pago.dto';
import { ConsultarCobrosDelDiaDto } from '../dtos/consultar-cobros-del-dia.dto';
import { ConsultarPagosDto } from '../dtos/consultar-pagos.dto';
import { ConsultarResumenDiarioDto } from '../dtos/consultar-resumen-diario.dto';
import { RegistrarPagoDto } from '../dtos/registrar-pago.dto';
import { Roles } from '../nucleo/decoradores/roles.decorador';
import { UsuarioActual } from '../nucleo/decoradores/usuario-actual.decorador';
import { PagosServicio } from '../servicios/pagos.servicio';

@ApiTags('pagos')
@ApiBearerAuth()
@Roles('propietario', 'administrador', 'cobrador')
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({
  description: 'Rol no autorizado, cartera no asignada o usuario de plataforma sin negocio',
})
@Controller('pagos')
export class PagosControlador {
  constructor(@Inject(PagosServicio) private readonly pagosServicio: PagosServicio) {}

  @Get('cobros-del-dia')
  @ApiOperation({
    summary: 'Lista cobros programados para la fecha',
    description:
      'Domingos y festivos colombianos: dia_habil=false y lista vacía. Incluye atrasos de días hábiles anteriores. Cobrador: solo su cartera activa.',
  })
  @ApiOkResponse({ description: 'Cobros del día con indicador de día hábil' })
  async listarCobrosDelDia(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query() consulta: ConsultarCobrosDelDiaDto,
  ): Promise<CobrosDelDiaRespuesta> {
    return this.pagosServicio.listarCobrosDelDia(usuario, consulta);
  }

  @Get('resumen-diario')
  @ApiOperation({
    summary: 'Resumen de recaudo del día (RC-009)',
    description: 'Esperado, cobrado y pendiente. En domingos/festivos devuelve ceros y dia_habil=false.',
  })
  @ApiOkResponse({ description: 'Totales del día para el cobrador' })
  @ApiUnprocessableEntityResponse({ description: 'Falta cobradorId para admin/propietario' })
  async resumenDiario(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query() consulta: ConsultarResumenDiarioDto,
  ): Promise<ResumenDiarioPago> {
    return this.pagosServicio.resumenDiario(usuario, consulta);
  }

  @Get()
  @ApiOperation({
    summary: 'Historial de pagos de un crédito (RF-009)',
    description: 'Filtra por creditoId y estado opcional. Cobrador solo en cartera asignada.',
  })
  @ApiOkResponse({ description: 'Listado de pagos del crédito' })
  @ApiNotFoundResponse({ description: 'Crédito no encontrado en este negocio' })
  async listarHistorial(
    @UsuarioActual() usuario: PerfilUsuario,
    @Query() consulta: ConsultarPagosDto,
  ): Promise<PagoPerfil[]> {
    return this.pagosServicio.listarHistorial(usuario, consulta);
  }

  @Post()
  @ApiOperation({
    summary: 'Registra un pago sobre una cuota',
    description:
      'Transacción atómica: pagos + cuotas + crédito + auditoría. No se cobra en domingos ni festivos. Monto <= saldo_pendiente.',
  })
  @ApiCreatedResponse({ description: 'Pago registrado' })
  @ApiNotFoundResponse({ description: 'Cuota no encontrada' })
  @ApiUnprocessableEntityResponse({
    description: 'Monto inválido, excede saldo o día no hábil de cobro',
  })
  async registrarPago(
    @UsuarioActual() usuario: PerfilUsuario,
    @Body() dto: RegistrarPagoDto,
  ): Promise<PagoPerfil> {
    return this.pagosServicio.registrarPago(usuario, dto);
  }

  @Post(':id/anular')
  @HttpCode(200)
  @Roles('propietario', 'administrador')
  @ApiOperation({
    summary: 'Anula un pago válido',
    description: 'Revierte saldos en cuota y crédito. Cobrador → 403. Motivo obligatorio.',
  })
  @ApiOkResponse({ description: 'Pago anulado' })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  @ApiUnprocessableEntityResponse({ description: 'El pago ya está anulado' })
  async anularPago(
    @UsuarioActual() usuario: PerfilUsuario,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnularPagoDto,
  ): Promise<PagoPerfil> {
    return this.pagosServicio.anularPago(usuario, id, dto);
  }
}
