import { Inject, Injectable } from '@nestjs/common';
import type { Credito, Cuota, Prisma } from '@prisma/client';
import { PrismaServicio } from '../bd/prisma.servicio';

export type FiltrosCredito = {
  clienteId?: string;
  estado?: Credito['estado'];
};

export type DatosAltaCredito = {
  negocioId: string;
  clienteId: string;
  montoPrincipal: Prisma.Decimal;
  tasaInteres: Prisma.Decimal;
  valorMora: Prisma.Decimal | null;
  periodicidad: Credito['periodicidad'];
  numeroCuotas: number;
  fechaDesembolso: Date;
  condicionesOriginales: Prisma.InputJsonValue;
  creadoPor: string;
  cuotas: Array<{
    numeroCuota: number;
    fechaVencimiento: Date;
    montoEsperado: Prisma.Decimal;
  }>;
};

@Injectable()
export class CreditoRepositorio {
  constructor(@Inject(PrismaServicio) private readonly prisma: PrismaServicio) {}

  async buscarPorIdYNegocio(id: string, negocioId: string): Promise<Credito | null> {
    return this.prisma.credito.findFirst({
      where: { id, negocioId },
    });
  }

  async listar(negocioId: string, filtros: FiltrosCredito): Promise<Credito[]> {
    return this.prisma.credito.findMany({
      where: {
        negocioId,
        ...(filtros.clienteId && { clienteId: filtros.clienteId }),
        ...(filtros.estado && { estado: filtros.estado }),
      },
      orderBy: { fechaCreacion: 'desc' },
    });
  }

  async listarCuotas(creditoId: string, negocioId: string): Promise<Cuota[]> {
    return this.prisma.cuota.findMany({
      where: { creditoId, negocioId },
      orderBy: { numeroCuota: 'asc' },
    });
  }

  async buscarCuotaPorIdYNegocio(cuotaId: string, negocioId: string): Promise<Cuota | null> {
    return this.prisma.cuota.findFirst({
      where: { id: cuotaId, negocioId },
    });
  }

  async crearConPlan(datos: DatosAltaCredito): Promise<{ credito: Credito; cuotas: Cuota[] }> {
    return this.prisma.$transaction(async (tx) => {
      const credito = await tx.credito.create({
        data: {
          montoPrincipal: datos.montoPrincipal,
          tasaInteres: datos.tasaInteres,
          valorMora: datos.valorMora,
          periodicidad: datos.periodicidad,
          numeroCuotas: datos.numeroCuotas,
          fechaDesembolso: datos.fechaDesembolso,
          condicionesOriginales: datos.condicionesOriginales,
          negocio: { connect: { id: datos.negocioId } },
          cliente: { connect: { id: datos.clienteId } },
          creador: { connect: { id: datos.creadoPor } },
        },
      });

      await tx.cuota.createMany({
        data: datos.cuotas.map((cuota) => ({
          negocioId: datos.negocioId,
          creditoId: credito.id,
          numeroCuota: cuota.numeroCuota,
          fechaVencimiento: cuota.fechaVencimiento,
          montoEsperado: cuota.montoEsperado,
          saldoPendiente: cuota.montoEsperado,
        })),
      });

      await tx.auditoria.create({
        data: {
          negocioId: datos.negocioId,
          usuarioId: datos.creadoPor,
          entidad: 'creditos',
          entidadId: credito.id,
          accion: 'crear',
          detalle: {
            cliente_id: datos.clienteId,
            numero_cuotas: datos.numeroCuotas,
            condiciones_originales: datos.condicionesOriginales,
          },
        },
      });

      const cuotas = await tx.cuota.findMany({
        where: { creditoId: credito.id, negocioId: datos.negocioId },
        orderBy: { numeroCuota: 'asc' },
      });

      return { credito, cuotas };
    });
  }
}
