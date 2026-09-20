import { UnprocessableEntityException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Plan } from '@prisma/client';
import type { SuscripcionRepositorio } from '../entidades/suscripcion.repositorio';
import type { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { CupoPlanServicio } from './cupo-plan.servicio';

describe('CupoPlanServicio', () => {
  let cupoPlanServicio: CupoPlanServicio;
  let suscripcionRepositorio: SuscripcionRepositorio;
  let usuarioRepositorio: UsuarioRepositorio;

  const planEmprendedor = {
    id: 'plan-1',
    nombre: 'Emprendedor',
    limiteCobradores: 3,
  } as Plan;

  beforeEach(() => {
    suscripcionRepositorio = {
      buscarPorNegocioId: vi.fn().mockResolvedValue({
        plan: planEmprendedor,
      }),
    } as unknown as SuscripcionRepositorio;

    usuarioRepositorio = {
      contarCobradoresActivos: vi.fn().mockResolvedValue(3),
    } as unknown as UsuarioRepositorio;

    cupoPlanServicio = new CupoPlanServicio(suscripcionRepositorio, usuarioRepositorio);
  });

  it('debe rechazar un alta cuando los cobradores activos alcanzan el límite', async () => {
    await expect(cupoPlanServicio.exigirCupoParaAlta('negocio-a')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('debe permitir un alta cuando hay cupo disponible', async () => {
    vi.mocked(usuarioRepositorio.contarCobradoresActivos).mockResolvedValue(2);

    await expect(cupoPlanServicio.exigirCupoParaAlta('negocio-a')).resolves.toBeUndefined();
  });

  it('debe rechazar un plan destino menor al cupo actual', async () => {
    vi.mocked(usuarioRepositorio.contarCobradoresActivos).mockResolvedValue(4);

    await expect(
      cupoPlanServicio.exigirCupoParaPlanDestino('negocio-a', planEmprendedor),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
