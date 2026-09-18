import { describe, expect, it } from 'vitest';
import {
  esDiaHabilCobro,
  fechaCobroEfectiva,
  infoDiaCalendario,
  vencimientoTrasladado,
} from './dias-habiles-colombia';

describe('dias-habiles-colombia (front)', () => {
  it('debe marcar domingo como día inhábil', () => {
    expect(esDiaHabilCobro('2026-09-20')).toBe(false);
    expect(infoDiaCalendario('2026-09-20')).toMatchObject({
      esHabil: false,
      motivo: 'domingo',
      etiqueta: 'Domingo',
    });
  });

  it('debe trasladar vencimiento en domingo al lunes siguiente', () => {
    expect(fechaCobroEfectiva('2026-09-20')).toBe('2026-09-21');
    expect(vencimientoTrasladado('2026-09-20', '2026-09-21')).toBe(true);
  });

  it('debe considerar hábil un lunes ordinario', () => {
    expect(esDiaHabilCobro('2026-09-21')).toBe(true);
    expect(infoDiaCalendario('2026-09-21').esHabil).toBe(true);
  });
});
