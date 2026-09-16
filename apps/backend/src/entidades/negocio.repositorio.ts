import { Inject, Injectable } from '@nestjs/common';
import type { Negocio, Prisma } from '@prisma/client';
import { PrismaServicio } from '../bd/prisma.servicio';

@Injectable()
export class NegocioRepositorio {
  constructor(@Inject(PrismaServicio) private readonly prisma: PrismaServicio) {}

  async buscarPorId(id: string): Promise<Negocio | null> {
    return this.prisma.negocio.findUnique({ where: { id } });
  }

  async crear(datos: Prisma.NegocioCreateInput): Promise<Negocio> {
    return this.prisma.negocio.create({ data: datos });
  }

  async actualizar(id: string, datos: Prisma.NegocioUpdateInput): Promise<Negocio> {
    return this.prisma.negocio.update({
      where: { id },
      data: datos,
    });
  }
}
