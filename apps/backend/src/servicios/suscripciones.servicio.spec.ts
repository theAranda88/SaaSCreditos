import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@creditos/shared-types';
import type { PrismaServicio } from '../bd/prisma.servicio';
import type { PlanRepositorio } from '../entidades/plan.repositorio';
import type { SuscripcionConPlan, SuscripcionRepositorio } from '../entidades/suscripcion.repositorio';
import type { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { CupoPlanServicio } from './cupo-plan.servicio';
import { SuscripcionesServicio } from './suscripciones.servicio';

describe('SuscripcionesServicio', () => {
  let servicio: SuscripcionesServicio;
  let suscripcionRepositorio: SuscripcionRepositorio;
  let usuarioRepositorio: UsuarioRepositorio;
  let planRepositorio: PlanRepositorio;
  let cupoPlanServicio: CupoPlanServicio;
  let prisma: PrismaServicio;

  const propietario: PerfilUsuario = {
    id: 'usuario-1',
    nombre: 'Ana',
    correo: 'ana@ejemplo.com',
    rol: 'propietario',
    negocio_id: 'negocio-a',
  };

  const fecha = new Date('2026-09-19T00:00:00.000Z');

  const suscripcion: SuscripcionConPlan = {
    id: 'suscripcion-1',
    negocioId: 'negocio-a',
    planId: 'plan-emp',
    estado: 'activa',
    fechaInicio: fecha,
    fechaRenovacion: fecha,
    fechaCancelacion: null,
    referenciaPagoExterno: null,
    fechaCreacion: fecha,
    fechaActualizacion: fecha,
    plan: {
      id: 'plan-emp',
      codigo: 'emprendedor',
      nombre: 'Emprendedor',
      limiteCobradores: 3,
      precioImplementacion: { toFixed: () => '1250000.00' } as never,
      precioMensual: { toFixed: () => '250000.00' } as never,
      caracteristicas: {},
      estado: 'activo',
      fechaCreacion: fecha,
    },
  };

  beforeEach(() => {
    suscripcionRepositorio = {
      buscarPorNegocioId: vi.fn().mockResolvedValue(suscripcion),
    } as unknown as SuscripcionRepositorio;
    usuarioRepositorio = {
      contarCobradoresActivos: vi.fn().mockResolvedValue(1),
    } as unknown as UsuarioRepositorio;
    planRepositorio = {
      buscarPorId: vi.fn(),
    } as unknown as PlanRepositorio;
    cupoPlanServicio = {
      exigirCupoParaPlanDestino: vi.fn().mockResolvedValue(undefined),
    } as unknown as CupoPlanServicio;
    prisma = {
      $transaction: vi.fn(),
    } as unknown as PrismaServicio;

    servicio = new SuscripcionesServicio(
      suscripcionRepositorio,
      usuarioRepositorio,
      planRepositorio,
      cupoPlanServicio,
      prisma,
    );
  });

  it('debe devolver la suscripción del negocio autenticado con el cupo', async () => {
    const resultado = await servicio.obtenerMia(propietario);

    expect(resultado).toMatchObject({
      id: 'suscripcion-1',
      negocio_id: 'negocio-a',
      estado: 'activa',
      cobradores_activos: 1,
      limite_cobradores: 3,
      plan: { codigo: 'emprendedor' },
    });
  });

  it('debe rechazar consulta de suscripción a un rol de plataforma', async () => {
    await expect(
      servicio.obtenerMia({
        ...propietario,
        rol: 'admin_plataforma',
        negocio_id: null,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('debe rechazar checkout a un plan inactivo', async () => {
    vi.mocked(planRepositorio.buscarPorId).mockResolvedValue({
      ...suscripcion.plan,
      id: 'plan-pro',
      estado: 'inactivo',
    });

    await expect(
      servicio.checkoutStub(propietario, { planId: 'plan-pro' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('debe responder 404 si el negocio no tiene suscripción', async () => {
    vi.mocked(suscripcionRepositorio.buscarPorNegocioId).mockResolvedValue(null);

    await expect(servicio.obtenerMia(propietario)).rejects.toBeInstanceOf(NotFoundException);
  });
});
