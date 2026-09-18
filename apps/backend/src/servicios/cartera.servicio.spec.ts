import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@creditos/shared-types';
import type { AsignacionRepositorio } from '../entidades/asignacion.repositorio';
import type { CarteraRepositorio, CreditoCartera } from '../entidades/cartera.repositorio';
import type { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { CarteraServicio } from './cartera.servicio';

describe('CarteraServicio', () => {
  let carteraServicio: CarteraServicio;
  let carteraRepositorio: CarteraRepositorio;
  let asignacionRepositorio: AsignacionRepositorio;
  let usuarioRepositorio: UsuarioRepositorio;

  const propietario: PerfilUsuario = {
    id: 'usuario-1',
    nombre: 'Ana',
    correo: 'ana@ejemplo.com',
    rol: 'propietario',
    negocio_id: 'negocio-a',
  };

  const cobrador: PerfilUsuario = {
    id: 'cobrador-1',
    nombre: 'Luis',
    correo: 'luis@ejemplo.com',
    rol: 'cobrador',
    negocio_id: 'negocio-a',
  };

  const creditoCartera: CreditoCartera = {
    id: 'credito-1',
    negocioId: 'negocio-a',
    clienteId: 'cliente-1',
    montoPrincipal: new Prisma.Decimal('100000.00'),
    tasaInteres: new Prisma.Decimal('20.0000'),
    valorMora: new Prisma.Decimal('5000.00'),
    periodicidad: 'diaria',
    numeroCuotas: 10,
    fechaDesembolso: new Date('2026-09-16T00:00:00.000Z'),
    estado: 'activo',
    condicionesOriginales: {},
    fechaCreacion: new Date('2026-09-16T00:00:00.000Z'),
    fechaActualizacion: new Date('2026-09-16T00:00:00.000Z'),
    creadoPor: 'usuario-1',
    cliente: { id: 'cliente-1', nombreCompleto: 'María Pérez' },
    asignaciones: [
      {
        id: 'asignacion-1',
        negocioId: 'negocio-a',
        creditoId: 'credito-1',
        cobradorId: 'cobrador-1',
        fechaAsignacion: new Date('2026-09-16T00:00:00.000Z'),
        fechaFin: null,
        estado: 'activa',
        asignadoPor: 'usuario-1',
        cobrador: { id: 'cobrador-1', nombre: 'Luis' },
      },
    ],
    cuotas: [
      {
        id: 'cuota-1',
        saldoPendiente: new Prisma.Decimal('12000.00'),
        estado: 'pendiente',
      },
    ],
  };

  beforeEach(() => {
    carteraRepositorio = {
      listarCreditos: vi.fn(),
      aplicarMora: vi.fn(),
    } as unknown as CarteraRepositorio;

    asignacionRepositorio = {
      listar: vi.fn(),
    } as unknown as AsignacionRepositorio;

    usuarioRepositorio = {
      buscarCobradorPorIdYNegocio: vi.fn(),
    } as unknown as UsuarioRepositorio;

    carteraServicio = new CarteraServicio(
      carteraRepositorio,
      asignacionRepositorio,
      usuarioRepositorio,
    );
  });

  it('debe listar cartera vigente del negocio autenticado', async () => {
    vi.mocked(carteraRepositorio.listarCreditos).mockResolvedValue([creditoCartera]);

    const resultado = await carteraServicio.listar(propietario, { segmento: 'vigente' });

    expect(carteraRepositorio.listarCreditos).toHaveBeenCalledWith('negocio-a', {
      segmento: 'vigente',
      creditoIds: undefined,
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].saldo_pendiente).toBe('12000.00');
    expect(resultado[0].cliente_nombre_completo).toBe('María Pérez');
  });

  it('debe limitar la cartera del cobrador a sus asignaciones activas', async () => {
    vi.mocked(asignacionRepositorio.listar).mockResolvedValue([
      {
        ...creditoCartera.asignaciones[0],
        credito: {
          id: 'credito-1',
          clienteId: 'cliente-1',
          cliente: { nombreCompleto: 'María Pérez' },
          estado: 'activo',
          montoPrincipal: creditoCartera.montoPrincipal,
        },
      },
    ]);
    vi.mocked(carteraRepositorio.listarCreditos).mockResolvedValue([creditoCartera]);

    await carteraServicio.listar(cobrador, { segmento: 'vigente' });

    expect(asignacionRepositorio.listar).toHaveBeenCalledWith('negocio-a', {
      cobradorId: 'cobrador-1',
      estado: 'activa',
    });
    expect(carteraRepositorio.listarCreditos).toHaveBeenCalledWith('negocio-a', {
      segmento: 'vigente',
      creditoIds: ['credito-1'],
    });
  });

  it('debe rechazar que el cobrador aplique mora', async () => {
    await expect(carteraServicio.aplicarMora(cobrador)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('debe aplicar mora y devolver el resumen', async () => {
    vi.mocked(carteraRepositorio.aplicarMora).mockResolvedValue({
      cuotasActualizadas: 2,
      creditosActualizados: 1,
    });

    const resultado = await carteraServicio.aplicarMora(propietario);

    expect(carteraRepositorio.aplicarMora).toHaveBeenCalled();
    expect(resultado.cuotas_actualizadas).toBe(2);
    expect(resultado.creditos_actualizados).toBe(1);
  });

  it('debe responder 404 si el cobrador filtrado no existe', async () => {
    vi.mocked(usuarioRepositorio.buscarCobradorPorIdYNegocio).mockResolvedValue(null);

    await expect(
      carteraServicio.listar(propietario, {
        segmento: 'mora',
        cobradorId: 'cobrador-inexistente',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
