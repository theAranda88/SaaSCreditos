import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  calcularNumeroCuotas,
  formatearFechaIso,
  generarPlanCuotas,
  parsearFechaIso,
  sumarPeriodos,
} from './generar-plan-cuotas';

describe('calcularNumeroCuotas', () => {
  it('debe contar días hábiles (sin domingos) en rango de 1 mes, periodicidad diaria', () => {
    // 16 de septiembre de 2026 (martes) + 1 mes = 16 de octubre de 2026 (viernes)
    // Rango: 17 sept a 16 oct (30 días) = 26 días hábiles (sin 4 domingos)
    const desembolso = parsearFechaIso('2026-09-16');
    const numeroCuotas = calcularNumeroCuotas(1, 'diaria', desembolso);

    // Verifica que sea aproximadamente 20-26 días hábiles
    expect(numeroCuotas).toBeGreaterThanOrEqual(20);
    expect(numeroCuotas).toBeLessThanOrEqual(26);
  });

  it('debe calcular cuotas mensuales como múltiplo del plazo', () => {
    const desembolso = parsearFechaIso('2026-09-16');

    expect(calcularNumeroCuotas(1, 'mensual', desembolso)).toBe(1);
    expect(calcularNumeroCuotas(2, 'mensual', desembolso)).toBe(2);
    expect(calcularNumeroCuotas(6, 'mensual', desembolso)).toBe(6);
    expect(calcularNumeroCuotas(12, 'mensual', desembolso)).toBe(12);
  });

  it('debe calcular cuotas quincenales como plazo × 2', () => {
    const desembolso = parsearFechaIso('2026-09-16');

    expect(calcularNumeroCuotas(1, 'quincenal', desembolso)).toBe(2);
    expect(calcularNumeroCuotas(2, 'quincenal', desembolso)).toBe(4);
    expect(calcularNumeroCuotas(6, 'quincenal', desembolso)).toBe(12);
  });

  it('debe calcular cuotas semanales aproximadamente', () => {
    const desembolso = parsearFechaIso('2026-09-16');

    // 1 mes ≈ 52/12 = 4.33 semanas → ceil = 5 semanas
    expect(calcularNumeroCuotas(1, 'semanal', desembolso)).toBe(5);
    // 2 meses ≈ 104/12 = 8.67 semanas → ceil = 9 semanas
    expect(calcularNumeroCuotas(2, 'semanal', desembolso)).toBe(9);
    // 12 meses = 52 semanas
    expect(calcularNumeroCuotas(12, 'semanal', desembolso)).toBe(52);
  });

  it('debe retornar al menos 1 cuota aunque el rango sea corto', () => {
    const desembolso = parsearFechaIso('2026-09-16');

    // Incluso con 1 mes diaria, debe haber al menos 1
    const resultado = calcularNumeroCuotas(1, 'diaria', desembolso);
    expect(resultado).toBeGreaterThanOrEqual(1);
  });
});

describe('generarPlanCuotas', () => {
  it('debe generar cuotas basadas en plazo en meses (periodicidad mensual)', () => {
    const plan = generarPlanCuotas({
      montoPrincipal: new Prisma.Decimal('100000.00'),
      tasaInteres: new Prisma.Decimal('20.0000'),
      valorMora: new Prisma.Decimal('5000.00'),
      periodicidad: 'mensual',
      plazoMeses: 2,
      fechaDesembolso: parsearFechaIso('2026-09-16'),
    });

    expect(plan.interes.toFixed(2)).toBe('20000.00');
    expect(plan.totalAPagar.toFixed(2)).toBe('120000.00');
    expect(plan.cuotas).toHaveLength(2);
    expect(plan.condicionesOriginales.plazo_meses).toBe(2);
    expect(plan.condicionesOriginales.numero_cuotas).toBe(2);

    const suma = plan.cuotas.reduce(
      (acumulado, cuota) => acumulado.add(cuota.montoEsperado),
      new Prisma.Decimal(0),
    );
    expect(suma.toFixed(2)).toBe('120000.00');
  });

  it('debe generar cuotas con periodicidad quincenal (plazo 1 mes = 2 cuotas)', () => {
    const plan = generarPlanCuotas({
      montoPrincipal: new Prisma.Decimal('100000.00'),
      tasaInteres: new Prisma.Decimal('20.0000'),
      valorMora: null,
      periodicidad: 'quincenal',
      plazoMeses: 1,
      fechaDesembolso: parsearFechaIso('2026-09-16'),
    });

    expect(plan.cuotas).toHaveLength(2);
    expect(plan.condicionesOriginales.plazo_meses).toBe(1);
    expect(plan.condicionesOriginales.numero_cuotas).toBe(2);
  });

  it('debe respetar plazo_meses en snapshot immutable de condiciones_originales', () => {
    const plan = generarPlanCuotas({
      montoPrincipal: new Prisma.Decimal('100000.00'),
      tasaInteres: new Prisma.Decimal('10.0000'),
      valorMora: null,
      periodicidad: 'diaria',
      plazoMeses: 1,
      fechaDesembolso: parsearFechaIso('2026-09-16'),
    });

    expect(plan.condicionesOriginales).toMatchObject({
      monto_principal: '100000.00',
      tasa_interes: '10.0000',
      cobra_mora: false,
      valor_mora: null,
      periodicidad: 'diaria',
      plazo_meses: 1,
      formula_interes: 'flat_sobre_principal',
      redondeo: 'half_up_2',
      total_a_pagar: '110000.00',
    });
    expect(plan.condicionesOriginales.numero_cuotas).toBeGreaterThanOrEqual(1);
  });
});

describe('sumarPeriodos', () => {
  it('debe vencer la primera cuota al día siguiente si la periodicidad es diaria', () => {
    const desembolso = parsearFechaIso('2026-09-16');
    expect(formatearFechaIso(sumarPeriodos(desembolso, 'diaria', 1))).toBe('2026-09-17');
    expect(formatearFechaIso(sumarPeriodos(desembolso, 'semanal', 1))).toBe('2026-09-23');
    expect(formatearFechaIso(sumarPeriodos(desembolso, 'quincenal', 1))).toBe('2026-10-01');
    expect(formatearFechaIso(sumarPeriodos(desembolso, 'mensual', 1))).toBe('2026-10-16');
  });
});
