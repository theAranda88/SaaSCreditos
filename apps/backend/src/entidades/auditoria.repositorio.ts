import { Inject, Injectable } from '@nestjs/common';
import type { Auditoria, Prisma } from '@prisma/client';
import { PrismaServicio } from '../bd/prisma.servicio';

@Injectable()
export class AuditoriaRepositorio {
  constructor(@Inject(PrismaServicio) private readonly prisma: PrismaServicio) {}

  async listar(filtros: {
    negocioId?: string;
    entidad?: string;
    accion?: string;
  }): Promise<Auditoria[]> {
    return this.prisma.auditoria.findMany({
      where: {
        ...(filtros.negocioId && { negocioId: filtros.negocioId }),
        ...(filtros.entidad && { entidad: filtros.entidad }),
        ...(filtros.accion && { accion: filtros.accion }),
      },
      orderBy: { fecha: 'desc' },
      take: 100,
    });
  }

  async crearEnTransaccion(
    tx: Prisma.TransactionClient,
    datos: Prisma.AuditoriaUncheckedCreateInput,
  ): Promise<Auditoria> {
    return tx.auditoria.create({ data: datos });
  }
}
