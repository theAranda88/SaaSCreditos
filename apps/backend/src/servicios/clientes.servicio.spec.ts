import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Cliente } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@creditos/shared-types';
import type { ClienteRepositorio } from '../entidades/cliente.repositorio';
import { ClientesServicio } from './clientes.servicio';

describe('ClientesServicio', () => {
  let clientesServicio: ClientesServicio;
  let clienteRepositorio: ClienteRepositorio;

  const usuarioPropietario: PerfilUsuario = {
    id: 'usuario-1',
    nombre: 'Ana',
    correo: 'ana@ejemplo.com',
    rol: 'propietario',
    negocio_id: 'negocio-a',
  };

  const fechaFija = new Date('2026-09-15T12:00:00.000Z');

  const clienteActivo: Cliente = {
    id: 'cliente-1',
    negocioId: 'negocio-a',
    nombreCompleto: 'María Pérez',
    tipoDocumento: 'CC',
    numeroDocumento: '1234567890',
    telefono: '3001234567',
    direccion: 'Calle 10 # 5-20',
    referenciaUbicacion: null,
    estado: 'activo',
    fechaCreacion: fechaFija,
    fechaActualizacion: fechaFija,
    creadoPor: 'usuario-1',
    ...(true && { barrio: 'Centro' }),
  };

  beforeEach(() => {
    clienteRepositorio = {
      buscarPorIdYNegocio: vi.fn(),
      buscarPorDocumento: vi.fn(),
      listar: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
    } as unknown as ClienteRepositorio;

    clientesServicio = new ClientesServicio(clienteRepositorio);
  });

  it('debe crear un cliente del negocio autenticado', async () => {
    vi.mocked(clienteRepositorio.buscarPorDocumento).mockResolvedValue(null);
    vi.mocked(clienteRepositorio.crear).mockResolvedValue(clienteActivo);

    const resultado = await clientesServicio.crear(usuarioPropietario, {
      nombreCompleto: '  María Pérez  ',
      tipoDocumento: 'CC',
      numeroDocumento: '1234567890',
      telefono: '3001234567',
      direccion: 'Calle 10 # 5-20',
      barrio: '  Centro  ',
    });

    expect(clienteRepositorio.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        nombreCompleto: 'María Pérez',
        numeroDocumento: '1234567890',
        direccion: 'Calle 10 # 5-20',
        barrio: 'Centro',
        negocio: { connect: { id: 'negocio-a' } },
        creador: { connect: { id: 'usuario-1' } },
      }),
    );
    expect(resultado).toMatchObject({
      id: 'cliente-1',
      negocio_id: 'negocio-a',
      nombre_completo: 'María Pérez',
      estado: 'activo',
      creado_por: 'usuario-1',
    });
  });

  it('debe rechazar documento duplicado en el mismo negocio', async () => {
    vi.mocked(clienteRepositorio.buscarPorDocumento).mockResolvedValue(clienteActivo);

    await expect(
      clientesServicio.crear(usuarioPropietario, {
        nombreCompleto: 'Otra Persona',
        tipoDocumento: 'CC',
        numeroDocumento: '1234567890',
        telefono: '3009999999',
        direccion: 'Otra dirección',
        barrio: 'Otro barrio',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('debe inactivar un cliente sin borrarlo', async () => {
    vi.mocked(clienteRepositorio.buscarPorIdYNegocio).mockResolvedValue(clienteActivo);
    vi.mocked(clienteRepositorio.actualizar).mockResolvedValue({
      ...clienteActivo,
      estado: 'inactivo',
    });

    const resultado = await clientesServicio.cambiarEstado(usuarioPropietario, 'cliente-1', {
      estado: 'inactivo',
    });

    expect(clienteRepositorio.actualizar).toHaveBeenCalledWith('cliente-1', 'negocio-a', {
      estado: 'inactivo',
    });
    expect(resultado.estado).toBe('inactivo');
  });

  it('debe responder 404 si el cliente no pertenece al negocio', async () => {
    vi.mocked(clienteRepositorio.buscarPorIdYNegocio).mockResolvedValue(null);

    await expect(
      clientesServicio.obtenerPorId(usuarioPropietario, 'cliente-ajeno'),
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

    await expect(clientesServicio.listar(usuarioPlataforma, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('debe listar clientes filtrando por negocio_id del token', async () => {
    vi.mocked(clienteRepositorio.listar).mockResolvedValue([clienteActivo]);

    const resultado = await clientesServicio.listar(usuarioPropietario, { nombre: 'María' });

    expect(clienteRepositorio.listar).toHaveBeenCalledWith('negocio-a', {
      nombre: 'María',
      numeroDocumento: undefined,
      telefono: undefined,
      estado: undefined,
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.negocio_id).toBe('negocio-a');
  });
});
