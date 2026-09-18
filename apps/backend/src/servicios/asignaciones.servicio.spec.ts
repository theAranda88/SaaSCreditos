import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Credito, Usuario } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@creditos/shared-types';
import type {
  AsignacionConCartera,
  AsignacionRepositorio,
} from '../entidades/asignacion.repositorio';
import type { CreditoRepositorio } from '../entidades/credito.repositorio';
import type { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { AsignacionesServicio } from './asignaciones.servicio';

describe('AsignacionesServicio', () => {
  let asignacionesServicio: AsignacionesServicio;
  let asignacionRepositorio: AsignacionRepositorio;
  let creditoRepositorio: CreditoRepositorio;
  let usuarioRepositorio: UsuarioRepositorio;

  const fechaFija = new Date('2026-09-18T12:00:00.000Z');

  const usuarioPropietario: PerfilUsuario = {
    id: 'usuario-1',
    nombre: 'Ana',
    correo: 'ana@ejemplo.com',
    rol: 'propietario',
    negocio_id: 'negocio-a',
  };

  const usuarioCobrador: PerfilUsuario = {
    id: 'cobrador-1',
    nombre: 'Carlos',
    correo: 'carlos@ejemplo.com',
    rol: 'cobrador',
    negocio_id: 'negocio-a',
  };

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

  const creditoActivo: Credito = {
    id: 'credito-1',
    negocioId: 'negocio-a',
    clienteId: 'cliente-1',
    montoPrincipal: new Prisma.Decimal('100000.00'),
    tasaInteres: new Prisma.Decimal('20.0000'),
    valorMora: new Prisma.Decimal('5000.00'),
    periodicidad: 'diaria',
    numeroCuotas: 20,
    fechaDesembolso: fechaFija,
    estado: 'activo',
    condicionesOriginales: {},
    fechaCreacion: fechaFija,
    fechaActualizacion: fechaFija,
    creadoPor: 'usuario-1',
  };

  const asignacionActiva: AsignacionConCartera = {
    id: 'asignacion-1',
    negocioId: 'negocio-a',
    creditoId: 'credito-1',
    cobradorId: 'cobrador-1',
    fechaAsignacion: fechaFija,
    fechaFin: null,
    estado: 'activa',
    asignadoPor: 'usuario-1',
    credito: {
      ...creditoActivo,
      cliente: { id: 'cliente-1', nombreCompleto: 'María Pérez' },
    },
  };

  const payload = { creditoId: 'credito-1', cobradorId: 'cobrador-1' };

  beforeEach(() => {
    asignacionRepositorio = {
      buscarPorIdYNegocio: vi.fn(),
      buscarActivaPorCredito: vi.fn(),
      listar: vi.fn(),
      asignar: vi.fn(),
    } as unknown as AsignacionRepositorio;

    creditoRepositorio = {
      buscarPorIdYNegocio: vi.fn(),
    } as unknown as CreditoRepositorio;

    usuarioRepositorio = {
      buscarCobradorPorIdYNegocio: vi.fn(),
    } as unknown as UsuarioRepositorio;

    asignacionesServicio = new AsignacionesServicio(
      asignacionRepositorio,
      creditoRepositorio,
      usuarioRepositorio,
    );
  });

  it('debe crear la primera asignación activa de un crédito', async () => {
    vi.mocked(creditoRepositorio.buscarPorIdYNegocio).mockResolvedValue(creditoActivo);
    vi.mocked(usuarioRepositorio.buscarCobradorPorIdYNegocio).mockResolvedValue(cobradorActivo);
    vi.mocked(asignacionRepositorio.buscarActivaPorCredito).mockResolvedValue(null);
    vi.mocked(asignacionRepositorio.asignar).mockResolvedValue(asignacionActiva);

    const resultado = await asignacionesServicio.asignar(usuarioPropietario, payload);

    expect(asignacionRepositorio.asignar).toHaveBeenCalledWith({
      negocioId: 'negocio-a',
      creditoId: 'credito-1',
      cobradorId: 'cobrador-1',
      asignadoPor: 'usuario-1',
    });
    expect(resultado).toMatchObject({
      id: 'asignacion-1',
      estado: 'activa',
      cobrador_id: 'cobrador-1',
      fecha_fin: null,
      credito: {
        cliente_id: 'cliente-1',
        cliente_nombre_completo: 'María Pérez',
        monto_principal: '100000.00',
      },
    });
  });

  it('debe reasignar cuando ya existe una asignación activa de otro cobrador', async () => {
    vi.mocked(creditoRepositorio.buscarPorIdYNegocio).mockResolvedValue(creditoActivo);
    vi.mocked(usuarioRepositorio.buscarCobradorPorIdYNegocio).mockResolvedValue({
      ...cobradorActivo,
      id: 'cobrador-2',
    });
    vi.mocked(asignacionRepositorio.buscarActivaPorCredito).mockResolvedValue({
      ...asignacionActiva,
      cobradorId: 'cobrador-1',
    });
    vi.mocked(asignacionRepositorio.asignar).mockResolvedValue({
      ...asignacionActiva,
      id: 'asignacion-2',
      cobradorId: 'cobrador-2',
    });

    const resultado = await asignacionesServicio.asignar(usuarioPropietario, {
      creditoId: 'credito-1',
      cobradorId: 'cobrador-2',
    });

    expect(asignacionRepositorio.asignar).toHaveBeenCalled();
    expect(resultado.cobrador_id).toBe('cobrador-2');
  });

  it('debe rechazar reasignar al mismo cobrador activo con 422', async () => {
    vi.mocked(creditoRepositorio.buscarPorIdYNegocio).mockResolvedValue(creditoActivo);
    vi.mocked(usuarioRepositorio.buscarCobradorPorIdYNegocio).mockResolvedValue(cobradorActivo);
    vi.mocked(asignacionRepositorio.buscarActivaPorCredito).mockResolvedValue(asignacionActiva);

    await expect(asignacionesServicio.asignar(usuarioPropietario, payload)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(asignacionRepositorio.asignar).not.toHaveBeenCalled();
  });

  it('debe rechazar un crédito pagado con 422', async () => {
    vi.mocked(creditoRepositorio.buscarPorIdYNegocio).mockResolvedValue({
      ...creditoActivo,
      estado: 'pagado',
    });

    await expect(asignacionesServicio.asignar(usuarioPropietario, payload)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(asignacionRepositorio.asignar).not.toHaveBeenCalled();
  });

  it('debe rechazar un cobrador inactivo con 422', async () => {
    vi.mocked(creditoRepositorio.buscarPorIdYNegocio).mockResolvedValue(creditoActivo);
    vi.mocked(usuarioRepositorio.buscarCobradorPorIdYNegocio).mockResolvedValue({
      ...cobradorActivo,
      estado: 'inactivo',
    });

    await expect(asignacionesServicio.asignar(usuarioPropietario, payload)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('debe responder 404 si el crédito no pertenece al negocio', async () => {
    vi.mocked(creditoRepositorio.buscarPorIdYNegocio).mockResolvedValue(null);

    await expect(asignacionesServicio.asignar(usuarioPropietario, payload)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('debe responder 409 si el unique parcial de asignación activa choca', async () => {
    vi.mocked(creditoRepositorio.buscarPorIdYNegocio).mockResolvedValue(creditoActivo);
    vi.mocked(usuarioRepositorio.buscarCobradorPorIdYNegocio).mockResolvedValue(cobradorActivo);
    vi.mocked(asignacionRepositorio.buscarActivaPorCredito).mockResolvedValue(null);
    const conflicto = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '6.0.0',
    });
    vi.mocked(asignacionRepositorio.asignar).mockRejectedValue(conflicto);

    await expect(asignacionesServicio.asignar(usuarioPropietario, payload)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('debe listar solo la cartera activa del cobrador autenticado', async () => {
    vi.mocked(asignacionRepositorio.listar).mockResolvedValue([asignacionActiva]);

    const resultado = await asignacionesServicio.listar(usuarioCobrador, {
      cobradorId: 'cobrador-ajeno',
      estado: 'finalizada',
    });

    expect(asignacionRepositorio.listar).toHaveBeenCalledWith('negocio-a', {
      cobradorId: 'cobrador-1',
      creditoId: undefined,
      estado: 'activa',
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.cobrador_id).toBe('cobrador-1');
  });

  it('debe responder 403 si el cobrador consulta la asignación de otro', async () => {
    vi.mocked(asignacionRepositorio.buscarPorIdYNegocio).mockResolvedValue({
      ...asignacionActiva,
      cobradorId: 'cobrador-2',
    });

    await expect(
      asignacionesServicio.obtenerPorId(usuarioCobrador, 'asignacion-1'),
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

    await expect(asignacionesServicio.listar(usuarioPlataforma, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
