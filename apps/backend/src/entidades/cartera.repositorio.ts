import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Credito } from '@prisma/client';
import type { SegmentoCartera } from '@creditos/shared-types';
import { PrismaServicio } from '../bd/prisma.servicio';
import { recalcularEstadoCredito } from '../servicios/recalcular-estados-pago';

const inclusionCartera = {
  cliente: {
    select: { id: true, nombreCompleto: true },
  },
  asignaciones: {
    where: { estado: 'activa' as const },
    include: {
      cobrador: {
        select: { id: true, nombre: true },
      },
    },
  },
  cuotas: {
    select: {
      id: true,
      saldoPendiente: true,
      estado: true,
    },
  },
} satisfies Prisma.CreditoInclude;

export type CreditoCartera = Prisma.CreditoGetPayload<{
  include: typeof inclusionCartera;
}>;

export type FiltrosCartera = {
  segmento: SegmentoCartera;
  creditoIds?: string[];
};

@Injectable()
export class CarteraRepositorio {
  constructor(@Inject(PrismaServicio) private readonly prisma: PrismaServicio) {}

  async listarCreditos(negocioId: string, filtros: FiltrosCartera): Promise<CreditoCartera[]> {
    const whereSegmento = this.whereSegmento(filtros.segmento);

    return this.prisma.credito.findMany({
      where: {
        negocioId,
        ...whereSegmento,
        ...(filtros.creditoIds && { id: { in: filtros.creditoIds } }),
      },
      include: inclusionCartera,
      orderBy: { fechaCreacion: 'desc' },
    });
  }

  async aplicarMora(
    negocioId: string,
    fechaReferencia: Date,
    usuarioId: string,
  ): Promise<{ cuotasActualizadas: number; creditosActualizados: number }> {
    const cuotasVencidas = await this.prisma.cuota.findMany({
      where: {
        negocioId,
        fechaVencimiento: { lt: fechaReferencia },
        saldoPendiente: { gt: 0 },
        estado: { in: ['pendiente', 'parcial'] },
      },
      include: {
        credito: {
          select: {
            id: true,
            valorMora: true,
          },
        },
      },
    });

    if (cuotasVencidas.length === 0) {
      return { cuotasActualizadas: 0, creditosActualizados: 0 };
    }

    const creditosAfectados = new Set<string>();

    return this.prisma.$transaction(async (tx) => {
      for (const cuota of cuotasVencidas) {
        const valorMora = cuota.credito.valorMora;
        const datosActualizacion: Prisma.CuotaUpdateInput = {
          estado: 'mora',
        };

        if (valorMora) {
          datosActualizacion.montoEsperado = cuota.montoEsperado.add(valorMora);
          datosActualizacion.saldoPendiente = cuota.saldoPendiente.add(valorMora);
        }

        await tx.cuota.update({
          where: { id: cuota.id },
          data: datosActualizacion,
        });

        creditosAfectados.add(cuota.creditoId);
      }

      for (const creditoId of creditosAfectados) {
        const cuotas = await tx.cuota.findMany({
          where: { creditoId, negocioId },
          select: { estado: true },
        });

        await tx.credito.update({
          where: { id: creditoId },
          data: { estado: recalcularEstadoCredito(cuotas) },
        });
      }

      await tx.auditoria.create({
        data: {
          negocioId,
          usuarioId,
          entidad: 'cartera',
          entidadId: negocioId,
          accion: 'aplicar_mora',
          detalle: {
            fecha_referencia: fechaReferencia.toISOString(),
            cuotas_actualizadas: cuotasVencidas.length,
            creditos_actualizados: creditosAfectados.size,
          },
        },
      });

      return {
        cuotasActualizadas: cuotasVencidas.length,
        creditosActualizados: creditosAfectados.size,
      };
    });
  }

  async sumarSaldoCarteraActiva(negocioId: string): Promise<Prisma.Decimal> {
    const resultado = await this.prisma.cuota.aggregate({
      where: {
        negocioId,
        estado: { in: ['pendiente', 'parcial'] },
        saldoPendiente: { gt: 0 },
        credito: { estado: 'activo' },
      },
      _sum: { saldoPendiente: true },
    });

    return resultado._sum.saldoPendiente ?? new Prisma.Decimal(0);
  }

  async sumarSaldoCarteraMora(negocioId: string): Promise<Prisma.Decimal> {
    const resultado = await this.prisma.cuota.aggregate({
      where: {
        negocioId,
        estado: 'mora',
        saldoPendiente: { gt: 0 },
      },
      _sum: { saldoPendiente: true },
    });

    return resultado._sum.saldoPendiente ?? new Prisma.Decimal(0);
  }

  async contarCreditosPorEstado(
    negocioId: string,
    estado: Credito['estado'],
  ): Promise<number> {
    return this.prisma.credito.count({
      where: { negocioId, estado },
    });
  }

  async contarCreditosEnMora(negocioId: string): Promise<number> {
    return this.prisma.credito.count({
      where: {
        negocioId,
        OR: [{ estado: 'mora' }, { cuotas: { some: { estado: 'mora' } } }],
      },
    });
  }

  private whereSegmento(segmento: SegmentoCartera): Prisma.CreditoWhereInput {
    switch (segmento) {
      case 'vigente':
        return {
          estado: 'activo',
          cuotas: { none: { estado: 'mora' } },
        };
      case 'mora':
        return {
          OR: [{ estado: 'mora' }, { cuotas: { some: { estado: 'mora' } } }],
        };
      case 'pagada':
        return { estado: 'pagado' };
      default:
        return {};
    }
  }
}
