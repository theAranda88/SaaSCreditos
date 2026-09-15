import { Injectable } from '@nestjs/common';
import type { Plan } from '@prisma/client';
import { PrismaServicio } from '../bd/prisma.servicio';

@Injectable()
export class PlanRepositorio {
  constructor(private readonly prisma: PrismaServicio) {}

  async listarActivos(): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      where: { estado: 'activo' },
      orderBy: { codigo: 'asc' },
    });
  }
}
