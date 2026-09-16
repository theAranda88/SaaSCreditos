import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { NegocioPerfil, PerfilUsuario } from '@creditos/shared-types';
import type { ActualizarNegocioDto } from '../dtos/actualizar-negocio.dto';
import { NegocioRepositorio } from '../entidades/negocio.repositorio';

@Injectable()
export class NegociosServicio {
  constructor(
    @Inject(NegocioRepositorio) private readonly negocioRepositorio: NegocioRepositorio,
  ) {}

  async obtenerMiNegocio(usuario: PerfilUsuario): Promise<NegocioPerfil> {
    this.exigirNegocioAsignado(usuario);

    const negocio = await this.negocioRepositorio.buscarPorId(usuario.negocio_id!);

    if (!negocio) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return this.mapearNegocio(negocio);
  }

  async actualizarMiNegocio(
    usuario: PerfilUsuario,
    dto: ActualizarNegocioDto,
  ): Promise<NegocioPerfil> {
    this.exigirNegocioAsignado(usuario);

    const negocio = await this.negocioRepositorio.actualizar(usuario.negocio_id!, {
      ...(dto.nombreComercial !== undefined && {
        nombreComercial: dto.nombreComercial.trim(),
      }),
      ...(dto.moneda !== undefined && { moneda: dto.moneda }),
      ...(dto.configuracion !== undefined && {
        configuracion: dto.configuracion as Prisma.InputJsonValue,
      }),
    });

    return this.mapearNegocio(negocio);
  }

  async obtenerPorId(usuario: PerfilUsuario, negocioId: string): Promise<NegocioPerfil> {
    this.exigirNegocioAsignado(usuario);

    if (usuario.negocio_id !== negocioId) {
      const negocioAjeno = await this.negocioRepositorio.buscarPorId(negocioId);

      if (negocioAjeno) {
        throw new ForbiddenException('No puede consultar otro negocio');
      }

      throw new NotFoundException('Negocio no encontrado');
    }

    const negocio = await this.negocioRepositorio.buscarPorId(negocioId);

    if (!negocio) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return this.mapearNegocio(negocio);
  }

  private exigirNegocioAsignado(usuario: PerfilUsuario): void {
    if (!usuario.negocio_id) {
      throw new ForbiddenException('Los usuarios de plataforma no tienen negocio asignado');
    }
  }

  private mapearNegocio(negocio: {
    id: string;
    nombreComercial: string;
    moneda: string;
    configuracion: unknown;
  }): NegocioPerfil {
    return {
      id: negocio.id,
      nombre_comercial: negocio.nombreComercial,
      moneda: negocio.moneda,
      configuracion:
        typeof negocio.configuracion === 'object' && negocio.configuracion !== null
          ? (negocio.configuracion as Record<string, unknown>)
          : {},
    };
  }
}
