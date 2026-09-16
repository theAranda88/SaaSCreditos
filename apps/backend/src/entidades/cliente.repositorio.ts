import { Inject, Injectable } from '@nestjs/common';
import type { Cliente, Prisma } from '@prisma/client';
import { PrismaServicio } from '../bd/prisma.servicio';

export type FiltrosCliente = {
  nombre?: string;
  numeroDocumento?: string;
  telefono?: string;
  estado?: Cliente['estado'];
};

@Injectable()
export class ClienteRepositorio {
  constructor(@Inject(PrismaServicio) private readonly prisma: PrismaServicio) {}

  async buscarPorIdYNegocio(id: string, negocioId: string): Promise<Cliente | null> {
    return this.prisma.cliente.findFirst({
      where: { id, negocioId },
    });
  }

  async buscarPorDocumento(
    negocioId: string,
    tipoDocumento: string,
    numeroDocumento: string,
  ): Promise<Cliente | null> {
    return this.prisma.cliente.findUnique({
      where: {
        negocioId_tipoDocumento_numeroDocumento: {
          negocioId,
          tipoDocumento,
          numeroDocumento,
        },
      },
    });
  }

  async listar(negocioId: string, filtros: FiltrosCliente): Promise<Cliente[]> {
    return this.prisma.cliente.findMany({
      where: {
        negocioId,
        ...(filtros.nombre && {
          nombreCompleto: { contains: filtros.nombre, mode: 'insensitive' },
        }),
        ...(filtros.numeroDocumento && {
          numeroDocumento: { contains: filtros.numeroDocumento },
        }),
        ...(filtros.telefono && {
          telefono: { contains: filtros.telefono },
        }),
        ...(filtros.estado && { estado: filtros.estado }),
      },
      orderBy: { nombreCompleto: 'asc' },
    });
  }

  async crear(datos: Prisma.ClienteCreateInput): Promise<Cliente> {
    return this.prisma.cliente.create({ data: datos });
  }

  async actualizar(id: string, negocioId: string, datos: Prisma.ClienteUpdateInput): Promise<Cliente> {
    return this.prisma.cliente.update({
      where: { id, negocioId },
      data: datos,
    });
  }
}
