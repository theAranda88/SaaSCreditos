import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Cuota, Pago } from '@prisma/client';
import { PrismaServicio } from '../bd/prisma.servicio';
import { recalcularEstadoCredito, recalcularEstadoCuota } from '../servicios/recalcular-estados-pago';

export type FiltrosPago = {
  creditoId: string;
  estado?: Pago['estado'];
};

export type DatosRegistrarPago = {
  negocioId: string;
  cuotaId: string;
  creditoId: string;
  cobradorId: string;
  monto: Prisma.Decimal;
  fechaPago: Date;
  metodoPago: Pago['metodoPago'];
  registradoPor: string;
};

export type DatosRegistrarPagoConComprobante = DatosRegistrarPago & {
  comprobanteBase64?: string;
  nombreArchivoComprobante?: string;
};

export type DatosAnularPago = {
  pagoId: string;
  negocioId: string;
  motivoAnulacion: string;
  anuladoPor: string;
};

export type CuotaCobroDelDia = Cuota & {
  credito: {
    id: string;
    clienteId: string;
    periodicidad: string;
    montoPrincipal: Prisma.Decimal;
    cliente: {
      id: string;
      nombreCompleto: string;
      direccion: string | null;
      telefono: string;
    };
  };
};

@Injectable()
export class PagoRepositorio {
  constructor(@Inject(PrismaServicio) private readonly prisma: PrismaServicio) {}

  async buscarPorIdYNegocio(id: string, negocioId: string): Promise<Pago | null> {
    return this.prisma.pago.findFirst({
      where: { id, negocioId },
    });
  }

  async listar(negocioId: string, filtros: FiltrosPago): Promise<Pago[]> {
    return this.prisma.pago.findMany({
      where: {
        negocioId,
        creditoId: filtros.creditoId,
        ...(filtros.estado && { estado: filtros.estado }),
      },
      orderBy: { fechaPago: 'desc' },
    });
  }

  async listarCuotasCobroPorCreditos(
    negocioId: string,
    creditoIds: string[],
  ): Promise<CuotaCobroDelDia[]> {
    if (creditoIds.length === 0) {
      return [];
    }

    return this.prisma.cuota.findMany({
      where: {
        negocioId,
        creditoId: { in: creditoIds },
        estado: { in: ['pendiente', 'parcial', 'mora'] },
        saldoPendiente: { gt: 0 },
      },
      select: {
        id: true,
        negocioId: true,
        creditoId: true,
        numeroCuota: true,
        fechaVencimiento: true,
        montoEsperado: true,
        saldoPendiente: true,
        estado: true,
        credito: {
          select: {
            id: true,
            clienteId: true,
            periodicidad: true,
            montoPrincipal: true,
            cliente: {
              select: { id: true, nombreCompleto: true, direccion: true, telefono: true },
            },
          },
        },
      },
      orderBy: [{ fechaVencimiento: 'asc' }, { numeroCuota: 'asc' }],
    }) as unknown as Promise<CuotaCobroDelDia[]>;
  }

  async sumarPagosValidosDelDia(
    negocioId: string,
    cobradorId: string,
    inicioDia: Date,
    finDia: Date,
  ): Promise<Prisma.Decimal> {
    const resultado = await this.prisma.pago.aggregate({
      where: {
        negocioId,
        cobradorId,
        estado: 'valido',
        fechaPago: { gte: inicioDia, lt: finDia },
      },
      _sum: { monto: true },
    });

    return resultado._sum.monto ?? new Prisma.Decimal(0);
  }

  async sumarPagosValidosDelNegocioDia(
    negocioId: string,
    inicioDia: Date,
    finDia: Date,
  ): Promise<Prisma.Decimal> {
    const resultado = await this.prisma.pago.aggregate({
      where: {
        negocioId,
        estado: 'valido',
        fechaPago: { gte: inicioDia, lt: finDia },
      },
      _sum: { monto: true },
    });

    return resultado._sum.monto ?? new Prisma.Decimal(0);
  }

  async registrarPago(datos: DatosRegistrarPago): Promise<Pago> {
    return this.prisma.$transaction(async (tx) => {
      const cuota = await tx.cuota.findFirst({
        where: { id: datos.cuotaId, negocioId: datos.negocioId, creditoId: datos.creditoId },
      });

      if (!cuota) {
        throw new Error('CUOTA_NO_ENCONTRADA');
      }

      if (datos.monto.gt(cuota.saldoPendiente)) {
        throw new Error('MONTO_EXCEDE_SALDO');
      }

      const nuevoSaldo = cuota.saldoPendiente.minus(datos.monto);
      const nuevoEstadoCuota = recalcularEstadoCuota(nuevoSaldo, cuota.montoEsperado);

      const pago = await tx.pago.create({
        data: {
          negocioId: datos.negocioId,
          cuotaId: datos.cuotaId,
          creditoId: datos.creditoId,
          cobradorId: datos.cobradorId,
          monto: datos.monto,
          fechaPago: datos.fechaPago,
          metodoPago: datos.metodoPago,
          estado: 'valido',
        },
      });

      await tx.cuota.update({
        where: { id: cuota.id },
        data: {
          saldoPendiente: nuevoSaldo,
          estado: nuevoEstadoCuota,
        },
      });

      const cuotasActualizadas = await tx.cuota.findMany({
        where: { creditoId: datos.creditoId, negocioId: datos.negocioId },
        select: { estado: true },
      });

      await tx.credito.update({
        where: { id: datos.creditoId },
        data: { estado: recalcularEstadoCredito(cuotasActualizadas) },
      });

      await tx.auditoria.create({
        data: {
          negocioId: datos.negocioId,
          usuarioId: datos.registradoPor,
          entidad: 'pagos',
          entidadId: pago.id,
          accion: 'crear',
          detalle: {
            cuota_id: datos.cuotaId,
            credito_id: datos.creditoId,
            monto: datos.monto.toFixed(2),
            metodo_pago: datos.metodoPago,
          },
        },
      });

      return pago;
    });
  }

