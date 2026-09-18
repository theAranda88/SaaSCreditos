import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { recalcularEstadoCredito, recalcularEstadoCuota } from './recalcular-estados-pago';

describe('recalcularEstadosPago', () => {
  it('debe marcar la cuota como pagada cuando el saldo queda en cero', () => {
    expect(
      recalcularEstadoCuota(new Prisma.Decimal('0.00'), new Prisma.Decimal('6000.00')),
    ).toBe('pagada');
  });

  it('debe marcar la cuota como parcial con abono parcial', () => {
    expect(
      recalcularEstadoCuota(new Prisma.Decimal('3000.00'), new Prisma.Decimal('6000.00')),
    ).toBe('parcial');
  });

  it('debe marcar el crédito como pagado si todas las cuotas están pagadas', () => {
    expect(
      recalcularEstadoCredito([{ estado: 'pagada' }, { estado: 'pagada' }]),
    ).toBe('pagado');
  });

  it('debe marcar el crédito en mora si alguna cuota está en mora', () => {
    expect(
      recalcularEstadoCredito([{ estado: 'pagada' }, { estado: 'mora' }]),
    ).toBe('mora');
  });
});
