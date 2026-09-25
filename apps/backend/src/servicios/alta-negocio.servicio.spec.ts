import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaServicio } from '../bd/prisma.servicio';
import type { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { AltaNegocioServicio } from './alta-negocio.servicio';

describe('AltaNegocioServicio', () => {
  let servicio: AltaNegocioServicio;
  let usuarioRepositorio: UsuarioRepositorio;
  let prisma: PrismaServicio;

  beforeEach(() => {
    usuarioRepositorio = {
      buscarPorCorreo: vi.fn().mockResolvedValue(null),
    } as unknown as UsuarioRepositorio;

    prisma = {
      $transaction: vi.fn(),
    } as unknown as PrismaServicio;

    servicio = new AltaNegocioServicio(prisma, usuarioRepositorio);
  });

  it('debe rechazar alta con correo duplicado', async () => {
    vi.mocked(usuarioRepositorio.buscarPorCorreo).mockResolvedValue({
      id: 'u1',
      negocioId: 'n1',
      nombre: 'X',
      correo: 'dup@test.com',
      hashContrasena: 'h',
      rol: 'propietario',
      estado: 'activo',
      telefono: null,
      fechaCreacion: new Date(),
      ultimoAcceso: null,
      fechaActualizacion: new Date(),
    });

    await expect(
      servicio.crearNegocioYPropietario({
        nombreComercial: 'Negocio',
        nombre: 'Dueño',
        correo: 'dup@test.com',
        contrasena: 'ClaveSegura123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('debe crear negocio, propietario y suscripción en transacción', async () => {
    const tx = {
      plan: {
        findUnique: vi.fn().mockResolvedValue({ id: 'plan-1', codigo: 'emprendedor' }),
      },
      negocio: {
        create: vi.fn().mockResolvedValue({
          id: 'negocio-nuevo',
          nombreComercial: 'Nuevo',
          moneda: 'COP',
        }),
      },
      usuario: {
        create: vi.fn().mockResolvedValue({
          id: 'user-1',
          nombre: 'Dueño',
          correo: 'nuevo@test.com',
          rol: 'propietario',
          negocioId: 'negocio-nuevo',
        }),
      },
      suscripcion: { create: vi.fn().mockResolvedValue({}) },
      auditoria: { create: vi.fn() },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => fn(tx));

    const resultado = await servicio.crearNegocioYPropietario(
      {
        nombreComercial: 'Nuevo',
        nombre: 'Dueño',
        correo: 'nuevo@test.com',
        contrasena: 'ClaveSegura123',
      },
      { registrarAuditoriaPlataforma: { usuarioAdminId: 'admin-1' } },
    );

    expect(resultado.negocio.id).toBe('negocio-nuevo');
    expect(tx.auditoria.create).toHaveBeenCalledTimes(1);
    expect(tx.suscripcion.create).toHaveBeenCalledTimes(1);
  });

  it('debe rechazar si el plan inicial no existe', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn({
        plan: { findUnique: vi.fn().mockResolvedValue(null) },
      }),
    );

    await expect(
      servicio.crearNegocioYPropietario({
        nombreComercial: 'Nuevo',
        nombre: 'Dueño',
        correo: 'nuevo@test.com',
        contrasena: 'ClaveSegura123',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
