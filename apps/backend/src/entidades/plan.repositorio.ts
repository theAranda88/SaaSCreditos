import { Inject, Injectable } from '@nestjs/common';
import type { Plan, Prisma } from '@prisma/client';
import { PrismaServicio } from '../bd/prisma.servicio';

@Injectable()
export class PlanRepositorio {
  constructor(@Inject(PrismaServicio) private readonly prisma: PrismaServicio) {}

  async listarActivos(): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      where: { estado: 'activo' },
      orderBy: { codigo: 'asc' },
    });
  }

  async listarTodos(): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      orderBy: { codigo: 'asc' },
    });
  }

  async buscarPorId(id: string): Promise<Plan | null> {
    return this.prisma.plan.findUnique({ where: { id } });
  }

  async buscarPorCodigo(codigo: string): Promise<Plan | null> {
    return this.prisma.plan.findUnique({ where: { codigo } });
  }

  async actualizar(id: string, datos: Prisma.PlanUpdateInput): Promise<Plan> {
    return this.prisma.plan.update({ where: { id }, data: datos });
  }

  async contarSuscripcionesActivas(planId: string): Promise<number> {
    return this.prisma.suscripcion.count({
      where: { planId, estado: 'activa' },
    });
  }
}
