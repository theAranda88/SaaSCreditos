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

  async actualizarUltimoAcceso(id: string): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: { ultimoAcceso: new Date() },
    });
  }
}
