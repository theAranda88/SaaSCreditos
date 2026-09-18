import { Prisma } from '@prisma/client';
import type {
  CondicionesOriginalesCredito,
  PeriodicidadCredito,
} from '@creditos/shared-types';
import { FORMULA_INTERES, REDONDEO } from '../nucleo/constantes/creditos.constantes';

export type CuotaCalculada = {
  numeroCuota: number;
  fechaVencimiento: Date;
  montoEsperado: Prisma.Decimal;
};

export type PlanCuotasCalculado = {
  interes: Prisma.Decimal;
  totalAPagar: Prisma.Decimal;
  montoCuotaBase: Prisma.Decimal;
  condicionesOriginales: CondicionesOriginalesCredito;
  cuotas: CuotaCalculada[];
};

export type ParametrosPlanCuotas = {
  montoPrincipal: Prisma.Decimal;
  tasaInteres: Prisma.Decimal;
  valorMora: Prisma.Decimal | null;
  periodicidad: PeriodicidadCredito;
  numeroCuotas: number;
  fechaDesembolso: Date;
};

export function redondearDinero(valor: Prisma.Decimal): Prisma.Decimal {
  return valor.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function formatearDinero(valor: Prisma.Decimal): string {
  return redondearDinero(valor).toFixed(2);
}

export function formatearTasa(valor: Prisma.Decimal): string {
  return valor.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toFixed(4);
}

export function formatearFechaIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function parsearFechaIso(valor: string): Date {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) {
    throw new Error('FECHA_INVALIDA');
  }

  const anio = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    throw new Error('FECHA_INVALIDA');
  }

  return fecha;
}

export function sumarPeriodos(
  fechaDesembolso: Date,
  periodicidad: PeriodicidadCredito,
  numeroCuota: number,
): Date {
  const anio = fechaDesembolso.getUTCFullYear();
  const mes = fechaDesembolso.getUTCMonth();
  const dia = fechaDesembolso.getUTCDate();

  switch (periodicidad) {
    case 'diaria':
      return new Date(Date.UTC(anio, mes, dia + numeroCuota));
    case 'semanal':
      return new Date(Date.UTC(anio, mes, dia + 7 * numeroCuota));
    case 'quincenal':
      return new Date(Date.UTC(anio, mes, dia + 15 * numeroCuota));
    case 'mensual':
      return new Date(Date.UTC(anio, mes + numeroCuota, dia));
    default: {
      const _nunca: never = periodicidad;
      return _nunca;
    }
  }
}

export function generarPlanCuotas(parametros: ParametrosPlanCuotas): PlanCuotasCalculado {
  const interes = redondearDinero(
    parametros.montoPrincipal.mul(parametros.tasaInteres).div(100),
  );
  const totalAPagar = redondearDinero(parametros.montoPrincipal.add(interes));
  const montoCuotaBase = redondearDinero(totalAPagar.div(parametros.numeroCuotas));

  const cuotas: CuotaCalculada[] = [];
  let acumulado = new Prisma.Decimal(0);

  for (let numeroCuota = 1; numeroCuota <= parametros.numeroCuotas; numeroCuota += 1) {
    const esUltima = numeroCuota === parametros.numeroCuotas;
    const montoEsperado = esUltima
      ? redondearDinero(totalAPagar.minus(acumulado))
      : montoCuotaBase;
    acumulado = acumulado.add(montoEsperado);

    cuotas.push({
      numeroCuota,
      fechaVencimiento: sumarPeriodos(
        parametros.fechaDesembolso,
        parametros.periodicidad,
        numeroCuota,
      ),
      montoEsperado,
    });
  }

  const condicionesOriginales: CondicionesOriginalesCredito = {
    monto_principal: formatearDinero(parametros.montoPrincipal),
    tasa_interes: formatearTasa(parametros.tasaInteres),
    cobra_mora: parametros.valorMora !== null,
    valor_mora: parametros.valorMora === null ? null : formatearDinero(parametros.valorMora),
    periodicidad: parametros.periodicidad,
    numero_cuotas: parametros.numeroCuotas,
    fecha_desembolso: formatearFechaIso(parametros.fechaDesembolso),
    formula_interes: FORMULA_INTERES,
    redondeo: REDONDEO,
    total_a_pagar: formatearDinero(totalAPagar),
    monto_cuota_base: formatearDinero(montoCuotaBase),
  };

  return {
    interes,
    totalAPagar,
    montoCuotaBase,
    condicionesOriginales,
    cuotas,
  };
}
