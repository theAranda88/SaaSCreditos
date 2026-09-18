import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Cuota, Pago } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@creditos/shared-types';
import type { AsignacionRepositorio } from '../entidades/asignacion.repositorio';
import type { CreditoRepositorio } from '../entidades/credito.repositorio';
import type { PagoRepositorio } from '../entidades/pago.repositorio';
import { MENSAJE_DIA_NO_HABIL } from '../nucleo/constantes/pagos.constantes';
import { PagosServicio } from './pagos.servicio';

describe('PagosServicio', () => {
  let pagosServicio: PagosServicio;
  let pagoRepositorio: PagoRepositorio;
  let asignacionRepositorio: AsignacionRepositorio;
  let creditoRepositorio: CreditoRepositorio;

  const fechaFija = new Date('2026-09-21T12:00:00.000Z');

  const usuarioCobrador: PerfilUsuario = {
    id: 'cobrador-1',
    nombre: 'Carlos',
    correo: 'carlos@ejemplo.com',
    rol: 'cobrador',
    negocio_id: 'negocio-a',
  };

  const usuarioPropietario: PerfilUsuario = {
    id: 'usuario-1',
    nombre: 'Ana',
    correo: 'ana@ejemplo.com',
    rol: 'propietario',
    negocio_id: 'negocio-a',
  };

  const cuotaPendiente: Cuota = {
    id: 'cuota-1',
    negocioId: 'negocio-a',
    creditoId: 'credito-1',
    numeroCuota: 1,
    fechaVencimiento: new Date('2026-09-21T00:00:00.000Z'),
    montoEsperado: new Prisma.Decimal('6000.00'),
    saldoPendiente: new Prisma.Decimal('6000.00'),
    estado: 'pendiente',
  };

  const pagoValido: Pago = {
    id: 'pago-1',
    negocioId: 'negocio-a',
    cuotaId: 'cuota-1',
    creditoId: 'credito-1',
    cobradorId: 'cobrador-1',
    monto: new Prisma.Decimal('6000.00'),
    fechaPago: fechaFija,
    metodoPago: 'efectivo',
    estado: 'valido',
    motivoAnulacion: null,
    anuladoPor: null,
    fechaAnulacion: null,
    fechaCreacion: fechaFija,
  };

  beforeEach(() => {
    pagoRepositorio = {
      buscarPorIdYNegocio: vi.fn(),
      listar: vi.fn(),
      listarCuotasCobroPorCreditos: vi.fn(),
      sumarPagosValidosDelDia: vi.fn(),
      registrarPago: vi.fn(),
      anularPago: vi.fn(),
    } as unknown as PagoRepositorio;

    asignacionRepositorio = {
      buscarActivaPorCredito: vi.fn(),
      listar: vi.fn(),
    } as unknown as AsignacionRepositorio;

    creditoRepositorio = {
      buscarCuotaPorIdYNegocio: vi.fn(),
      buscarPorIdYNegocio: vi.fn(),
    } as unknown as CreditoRepositorio;

    pagosServicio = new PagosServicio(
      pagoRepositorio,
      asignacionRepositorio,
      creditoRepositorio,
    );
  });

  it('debe incluir la próxima cuota programada si aún no vence hoy', async () => {
    vi.mocked(asignacionRepositorio.listar).mockResolvedValue([
      {
        id: 'asignacion-1',
        negocioId: 'negocio-a',
        creditoId: 'credito-1',
        cobradorId: 'cobrador-1',
        fechaAsignacion: fechaFija,
        fechaFin: null,
        estado: 'activa',
        asignadoPor: 'usuario-1',
      },
    ]);
    vi.mocked(pagoRepositorio.listarCuotasCobroPorCreditos).mockResolvedValue([
      {
        id: 'cuota-futura',
        negocioId: 'negocio-a',
        creditoId: 'credito-1',
        numeroCuota: 1,
        fechaVencimiento: new Date('2026-09-25T00:00:00.000Z'),
        montoEsperado: new Prisma.Decimal('6000.00'),
        saldoPendiente: new Prisma.Decimal('6000.00'),
        estado: 'pendiente',
        credito: {
          id: 'credito-1',
          clienteId: 'cliente-1',
          cliente: { id: 'cliente-1', nombreCompleto: 'Luis Gómez' },
        },
      },
    ]);

    const respuesta = await pagosServicio.listarCobrosDelDia(usuarioCobrador, {
      fecha: '2026-09-21',
    });

    expect(respuesta.cobros).toHaveLength(1);
    expect(respuesta.cobros[0]?.programado).toBe(true);
    expect(respuesta.cobros[0]?.atrasado).toBe(false);
  });

  it('debe devolver dia_habil=false en domingo sin cobros', async () => {
    const respuesta = await pagosServicio.listarCobrosDelDia(usuarioCobrador, {
      fecha: '2026-09-20',
    });

    expect(respuesta.dia_habil).toBe(false);
    expect(respuesta.mensaje).toBe(MENSAJE_DIA_NO_HABIL);
    expect(respuesta.cobros).toEqual([]);
  });

  it('debe registrar un pago válido en día hábil', async () => {
    vi.mocked(creditoRepositorio.buscarCuotaPorIdYNegocio).mockResolvedValue(cuotaPendiente);
    vi.mocked(asignacionRepositorio.buscarActivaPorCredito).mockResolvedValue({
      id: 'asignacion-1',
      negocioId: 'negocio-a',
      creditoId: 'credito-1',
      cobradorId: 'cobrador-1',
      fechaAsignacion: fechaFija,
      fechaFin: null,
      estado: 'activa',
      asignadoPor: 'usuario-1',
    });
    vi.mocked(pagoRepositorio.registrarPago).mockResolvedValue(pagoValido);

    const resultado = await pagosServicio.registrarPago(usuarioCobrador, {
      cuotaId: 'cuota-1',
      monto: 6000,
      metodoPago: 'efectivo',
      fechaPago: '2026-09-21T12:00:00.000Z',
    });

    expect(resultado.estado).toBe('valido');
    expect(resultado.monto).toBe('6000.00');
    expect(pagoRepositorio.registrarPago).toHaveBeenCalledOnce();
  });

  it('debe rechazar registro de pago en domingo', async () => {
    await expect(
      pagosServicio.registrarPago(usuarioCobrador, {
        cuotaId: 'cuota-1',
        monto: 6000,
        metodoPago: 'efectivo',
        fechaPago: '2026-09-20T12:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('debe rechazar cobro de cartera no asignada con 403', async () => {
    vi.mocked(creditoRepositorio.buscarCuotaPorIdYNegocio).mockResolvedValue(cuotaPendiente);
    vi.mocked(asignacionRepositorio.buscarActivaPorCredito).mockResolvedValue(null);

    await expect(
      pagosServicio.registrarPago(usuarioCobrador, {
        cuotaId: 'cuota-1',
        monto: 3000,
        metodoPago: 'efectivo',
        fechaPago: '2026-09-21T12:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('debe rechazar monto mayor al saldo pendiente', async () => {
    vi.mocked(creditoRepositorio.buscarCuotaPorIdYNegocio).mockResolvedValue(cuotaPendiente);
    vi.mocked(asignacionRepositorio.buscarActivaPorCredito).mockResolvedValue({
      id: 'asignacion-1',
      negocioId: 'negocio-a',
      creditoId: 'credito-1',
      cobradorId: 'cobrador-1',
      fechaAsignacion: fechaFija,
      fechaFin: null,
      estado: 'activa',
      asignadoPor: 'usuario-1',
    });

    await expect(
      pagosServicio.registrarPago(usuarioCobrador, {
        cuotaId: 'cuota-1',
        monto: 7000,
        metodoPago: 'efectivo',
        fechaPago: '2026-09-21T12:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('debe impedir que el cobrador anule pagos', async () => {
    await expect(
      pagosServicio.anularPago(usuarioCobrador, 'pago-1', {
        motivoAnulacion: 'Error de digitación',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('debe anular un pago válido como propietario', async () => {
    vi.mocked(pagoRepositorio.buscarPorIdYNegocio).mockResolvedValue(pagoValido);
    vi.mocked(pagoRepositorio.anularPago).mockResolvedValue({
      ...pagoValido,
      estado: 'anulado',
      motivoAnulacion: 'Error de digitación',
      anuladoPor: 'usuario-1',
      fechaAnulacion: fechaFija,
    });

    const resultado = await pagosServicio.anularPago(usuarioPropietario, 'pago-1', {
      motivoAnulacion: 'Error de digitación',
    });

    expect(resultado.estado).toBe('anulado');
    expect(resultado.motivo_anulacion).toBe('Error de digitación');
  });

  it('debe responder 404 si la cuota no existe en el negocio', async () => {
    vi.mocked(creditoRepositorio.buscarCuotaPorIdYNegocio).mockResolvedValue(null);

    await expect(
      pagosServicio.registrarPago(usuarioCobrador, {
        cuotaId: 'cuota-inexistente',
        monto: 1000,
        metodoPago: 'efectivo',
        fechaPago: '2026-09-21T12:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
