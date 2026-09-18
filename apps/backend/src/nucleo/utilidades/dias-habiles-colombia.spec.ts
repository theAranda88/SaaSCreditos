import { describe, expect, it } from 'vitest';
import { parsearFechaIso } from '../../servicios/generar-plan-cuotas';
import {
  ajustarVencimientoADiaHabil,
  esDiaHabilCobro,
  fechaCobroEfectiva,
} from './dias-habiles-colombia';

describe('diasHabilesColombia', () => {
  it('debe marcar el domingo como día no hábil de cobro', () => {
    expect(esDiaHabilCobro(parsearFechaIso('2026-09-20'))).toBe(false);
  });

  it('debe marcar el lunes como día hábil', () => {
    expect(esDiaHabilCobro(parsearFechaIso('2026-09-21'))).toBe(true);
  });

  it('debe marcar Año Nuevo como festivo', () => {
    expect(esDiaHabilCobro(parsearFechaIso('2026-01-01'))).toBe(false);
  });

  it('debe trasladar un vencimiento en domingo al lunes siguiente', () => {
    const efectiva = fechaCobroEfectiva(parsearFechaIso('2026-09-20'));
    expect(efectiva.toISOString().slice(0, 10)).toBe('2026-09-21');
  });

  it('debe mantener un vencimiento que ya cae en día hábil', () => {
    const fecha = parsearFechaIso('2026-09-21');
    expect(ajustarVencimientoADiaHabil(fecha).toISOString().slice(0, 10)).toBe('2026-09-21');
  });

  it('debe trasladar vencimiento en festivo fijo al siguiente día hábil', () => {
    const efectiva = fechaCobroEfectiva(parsearFechaIso('2026-12-25'));
    expect(efectiva.toISOString().slice(0, 10)).toBe('2026-12-26');
  });
});
