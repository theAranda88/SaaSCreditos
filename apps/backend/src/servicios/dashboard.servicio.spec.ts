import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@creditos/shared-types';
import type { CarteraRepositorio } from '../entidades/cartera.repositorio';
import type { PagoRepositorio } from '../entidades/pago.repositorio';
import type { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { DashboardServicio } from './dashboard.servicio';

describe('DashboardServicio', () => {
  let dashboardServicio: DashboardServicio;
  let carteraRepositorio: CarteraRepositorio;
  let pagoRepositorio: PagoRepositorio;
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

  beforeEach(() => {
    carteraRepositorio = {
      sumarSaldoCarteraActiva: vi.fn().mockResolvedValue(new Prisma.Decimal('50000.00')),
      sumarSaldoCarteraMora: vi.fn().mockResolvedValue(new Prisma.Decimal('12000.00')),
      contarCreditosPorEstado: vi.fn().mockResolvedValue(4),
      contarCreditosEnMora: vi.fn().mockResolvedValue(1),
    } as unknown as CarteraRepositorio;

    pagoRepositorio = {
      sumarPagosValidosDelNegocioDia: vi.fn().mockResolvedValue(new Prisma.Decimal('18000.00')),
    } as unknown as PagoRepositorio;

    usuarioRepositorio = {
      contarCobradoresActivos: vi.fn().mockResolvedValue(2),
    } as unknown as UsuarioRepositorio;

    dashboardServicio = new DashboardServicio(
      carteraRepositorio,
      pagoRepositorio,
      usuarioRepositorio,
    );
  });

  it('debe devolver KPIs agregados del negocio', async () => {
    const resultado = await dashboardServicio.obtener(propietario);

    expect(resultado.recaudo_dia).toBe('18000.00');
    expect(resultado.cartera_activa).toBe('50000.00');
    expect(resultado.cartera_mora).toBe('12000.00');
    expect(resultado.cobradores_activos).toBe(2);
    expect(resultado.creditos_activos).toBe(4);
    expect(resultado.creditos_en_mora).toBe(1);
  });

  it('debe rechazar el dashboard al cobrador', async () => {
    await expect(dashboardServicio.obtener(cobrador)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
