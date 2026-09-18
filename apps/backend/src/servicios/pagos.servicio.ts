import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Pago } from '@prisma/client';
import type {
  CobroDelDia,
  CobrosDelDiaRespuesta,
  PagoPerfil,
  PerfilUsuario,
  ResumenDiarioPago,
} from '@creditos/shared-types';
import type { AnularPagoDto } from '../dtos/anular-pago.dto';
import type { ConsultarCobrosDelDiaDto } from '../dtos/consultar-cobros-del-dia.dto';
import type { ConsultarPagosDto } from '../dtos/consultar-pagos.dto';
import type { ConsultarResumenDiarioDto } from '../dtos/consultar-resumen-diario.dto';
import type { RegistrarPagoDto } from '../dtos/registrar-pago.dto';
import { AsignacionRepositorio } from '../entidades/asignacion.repositorio';
import { CreditoRepositorio } from '../entidades/credito.repositorio';
import { PagoRepositorio } from '../entidades/pago.repositorio';
import { MENSAJE_DIA_NO_HABIL } from '../nucleo/constantes/pagos.constantes';
import {
  esDiaHabilCobro,
  fechaCobroEfectiva,
  parsearFechaConsulta,
} from '../nucleo/utilidades/dias-habiles-colombia';
import { formatearDinero, formatearFechaIso, parsearFechaIso } from './generar-plan-cuotas';

@Injectable()
export class PagosServicio {
  constructor(
    @Inject(PagoRepositorio) private readonly pagoRepositorio: PagoRepositorio,
    @Inject(AsignacionRepositorio) private readonly asignacionRepositorio: AsignacionRepositorio,
    @Inject(CreditoRepositorio) private readonly creditoRepositorio: CreditoRepositorio,
  ) {}

  async listarCobrosDelDia(
    usuario: PerfilUsuario,
    consulta: ConsultarCobrosDelDiaDto,
  ): Promise<CobrosDelDiaRespuesta> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const fecha = parsearFechaConsulta(consulta.fecha, this.inicioDiaUtc(new Date()));
    const fechaIso = formatearFechaIso(fecha);

    if (!esDiaHabilCobro(fecha)) {
      return {
        fecha: fechaIso,
        dia_habil: false,
        mensaje: MENSAJE_DIA_NO_HABIL,
        cobros: [],
      };
    }

    const cobradorId = this.resolverCobradorConsulta(usuario, consulta.cobradorId);
    const asignaciones = await this.asignacionRepositorio.listar(negocioId, {
      cobradorId,
      estado: 'activa',
    });
    const creditoIds = asignaciones.map((asignacion) => asignacion.creditoId);
    const cuotas = await this.pagoRepositorio.listarCuotasCobroPorCreditos(negocioId, creditoIds);
    const cobros = this.armarCobrosJornada(cuotas, fecha);

