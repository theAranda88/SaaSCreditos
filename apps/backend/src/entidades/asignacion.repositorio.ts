import { Inject, Injectable } from '@nestjs/common';
import type { Asignacion, Prisma } from '@prisma/client';
import { PrismaServicio } from '../bd/prisma.servicio';

export const inclusionCartera = {
  credito: {
    include: {
      cliente: {
        select: { id: true, nombreCompleto: true },
      },
    },
  },
} satisfies Prisma.AsignacionInclude;

export type AsignacionConCartera = Prisma.AsignacionGetPayload<{
  include: typeof inclusionCartera;
}>;

export type FiltrosAsignacion = {
  cobradorId?: string;
  creditoId?: string;
  estado?: Asignacion['estado'];
};

export type DatosAsignacion = {
  negocioId: string;
  creditoId: string;
  cobradorId: string;
  asignadoPor: string;
};

@Injectable()
export class AsignacionRepositorio {
  constructor(@Inject(PrismaServicio) private readonly prisma: PrismaServicio) {}

  async buscarPorIdYNegocio(id: string, negocioId: string): Promise<AsignacionConCartera | null> {
    return this.prisma.asignacion.findFirst({
      where: { id, negocioId },
      include: inclusionCartera,
    });
  }

  async buscarActivaPorCredito(creditoId: string, negocioId: string): Promise<Asignacion | null> {
    return this.prisma.asignacion.findFirst({
      where: { creditoId, negocioId, estado: 'activa' },
    });
  }

  async listar(negocioId: string, filtros: FiltrosAsignacion): Promise<AsignacionConCartera[]> {
    return this.prisma.asignacion.findMany({
      where: {
        negocioId,
        ...(filtros.cobradorId && { cobradorId: filtros.cobradorId }),
        ...(filtros.creditoId && { creditoId: filtros.creditoId }),
        ...(filtros.estado && { estado: filtros.estado }),
      },
      include: inclusionCartera,
      orderBy: { fechaAsignacion: 'desc' },
    });
  }

  async asignar(datos: DatosAsignacion): Promise<AsignacionConCartera> {
    return this.prisma.$transaction(async (tx) => {
      const activa = await tx.asignacion.findFirst({
        where: {
          creditoId: datos.creditoId,
          negocioId: datos.negocioId,
          estado: 'activa',
        },
      });

      if (activa) {
        await tx.asignacion.update({
          where: { id: activa.id },
          data: { estado: 'finalizada', fechaFin: new Date() },
        });
      }

      const nueva = await tx.asignacion.create({
        data: {
          estado: 'activa',
          negocio: { connect: { id: datos.negocioId } },
          credito: { connect: { id: datos.creditoId } },
          cobrador: { connect: { id: datos.cobradorId } },
          asignador: { connect: { id: datos.asignadoPor } },
        },
        include: inclusionCartera,
      });

      await tx.auditoria.create({
        data: {
          negocioId: datos.negocioId,
          usuarioId: datos.asignadoPor,
          entidad: 'asignaciones',
          entidadId: nueva.id,
          accion: activa ? 'reasignar' : 'crear',
          detalle: {
            credito_id: datos.creditoId,
            cobrador_id: datos.cobradorId,
            cobrador_anterior_id: activa?.cobradorId ?? null,
            asignacion_anterior_id: activa?.id ?? null,
          },
        },
      });

      return nueva;
    });
  }
}
