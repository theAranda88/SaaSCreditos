import { Inject, Injectable } from '@nestjs/common';
import type { PerfilUsuario, PlanPerfil, RolUsuario } from '@creditos/shared-types';
import { PlanRepositorio } from '../entidades/plan.repositorio';
import { mapearPlan } from '../nucleo/utilidades/mapeadores-plan';

const ROLES_PLATAFORMA: RolUsuario[] = ['admin_plataforma', 'soporte'];

@Injectable()
export class PlanesServicio {
  constructor(@Inject(PlanRepositorio) private readonly planRepositorio: PlanRepositorio) {}

  async listar(usuario: PerfilUsuario): Promise<PlanPerfil[]> {
    const planes = ROLES_PLATAFORMA.includes(usuario.rol)
      ? await this.planRepositorio.listarTodos()
      : await this.planRepositorio.listarActivos();

    return planes.map((plan) => mapearPlan(plan));
  }
}
