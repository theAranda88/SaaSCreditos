import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@creditos/shared-types';
import type { PrismaServicio } from '../bd/prisma.servicio';
import type { AuditoriaRepositorio } from '../entidades/auditoria.repositorio';
import type { NegocioRepositorio } from '../entidades/negocio.repositorio';
import type { PlanRepositorio } from '../entidades/plan.repositorio';
import type { SuscripcionRepositorio } from '../entidades/suscripcion.repositorio';
import type { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { PlataformaServicio } from './plataforma.servicio';

describe('PlataformaServicio', () => {
  let servicio: PlataformaServicio;
  let negocioRepositorio: NegocioRepositorio;
  let usuarioRepositorio: UsuarioRepositorio;
  let planRepositorio: PlanRepositorio;
  let prisma: PrismaServicio;

  const admin: PerfilUsuario = {
    id: 'admin-1',
    nombre: 'Admin',
    correo: 'admin@plataforma.local',
    rol: 'admin_plataforma',
    negocio_id: null,
  };

  const soporte: PerfilUsuario = {
    ...admin,
    id: 'soporte-1',
    rol: 'soporte',
    correo: 'soporte@plataforma.local',
  };

  const fecha = new Date('2026-09-19T00:00:00.000Z');
  const negocio = {
    id: 'negocio-a',
    nombreComercial: 'Alfa',
    moneda: 'COP',
    estado: 'activo' as const,
    fechaCreacion: fecha,
    suscripcion: {
      id: 'suscripcion-1',
      estado: 'activa' as const,
      fechaRenovacion: fecha,
      plan: { codigo: 'emprendedor', nombre: 'Emprendedor', limiteCobradores: 3 },
    },
  };

  beforeEach(() => {
    negocioRepositorio = {
      listarConSuscripcion: vi.fn().mockResolvedValue([negocio]),
      buscarPorIdConSuscripcion: vi.fn().mockResolvedValue(negocio),
      buscarPorId: vi.fn().mockResolvedValue(negocio),
    } as unknown as NegocioRepositorio;
    usuarioRepositorio = {
      listarPorNegocio: vi.fn().mockResolvedValue([]),
    } as unknown as UsuarioRepositorio;
    planRepositorio = {
      buscarPorId: vi.fn().mockResolvedValue({
        id: 'plan-1',
        estado: 'activo',
        limiteCobradores: 3,
        precioImplementacion: { toFixed: () => '1.00' },
        precioMensual: { toFixed: () => '1.00' },
        codigo: 'emprendedor',
        nombre: 'Emprendedor',
        caracteristicas: {},
        fechaCreacion: fecha,
      }),
      contarSuscripcionesActivas: vi.fn().mockResolvedValue(1),
      actualizar: vi.fn(),
    } as unknown as PlanRepositorio;
    prisma = { $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => fn({
      negocio: { update: vi.fn() },
      suscripcion: { update: vi.fn() },
      auditoria: { create: vi.fn() },
    })) } as unknown as PrismaServicio;

    servicio = new PlataformaServicio(
      negocioRepositorio,
      usuarioRepositorio,
      planRepositorio,
      {} as SuscripcionRepositorio,
      {} as AuditoriaRepositorio,
      prisma,
    );
  });

  it('debe listar negocios para admin de plataforma', async () => {
    const listado = await servicio.listarNegocios(admin);
    expect(listado).toHaveLength(1);
    expect(listado[0]).toMatchObject({
      id: 'negocio-a',
      estado: 'activo',
      suscripcion: { plan_codigo: 'emprendedor' },
    });
  });

  it('debe rechazar listado a un propietario de negocio', async () => {
    await expect(
      servicio.listarNegocios({
        ...admin,
        rol: 'propietario',
        negocio_id: 'negocio-a',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('debe rechazar suspender si el rol es soporte', async () => {
    await expect(
      servicio.cambiarEstadoNegocio(soporte, 'negocio-a', { estado: 'suspendido' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('debe suspender negocio y suscripción en una transacción', async () => {
    await servicio.cambiarEstadoNegocio(admin, 'negocio-a', { estado: 'suspendido' });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('debe rechazar inactivar un plan con suscripciones activas', async () => {
    await expect(
      servicio.actualizarPlan(admin, 'plan-1', { estado: 'inactivo' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
