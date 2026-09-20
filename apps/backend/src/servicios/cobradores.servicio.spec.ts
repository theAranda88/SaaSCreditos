import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import type { Usuario } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@creditos/shared-types';
import type { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { CobradoresServicio } from './cobradores.servicio';
import type { CupoPlanServicio } from './cupo-plan.servicio';

describe('CobradoresServicio', () => {
  let cobradoresServicio: CobradoresServicio;
  let usuarioRepositorio: UsuarioRepositorio;
  let cupoPlanServicio: CupoPlanServicio;

  const usuarioPropietario: PerfilUsuario = {
    id: 'usuario-1',
    nombre: 'Ana',
    correo: 'ana@ejemplo.com',
    rol: 'propietario',
    negocio_id: 'negocio-a',
  };

  const fechaFija = new Date('2026-09-15T12:00:00.000Z');

  const cobradorActivo: Usuario = {
    id: 'cobrador-1',
    negocioId: 'negocio-a',
    nombre: 'Carlos Cobrador',
    correo: 'carlos@ejemplo.com',
    hashContrasena: 'hash-bcrypt',
    rol: 'cobrador',
    estado: 'activo',
    telefono: '3001234567',
    fechaCreacion: fechaFija,
    ultimoAcceso: null,
    fechaActualizacion: fechaFija,
  };

  beforeEach(() => {
    usuarioRepositorio = {
      buscarPorCorreo: vi.fn(),
      buscarPorId: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      buscarCobradorPorIdYNegocio: vi.fn(),
      listarCobradores: vi.fn(),
      contarCobradoresActivos: vi.fn().mockResolvedValue(0),
      actualizarUltimoAcceso: vi.fn(),
    } as unknown as UsuarioRepositorio;

    cupoPlanServicio = {
      exigirCupoParaAlta: vi.fn().mockResolvedValue(undefined),
    } as unknown as CupoPlanServicio;

    cobradoresServicio = new CobradoresServicio(usuarioRepositorio, cupoPlanServicio);
  });

  it('debe crear un cobrador del negocio autenticado sin exponer el hash', async () => {
    vi.mocked(usuarioRepositorio.buscarPorCorreo).mockResolvedValue(null);
    vi.mocked(usuarioRepositorio.crear).mockResolvedValue(cobradorActivo);

    const resultado = await cobradoresServicio.crear(usuarioPropietario, {
      nombre: '  Carlos Cobrador  ',
      correo: 'Carlos@Ejemplo.com',
      contrasena: 'ClaveSegura123',
      telefono: '3001234567',
    });

    expect(cupoPlanServicio.exigirCupoParaAlta).toHaveBeenCalledWith('negocio-a');
    expect(usuarioRepositorio.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Carlos Cobrador',
        correo: 'carlos@ejemplo.com',
        rol: 'cobrador',
        negocio: { connect: { id: 'negocio-a' } },
      }),
    );
    expect(resultado).toMatchObject({
      id: 'cobrador-1',
      negocio_id: 'negocio-a',
      correo: 'carlos@ejemplo.com',
      rol: 'cobrador',
      estado: 'activo',
    });
    expect(resultado).not.toHaveProperty('hash_contrasena');
    expect(resultado).not.toHaveProperty('hashContrasena');
  });

  it('debe rechazar correo duplicado con conflicto', async () => {
    vi.mocked(usuarioRepositorio.buscarPorCorreo).mockResolvedValue(cobradorActivo);

    await expect(
      cobradoresServicio.crear(usuarioPropietario, {
        nombre: 'Otro',
        correo: 'carlos@ejemplo.com',
        contrasena: 'ClaveSegura123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('debe inactivar un cobrador sin borrarlo', async () => {
    vi.mocked(usuarioRepositorio.buscarCobradorPorIdYNegocio).mockResolvedValue(cobradorActivo);
    vi.mocked(usuarioRepositorio.actualizar).mockResolvedValue({
      ...cobradorActivo,
      estado: 'inactivo',
    });

    const resultado = await cobradoresServicio.cambiarEstado(usuarioPropietario, 'cobrador-1', {
      estado: 'inactivo',
    });

    expect(usuarioRepositorio.actualizar).toHaveBeenCalledWith('cobrador-1', 'negocio-a', {
      estado: 'inactivo',
    });
    expect(resultado.estado).toBe('inactivo');
  });

  it('debe responder 404 si el cobrador no pertenece al negocio', async () => {
    vi.mocked(usuarioRepositorio.buscarCobradorPorIdYNegocio).mockResolvedValue(null);

    await expect(
      cobradoresServicio.obtenerPorId(usuarioPropietario, 'cobrador-ajeno'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('debe rechazar usuario de plataforma sin negocio asignado', async () => {
    const usuarioPlataforma: PerfilUsuario = {
      id: 'admin-1',
      nombre: 'Admin Plataforma',
      correo: 'admin@plataforma.com',
      rol: 'admin_plataforma',
      negocio_id: null,
    };

    await expect(cobradoresServicio.listar(usuarioPlataforma, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('debe listar cobradores filtrando por negocio_id del token', async () => {
    vi.mocked(usuarioRepositorio.listarCobradores).mockResolvedValue([cobradorActivo]);

    const resultado = await cobradoresServicio.listar(usuarioPropietario, { nombre: 'Carlos' });

    expect(usuarioRepositorio.listarCobradores).toHaveBeenCalledWith('negocio-a', {
      nombre: 'Carlos',
      correo: undefined,
      telefono: undefined,
      estado: undefined,
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.negocio_id).toBe('negocio-a');
    expect(resultado[0]?.rol).toBe('cobrador');
  });

  it('debe rechazar crear cobrador cuando el cupo del plan está lleno', async () => {
    vi.mocked(cupoPlanServicio.exigirCupoParaAlta).mockRejectedValue(
      new UnprocessableEntityException('El plan Emprendedor permite hasta 3 cobradores activos'),
    );

    await expect(
      cobradoresServicio.crear(usuarioPropietario, {
        nombre: 'Extra',
        correo: 'extra@ejemplo.com',
        contrasena: 'ClaveSegura123',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(usuarioRepositorio.crear).not.toHaveBeenCalled();
  });

  it('debe rechazar reactivar cobrador cuando el cupo está lleno', async () => {
    vi.mocked(usuarioRepositorio.buscarCobradorPorIdYNegocio).mockResolvedValue({
      ...cobradorActivo,
      estado: 'inactivo',
    });
    vi.mocked(cupoPlanServicio.exigirCupoParaAlta).mockRejectedValue(
      new UnprocessableEntityException('El plan Emprendedor permite hasta 3 cobradores activos'),
    );

    await expect(
      cobradoresServicio.cambiarEstado(usuarioPropietario, 'cobrador-1', { estado: 'activo' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(usuarioRepositorio.actualizar).not.toHaveBeenCalled();
  });
});
