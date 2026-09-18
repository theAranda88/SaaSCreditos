import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  formatearFechaIso,
  generarPlanCuotas,
  parsearFechaIso,
  sumarPeriodos,
} from './generar-plan-cuotas';

describe('generarPlanCuotas', () => {
  it('debe generar 20 cuotas de 6000.00 para 100000 al 20%', () => {
    const plan = generarPlanCuotas({
      montoPrincipal: new Prisma.Decimal('100000.00'),
      tasaInteres: new Prisma.Decimal('20.0000'),
      valorMora: new Prisma.Decimal('5000.00'),
      periodicidad: 'diaria',
      numeroCuotas: 20,
      fechaDesembolso: parsearFechaIso('2026-09-16'),
    });

    expect(plan.interes.toFixed(2)).toBe('20000.00');
    expect(plan.totalAPagar.toFixed(2)).toBe('120000.00');
    expect(plan.montoCuotaBase.toFixed(2)).toBe('6000.00');
    expect(plan.cuotas).toHaveLength(20);
    expect(plan.cuotas.every((cuota) => cuota.montoEsperado.toFixed(2) === '6000.00')).toBe(true);

    const suma = plan.cuotas.reduce(
      (acumulado, cuota) => acumulado.add(cuota.montoEsperado),
      new Prisma.Decimal(0),
    );
    expect(suma.toFixed(2)).toBe('120000.00');
    expect(plan.condicionesOriginales).toMatchObject({
      monto_principal: '100000.00',
      tasa_interes: '20.0000',
      cobra_mora: true,
      valor_mora: '5000.00',
      periodicidad: 'diaria',
      numero_cuotas: 20,
      fecha_desembolso: '2026-09-16',
      formula_interes: 'flat_sobre_principal',
      redondeo: 'half_up_2',
      total_a_pagar: '120000.00',
      monto_cuota_base: '6000.00',
    });
  });

  it('debe dejar el residuo de redondeo en la última cuota', () => {
    const plan = generarPlanCuotas({
      montoPrincipal: new Prisma.Decimal('100000.00'),
      tasaInteres: new Prisma.Decimal('10.0000'),
      valorMora: null,
      periodicidad: 'diaria',
      numeroCuotas: 3,
      fechaDesembolso: parsearFechaIso('2026-09-16'),
    });

    expect(plan.totalAPagar.toFixed(2)).toBe('110000.00');
    expect(plan.cuotas[0]?.montoEsperado.toFixed(2)).toBe('36666.67');
    expect(plan.cuotas[1]?.montoEsperado.toFixed(2)).toBe('36666.67');
    expect(plan.cuotas[2]?.montoEsperado.toFixed(2)).toBe('36666.66');

    const suma = plan.cuotas.reduce(
      (acumulado, cuota) => acumulado.add(cuota.montoEsperado),
      new Prisma.Decimal(0),
    );
    expect(suma.toFixed(2)).toBe('110000.00');
    expect(plan.condicionesOriginales.cobra_mora).toBe(false);
    expect(plan.condicionesOriginales.valor_mora).toBeNull();
  });

  it('debe vencer la primera cuota al día siguiente si la periodicidad es diaria', () => {
    const desembolso = parsearFechaIso('2026-09-16');
    expect(formatearFechaIso(sumarPeriodos(desembolso, 'diaria', 1))).toBe('2026-09-17');
    expect(formatearFechaIso(sumarPeriodos(desembolso, 'semanal', 1))).toBe('2026-09-23');
    expect(formatearFechaIso(sumarPeriodos(desembolso, 'quincenal', 1))).toBe('2026-10-01');
    expect(formatearFechaIso(sumarPeriodos(desembolso, 'mensual', 1))).toBe('2026-10-16');
  });
});
