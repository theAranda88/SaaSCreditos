import { Inject, Injectable } from '@nestjs/common';
import type { Plan, Prisma, Suscripcion } from '@prisma/client';
import { PrismaServicio } from '../bd/prisma.servicio';

export type SuscripcionConPlan = Suscripcion & { plan: Plan };

@Injectable()
export class SuscripcionRepositorio {
  constructor(@Inject(PrismaServicio) private readonly prisma: PrismaServicio) {}

  async buscarPorNegocioId(negocioId: string): Promise<SuscripcionConPlan | null> {
    return this.prisma.suscripcion.findUnique({
      where: { negocioId },
      include: { plan: true },
    });
  }

  async buscarPorId(id: string): Promise<SuscripcionConPlan | null> {
    return this.prisma.suscripcion.findUnique({
      where: { id },
      include: { plan: true },
    });
  }

  async actualizar(id: string, datos: Prisma.SuscripcionUpdateInput): Promise<SuscripcionConPlan> {
    return this.prisma.suscripcion.update({
      where: { id },
      data: datos,
      include: { plan: true },
    });
  }
}