    return {
      fecha: fechaIso,
      dia_habil: true,
      mensaje: null,
      cobros,
    };
  }

  async registrarPago(usuario: PerfilUsuario, dto: RegistrarPagoDto): Promise<PagoPerfil> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const fechaPago = dto.fechaPago ? new Date(dto.fechaPago) : new Date();
    const fechaCobro = this.inicioDiaUtc(fechaPago);

    if (!esDiaHabilCobro(fechaCobro)) {
      throw new UnprocessableEntityException(MENSAJE_DIA_NO_HABIL);
    }

    const cuota = await this.creditoRepositorio.buscarCuotaPorIdYNegocio(dto.cuotaId, negocioId);

    if (!cuota) {
      throw new NotFoundException('Cuota no encontrada');
    }

    await this.validarCarteraParaCobro(usuario, cuota.creditoId, negocioId);

    const monto = this.parsearMontoPositivo(dto.monto);

    if (monto.gt(cuota.saldoPendiente)) {
      throw new UnprocessableEntityException(
        'El monto no puede superar el saldo pendiente de la cuota',
      );
    }

    try {
      const pago = await this.pagoRepositorio.registrarPago({
        negocioId,
        cuotaId: cuota.id,
        creditoId: cuota.creditoId,
        cobradorId: usuario.id,
        monto,
        fechaPago,
        metodoPago: dto.metodoPago,
        registradoPor: usuario.id,
      });

      return this.mapearPago(pago);
    } catch (error) {
      this.lanzarSiMontoExcedeSaldo(error);
      throw error;
    }
  }

  async anularPago(
    usuario: PerfilUsuario,
    pagoId: string,
    dto: AnularPagoDto,
  ): Promise<PagoPerfil> {
    const negocioId = this.exigirNegocioAsignado(usuario);

    if (usuario.rol === 'cobrador') {
      throw new ForbiddenException('El cobrador no puede anular pagos');
    }

    const pago = await this.pagoRepositorio.buscarPorIdYNegocio(pagoId, negocioId);

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (pago.estado !== 'valido') {
      throw new UnprocessableEntityException('El pago ya está anulado');
    }

    try {
      const anulado = await this.pagoRepositorio.anularPago({
        pagoId,
        negocioId,
        motivoAnulacion: dto.motivoAnulacion,
        anuladoPor: usuario.id,
      });

      return this.mapearPago(anulado);
    } catch (error) {
      this.lanzarSiPagoYaAnulado(error);
      throw error;
    }
  }

  async listarHistorial(usuario: PerfilUsuario, consulta: ConsultarPagosDto): Promise<PagoPerfil[]> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const credito = await this.creditoRepositorio.buscarPorIdYNegocio(consulta.creditoId, negocioId);

    if (!credito) {
      throw new NotFoundException('Crédito no encontrado');
    }

    if (usuario.rol === 'cobrador') {
      await this.validarCarteraParaCobro(usuario, consulta.creditoId, negocioId);
    }

    const pagos = await this.pagoRepositorio.listar(negocioId, {
      creditoId: consulta.creditoId,
      estado: consulta.estado,
    });

    return pagos.map((pago) => this.mapearPago(pago));
  }

  async resumenDiario(
    usuario: PerfilUsuario,
    consulta: ConsultarResumenDiarioDto,
  ): Promise<ResumenDiarioPago> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const fecha = parsearFechaConsulta(consulta.fecha, this.inicioDiaUtc(new Date()));
    const fechaIso = formatearFechaIso(fecha);
    const cobradorId = this.resolverCobradorConsulta(usuario, consulta.cobradorId);

    if (!esDiaHabilCobro(fecha)) {
      return {
        fecha: fechaIso,
        dia_habil: false,
        cobrador_id: cobradorId,
        esperado: '0.00',
        cobrado: '0.00',
        pendiente: '0.00',
      };
    }

    const cobrosDelDia = await this.listarCobrosDelDia(usuario, {
      fecha: fechaIso,
      cobradorId: usuario.rol === 'cobrador' ? undefined : cobradorId,
    });

    const esperado = cobrosDelDia.cobros.reduce(
      (acumulado, cobro) => acumulado.add(new Prisma.Decimal(cobro.saldo_pendiente)),
      new Prisma.Decimal(0),
    );

    const { inicio, fin } = this.rangoDiaUtc(fecha);
    const cobrado = await this.pagoRepositorio.sumarPagosValidosDelDia(
      negocioId,
      cobradorId,
      inicio,
      fin,
    );
    const pendiente = Prisma.Decimal.max(esperado.minus(cobrado), new Prisma.Decimal(0));

    return {
      fecha: fechaIso,
      dia_habil: true,
      cobrador_id: cobradorId,
      esperado: formatearDinero(esperado),
      cobrado: formatearDinero(cobrado),
      pendiente: formatearDinero(pendiente),
    };
  }

  private armarCobrosJornada(
    cuotas: Array<{
      id: string;
      creditoId: string;
      numeroCuota: number;
      fechaVencimiento: Date;
      montoEsperado: Prisma.Decimal;
      saldoPendiente: Prisma.Decimal;
      estado: CobroDelDia['estado'];
      credito: {
        clienteId: string;
        cliente: { nombreCompleto: string };
      };
    }>,
    fechaConsulta: Date,
  ): CobroDelDia[] {
    const fechaConsultaIso = formatearFechaIso(fechaConsulta);
    const porCredito = new Map<string, typeof cuotas>();

    for (const cuota of cuotas) {
      const actuales = porCredito.get(cuota.creditoId) ?? [];
      actuales.push(cuota);
      porCredito.set(cuota.creditoId, actuales);
    }

    const cobros: CobroDelDia[] = [];

    for (const cuotasCredito of porCredito.values()) {
      const ordenadas = [...cuotasCredito].sort((a, b) => {
        const fechaA = formatearFechaIso(fechaCobroEfectiva(a.fechaVencimiento));
        const fechaB = formatearFechaIso(fechaCobroEfectiva(b.fechaVencimiento));
        return fechaA.localeCompare(fechaB) || a.numeroCuota - b.numeroCuota;
      });

      const vencidas = ordenadas.filter(
        (cuota) => formatearFechaIso(fechaCobroEfectiva(cuota.fechaVencimiento)) <= fechaConsultaIso,
      );

      if (vencidas.length > 0) {
        cobros.push(...vencidas.map((cuota) => this.mapearCobroDelDia(cuota, fechaConsultaIso, false)));
        continue;
      }

      const proxima = ordenadas[0];
      if (proxima) {
        cobros.push(this.mapearCobroDelDia(proxima, fechaConsultaIso, true));
      }
    }

    return cobros.sort((a, b) => {
      if (a.atrasado !== b.atrasado) {
        return a.atrasado ? -1 : 1;
      }
      if (a.programado !== b.programado) {
        return a.programado ? 1 : -1;
      }
      return a.fecha_cobro_efectiva.localeCompare(b.fecha_cobro_efectiva);
    });
  }

  private mapearCobroDelDia(
    cuota: {
      id: string;
      creditoId: string;
      numeroCuota: number;
      fechaVencimiento: Date;
      montoEsperado: Prisma.Decimal;
      saldoPendiente: Prisma.Decimal;
      estado: CobroDelDia['estado'];
      credito: {
        clienteId: string;
        cliente: { nombreCompleto: string };
      };
    },
    fechaConsultaIso: string,
    programado: boolean,
  ): CobroDelDia {
    const fechaCobroEfectivaIso = formatearFechaIso(fechaCobroEfectiva(cuota.fechaVencimiento));
    const atrasado = !programado && fechaCobroEfectivaIso < fechaConsultaIso;

    return {
      cuota_id: cuota.id,
      credito_id: cuota.creditoId,
      numero_cuota: cuota.numeroCuota,
      fecha_vencimiento: formatearFechaIso(cuota.fechaVencimiento),
      fecha_cobro_efectiva: fechaCobroEfectivaIso,
      monto_esperado: formatearDinero(cuota.montoEsperado),
      saldo_pendiente: formatearDinero(cuota.saldoPendiente),
      estado: cuota.estado,
      cliente_id: cuota.credito.clienteId,
      cliente_nombre_completo: cuota.credito.cliente.nombreCompleto,
      atrasado,
      programado,
    };
  }

  private async validarCarteraParaCobro(
    usuario: PerfilUsuario,
    creditoId: string,
    negocioId: string,
  ): Promise<void> {
    if (usuario.rol !== 'cobrador') {
      return;
    }

    const asignacion = await this.asignacionRepositorio.buscarActivaPorCredito(creditoId, negocioId);

    if (!asignacion || asignacion.cobradorId !== usuario.id) {
      throw new ForbiddenException('No puede registrar cobros en cartera no asignada');
    }
  }

  private resolverCobradorConsulta(usuario: PerfilUsuario, cobradorId?: string): string {
    if (usuario.rol === 'cobrador') {
      return usuario.id;
    }

    if (!cobradorId) {
      throw new UnprocessableEntityException('Debe indicar el cobradorId para esta consulta');
    }

    return cobradorId;
  }

  private exigirNegocioAsignado(usuario: PerfilUsuario): string {
    if (!usuario.negocio_id) {
      throw new ForbiddenException('Los usuarios de plataforma no tienen negocio asignado');
    }

    return usuario.negocio_id;
  }

  private parsearMontoPositivo(valor: number): Prisma.Decimal {
    const decimal = new Prisma.Decimal(valor);
    if (!decimal.isFinite() || decimal.lte(0)) {
      throw new UnprocessableEntityException('El monto debe ser mayor a 0');
    }

    return decimal.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }

  private inicioDiaUtc(fecha: Date): Date {
    return parsearFechaIso(formatearFechaIso(fecha));
  }

  private rangoDiaUtc(fecha: Date): { inicio: Date; fin: Date } {
    const inicio = this.inicioDiaUtc(fecha);
    const fin = new Date(Date.UTC(
      inicio.getUTCFullYear(),
      inicio.getUTCMonth(),
      inicio.getUTCDate() + 1,
    ));

    return { inicio, fin };
  }

  private mapearPago(pago: Pago): PagoPerfil {
    return {
      id: pago.id,
      negocio_id: pago.negocioId,
      cuota_id: pago.cuotaId,
      credito_id: pago.creditoId,
      cobrador_id: pago.cobradorId,
      monto: formatearDinero(pago.monto),
      fecha_pago: pago.fechaPago.toISOString(),
      metodo_pago: pago.metodoPago,
      estado: pago.estado,
      motivo_anulacion: pago.motivoAnulacion,
      anulado_por: pago.anuladoPor,
      fecha_anulacion: pago.fechaAnulacion?.toISOString() ?? null,
      fecha_creacion: pago.fechaCreacion.toISOString(),
    };
  }

  private lanzarSiMontoExcedeSaldo(error: unknown): void {
    if (error instanceof Error && error.message === 'MONTO_EXCEDE_SALDO') {
      throw new UnprocessableEntityException(
        'El monto no puede superar el saldo pendiente de la cuota',
      );
    }
  }

  private lanzarSiPagoYaAnulado(error: unknown): void {
    if (error instanceof Error && error.message === 'PAGO_YA_ANULADO') {
      throw new UnprocessableEntityException('El pago ya está anulado');
    }
  }
}