  async registrarPagoConComprobante(datos: DatosRegistrarPagoConComprobante): Promise<Pago> {
    return this.prisma.$transaction(async (tx) => {
      const cuota = await tx.cuota.findFirst({
        where: { id: datos.cuotaId, negocioId: datos.negocioId, creditoId: datos.creditoId },
      });

      if (!cuota) {
        throw new Error('CUOTA_NO_ENCONTRADA');
      }

      if (datos.monto.gt(cuota.saldoPendiente)) {
        throw new Error('MONTO_EXCEDE_SALDO');
      }

      const nuevoSaldo = cuota.saldoPendiente.minus(datos.monto);
      const nuevoEstadoCuota = recalcularEstadoCuota(nuevoSaldo, cuota.montoEsperado);

      const pago = await tx.pago.create({
        data: {
          negocioId: datos.negocioId,
          cuotaId: datos.cuotaId,
          creditoId: datos.creditoId,
          cobradorId: datos.cobradorId,
          monto: datos.monto,
          fechaPago: datos.fechaPago,
          metodoPago: datos.metodoPago,
          estado: 'valido',
        },
      });

      // Si hay comprobante, crear el registro
      if (datos.comprobanteBase64 && datos.nombreArchivoComprobante) {
        const mimeType = this.extraerMimeType(datos.comprobanteBase64);
        await tx.comprobantesPago.create({
          data: {
            pagoId: pago.id,
            tipoAlmacenamiento: 'base64_temporal',
            contenido: datos.comprobanteBase64,
            nombreOriginal: datos.nombreArchivoComprobante,
            mimeType,
          },
        });
      }

      await tx.cuota.update({
        where: { id: cuota.id },
        data: {
          saldoPendiente: nuevoSaldo,
          estado: nuevoEstadoCuota,
        },
      });

      const cuotasActualizadas = await tx.cuota.findMany({
        where: { creditoId: datos.creditoId, negocioId: datos.negocioId },
        select: { estado: true },
      });

      await tx.credito.update({
        where: { id: datos.creditoId },
        data: { estado: recalcularEstadoCredito(cuotasActualizadas) },
      });

      await tx.auditoria.create({
        data: {
          negocioId: datos.negocioId,
          usuarioId: datos.registradoPor,
          entidad: 'pagos',
          entidadId: pago.id,
          accion: 'crear',
          detalle: {
            cuota_id: datos.cuotaId,
            credito_id: datos.creditoId,
            monto: datos.monto.toFixed(2),
            metodo_pago: datos.metodoPago,
            con_comprobante: !!datos.comprobanteBase64,
          },
        },
      });

      return pago;
    });
  }

  private extraerMimeType(base64: string): string {
    const match = base64.match(/^data:([^;]+)/);
    return match ? match[1] : 'application/octet-stream';
  }

  async anularPago(datos: DatosAnularPago): Promise<Pago> {
    return this.prisma.$transaction(async (tx) => {
      const pago = await tx.pago.findFirst({
        where: { id: datos.pagoId, negocioId: datos.negocioId },
      });

      if (!pago) {
        throw new Error('PAGO_NO_ENCONTRADO');
      }

      if (pago.estado !== 'valido') {
        throw new Error('PAGO_YA_ANULADO');
      }

      const cuota = await tx.cuota.findFirst({
        where: { id: pago.cuotaId, negocioId: datos.negocioId },
      });

      if (!cuota) {
        throw new Error('CUOTA_NO_ENCONTRADA');
      }

      const nuevoSaldo = cuota.saldoPendiente.add(pago.monto);
      const nuevoEstadoCuota = recalcularEstadoCuota(nuevoSaldo, cuota.montoEsperado);

      const pagoAnulado = await tx.pago.update({
        where: { id: pago.id },
        data: {
          estado: 'anulado',
          motivoAnulacion: datos.motivoAnulacion,
          anuladoPor: datos.anuladoPor,
          fechaAnulacion: new Date(),
        },
      });

      await tx.cuota.update({
        where: { id: cuota.id },
        data: {
          saldoPendiente: nuevoSaldo,
          estado: nuevoEstadoCuota,
        },
      });

      const cuotasActualizadas = await tx.cuota.findMany({
        where: { creditoId: pago.creditoId, negocioId: datos.negocioId },
        select: { estado: true },
      });

      await tx.credito.update({
        where: { id: pago.creditoId },
        data: { estado: recalcularEstadoCredito(cuotasActualizadas) },
      });

      await tx.auditoria.create({
        data: {
          negocioId: datos.negocioId,
          usuarioId: datos.anuladoPor,
          entidad: 'pagos',
          entidadId: pago.id,
          accion: 'anular',
          detalle: {
            motivo_anulacion: datos.motivoAnulacion,
            monto: pago.monto.toFixed(2),
            cuota_id: pago.cuotaId,
          },
        },
      });

      return pagoAnulado;
    });
  }
}
