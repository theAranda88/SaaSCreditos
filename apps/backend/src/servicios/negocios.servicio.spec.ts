import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@creditos/shared-types';
import type { NegocioRepositorio } from '../entidades/negocio.repositorio';
import { NegociosServicio } from './negocios.servicio';

describe('NegociosServicio', () => {
  let negociosServicio: NegociosServicio;
  let negocioRepositorio: NegocioRepositorio;

  const usuarioPropietario: PerfilUsuario = {
    id: 'usuario-1',
    nombre: 'Ana',
    correo: 'ana@ejemplo.com',
    rol: 'propietario',
    negocio_id: 'negocio-a',
  };

  beforeEach(() => {
    negocioRepositorio = {
      buscarPorId: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
    } as unknown as NegocioRepositorio;

    negociosServicio = new NegociosServicio(negocioRepositorio);
  });

  it('debe rechazar consulta de negocio ajeno con 403', async () => {
    vi.mocked(negocioRepositorio.buscarPorId).mockResolvedValue({
      id: 'negocio-b',
      nombreComercial: 'Otro negocio',
      razonSocial: null,
      documentoFiscal: null,
      moneda: 'COP',
      estado: 'activo',
      configuracion: {},
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    });

    await expect(
      negociosServicio.obtenerPorId(usuarioPropietario, 'negocio-b'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('debe rechazar usuario de plataforma sin negocio asignado', async () => {
    const usuarioPlataforma: PerfilUsuario = {
      id: 'admin-1',
      nombre: 'Admin Plataforma',
      correo: 'admin@plataforma.com',
      rol: 'admin_plataforma',
      negocio_id: null,
    };

    await expect(negociosServicio.obtenerMiNegocio(usuarioPlataforma)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
