import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import type { Plan } from '@prisma/client';
import { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { SuscripcionRepositorio } from '../entidades/suscripcion.repositorio';

@Injectable()
export class CupoPlanServicio {
  constructor(
    @Inject(SuscripcionRepositorio) private readonly suscripcionRepositorio: SuscripcionRepositorio,
    @Inject(UsuarioRepositorio) private readonly usuarioRepositorio: UsuarioRepositorio,
  ) {}

  async exigirCupoParaAlta(negocioId: string): Promise<void> {
    const { activos, limite, plan } = await this.obtenerCupo(negocioId);

    if (activos >= limite) {
      throw new UnprocessableEntityException(
        `El plan ${plan.nombre} permite hasta ${limite} cobradores activos`,
      );
    }
  }

  async exigirCupoParaPlanDestino(negocioId: string, planDestino: Plan): Promise<void> {
    const activos = await this.usuarioRepositorio.contarCobradoresActivos(negocioId);

    if (activos > planDestino.limiteCobradores) {
      throw new UnprocessableEntityException(
        `Hay ${activos} cobradores activos; el plan ${planDestino.nombre} permite ${planDestino.limiteCobradores}`,
      );
    }
  }

  async obtenerCupo(negocioId: string): Promise<{ activos: number; limite: number; plan: Plan }> {
    const suscripcion = await this.suscripcionRepositorio.buscarPorNegocioId(negocioId);

    if (!suscripcion) {
      throw new UnprocessableEntityException('El negocio no tiene una suscripción vigente');
    }

    const activos = await this.usuarioRepositorio.contarCobradoresActivos(negocioId);

    return {
      activos,
      limite: suscripcion.plan.limiteCobradores,
      plan: suscripcion.plan,
    };
  }
}
