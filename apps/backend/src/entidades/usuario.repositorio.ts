import { Inject, Injectable } from '@nestjs/common';
import type { Prisma, Usuario } from '@prisma/client';
import { PrismaServicio } from '../bd/prisma.servicio';

@Injectable()
export class UsuarioRepositorio {
  constructor(@Inject(PrismaServicio) private readonly prisma: PrismaServicio) {}

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { correo } });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  async crear(datos: Prisma.UsuarioCreateInput): Promise<Usuario> {
    return this.prisma.usuario.create({ data: datos });
  }

  async actualizar(id: string, negocioId: string, datos: Prisma.UsuarioUpdateInput): Promise<Usuario> {
    return this.prisma.usuario.update({
      where: { id, negocioId },
      data: datos,
    });
  }

  async buscarCobradorPorIdYNegocio(id: string, negocioId: string): Promise<Usuario | null> {
    return this.prisma.usuario.findFirst({
      where: { id, negocioId, rol: 'cobrador' },
    });
  }

  async listarCobradores(
    negocioId: string,
    filtros: {
      nombre?: string;
      correo?: string;
      telefono?: string;
      estado?: Usuario['estado'];
    },
  ): Promise<Usuario[]> {
    return this.prisma.usuario.findMany({
      where: {
        negocioId,
        rol: 'cobrador',
        ...(filtros.nombre && {
          nombre: { contains: filtros.nombre, mode: 'insensitive' },
        }),
        ...(filtros.correo && {
          correo: { contains: filtros.correo.toLowerCase(), mode: 'insensitive' },
        }),
        ...(filtros.telefono && {
          telefono: { contains: filtros.telefono },
        }),
        ...(filtros.estado && { estado: filtros.estado }),
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async contarCobradoresActivos(negocioId: string): Promise<number> {
    return this.prisma.usuario.count({
      where: { negocioId, rol: 'cobrador', estado: 'activo' },
    });
  }

  async actualizarUltimoAcceso(id: string): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: { ultimoAcceso: new Date() },
    });
  }
}
