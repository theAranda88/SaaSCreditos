import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Cliente, Credito, Cuota } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@creditos/shared-types';
import type { ClienteRepositorio } from '../entidades/cliente.repositorio';
import type { CreditoRepositorio } from '../entidades/credito.repositorio';
import { CreditosServicio } from './creditos.servicio';

describe('CreditosServicio', () => {
  let creditosServicio: CreditosServicio;
  let creditoRepositorio: CreditoRepositorio;
  let clienteRepositorio: ClienteRepositorio;

  const usuarioPropietario: PerfilUsuario = {
    id: 'usuario-1',
    nombre: 'Ana',
    correo: 'ana@ejemplo.com',
    rol: 'propietario',
    negocio_id: 'negocio-a',
  };

  const fechaFija = new Date('2026-09-16T00:00:00.000Z');

  const clienteActivo: Cliente = {
    id: 'cliente-1',
    negocioId: 'negocio-a',
    nombreCompleto: 'María Pérez',
    tipoDocumento: 'CC',
    numeroDocumento: '1234567890',
    telefono: '3001234567',
    direccion: null,
    referenciaUbicacion: null,
    estado: 'activo',
    fechaCreacion: fechaFija,
    fechaActualizacion: fechaFija,
    creadoPor: 'usuario-1',
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
    condicionesOriginales: {
      monto_principal: '100000.00',
      total_a_pagar: '120000.00',
      monto_cuota_base: '6000.00',
    },
    fechaCreacion: fechaFija,
    fechaActualizacion: fechaFija,
    creadoPor: 'usuario-1',
  };

  const cuotaBase: Cuota = {
    id: 'cuota-1',
    negocioId: 'negocio-a',
    creditoId: 'credito-1',
    numeroCuota: 1,
    fechaVencimiento: new Date('2026-09-17T00:00:00.000Z'),
    montoEsperado: new Prisma.Decimal('6000.00'),
    saldoPendiente: new Prisma.Decimal('6000.00'),
    estado: 'pendiente',
  };

  const payloadAlta = {
    clienteId: 'cliente-1',
    montoPrincipal: 100000,
    tasaInteres: 20,
    valorMora: 5000,
    periodicidad: 'diaria' as const,
    numeroCuotas: 20,
    fechaDesembolso: '2026-09-16',
  };

  beforeEach(() => {
    creditoRepositorio = {
      buscarPorIdYNegocio: vi.fn(),
      listar: vi.fn(),
      listarCuotas: vi.fn(),
      crearConPlan: vi.fn(),
    } as unknown as CreditoRepositorio;

    clienteRepositorio = {
      buscarPorIdYNegocio: vi.fn(),
    } as unknown as ClienteRepositorio;

    creditosServicio = new CreditosServicio(creditoRepositorio, clienteRepositorio);
  });

  it('debe crear un crédito activo con tantas cuotas como numero_cuotas', async () => {
    vi.mocked(clienteRepositorio.buscarPorIdYNegocio).mockResolvedValue(clienteActivo);
    const cuotas = Array.from({ length: 20 }, (_, indice) => ({
      ...cuotaBase,
      id: `cuota-${indice + 1}`,
      numeroCuota: indice + 1,
    }));
    vi.mocked(creditoRepositorio.crearConPlan).mockResolvedValue({
      credito: creditoActivo,
      cuotas,
    });

    const resultado = await creditosServicio.crear(usuarioPropietario, payloadAlta);

    expect(creditoRepositorio.crearConPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        negocioId: 'negocio-a',
        clienteId: 'cliente-1',
        numeroCuotas: 20,
        periodicidad: 'diaria',
        cuotas: expect.arrayContaining([
          expect.objectContaining({ numeroCuota: 1 }),
          expect.objectContaining({ numeroCuota: 20 }),
        ]),
      }),
    );
    expect(resultado.credito.estado).toBe('activo');
    expect(resultado.cuotas).toHaveLength(20);
    expect(resultado.credito.condiciones_originales).toMatchObject({
      total_a_pagar: '120000.00',
      monto_cuota_base: '6000.00',
    });
  });

  it('debe rechazar un cliente inactivo con 422', async () => {
    vi.mocked(clienteRepositorio.buscarPorIdYNegocio).mockResolvedValue({
      ...clienteActivo,
      estado: 'inactivo',
    });

    await expect(creditosServicio.crear(usuarioPropietario, payloadAlta)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(creditoRepositorio.crearConPlan).not.toHaveBeenCalled();
  });

  it('debe rechazar monto principal no positivo con 422', async () => {
    vi.mocked(clienteRepositorio.buscarPorIdYNegocio).mockResolvedValue(clienteActivo);

    await expect(
      creditosServicio.crear(usuarioPropietario, { ...payloadAlta, montoPrincipal: 0 }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('debe responder 404 si el cliente no pertenece al negocio', async () => {
    vi.mocked(clienteRepositorio.buscarPorIdYNegocio).mockResolvedValue(null);

    await expect(creditosServicio.crear(usuarioPropietario, payloadAlta)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('debe responder 404 si el crédito no pertenece al negocio', async () => {
    vi.mocked(creditoRepositorio.buscarPorIdYNegocio).mockResolvedValue(null);

    await expect(
      creditosServicio.obtenerPorId(usuarioPropietario, 'credito-ajeno'),
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

    await expect(creditosServicio.listar(usuarioPlataforma, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('debe listar créditos filtrando por negocio_id del token', async () => {
    vi.mocked(creditoRepositorio.listar).mockResolvedValue([creditoActivo]);

    const resultado = await creditosServicio.listar(usuarioPropietario, {
      clienteId: 'cliente-1',
      estado: 'activo',
    });

    expect(creditoRepositorio.listar).toHaveBeenCalledWith('negocio-a', {
      clienteId: 'cliente-1',
      estado: 'activo',
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.negocio_id).toBe('negocio-a');
    expect(resultado[0]?.monto_principal).toBe('100000.00');
  });
});
