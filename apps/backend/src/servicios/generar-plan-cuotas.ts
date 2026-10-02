import { Prisma } from '@prisma/client';
import type {
  CondicionesOriginalesCredito,
  PeriodicidadCredito,
} from '@creditos/shared-types';
import { FORMULA_INTERES, REDONDEO } from '../nucleo/constantes/creditos.constantes';
import { ajustarVencimientoADiaHabil } from '../nucleo/utilidades/dias-habiles-colombia';

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
  plazoMeses: number;
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

/**
 * Calcula el número de cuotas según plazo en meses y periodicidad.
 *
 * **Diaria:** Contar días hábiles (excluyendo domingos) en el rango [desembolso + 1, desembolso + plazo_meses meses].
 * **Semanal:** ceil(plazo_meses × 52 / 12) — una cuota por semana civil.
 * **Quincenal:** plazo_meses × 2 — una cuota cada quincena.
 * **Mensual:** plazo_meses — una cuota por mes.
 */
export function calcularNumeroCuotas(
  plazoMeses: number,
  periodicidad: PeriodicidadCredito,
  fechaDesembolso: Date,
): number {
  switch (periodicidad) {
    case 'diaria': {
      // Contar días hábiles (no domingos) desde el desembolso hasta fin de plazo
      const fechaFin = new Date(
        Date.UTC(
          fechaDesembolso.getUTCFullYear(),
          fechaDesembolso.getUTCMonth() + plazoMeses,
          fechaDesembolso.getUTCDate(),
        ),
      );

      let contador = 0;
      let fechaActual = new Date(
        Date.UTC(
          fechaDesembolso.getUTCFullYear(),
          fechaDesembolso.getUTCMonth(),
          fechaDesembolso.getUTCDate() + 1,
        ),
      );

      while (fechaActual <= fechaFin) {
        // Excluir domingos (día 0 en UTC es domingo)
        if (fechaActual.getUTCDay() !== 0) {
          contador += 1;
        }
        fechaActual = new Date(
          Date.UTC(
            fechaActual.getUTCFullYear(),
            fechaActual.getUTCMonth(),
            fechaActual.getUTCDate() + 1,
          ),
        );
      }

      return Math.max(1, contador);
    }

    case 'semanal': {
      // Una cuota por semana: ceil(plazo_meses × 52 / 12)
      return Math.ceil((plazoMeses * 52) / 12);
    }

    case 'quincenal': {
      // Una cuota cada quincena: plazo_meses × 2
      return plazoMeses * 2;
    }

    case 'mensual': {
      // Una cuota por mes
      return plazoMeses;
    }

    default: {
      const _nunca: never = periodicidad;
      return _nunca;
    }
  }
}

export function generarPlanCuotas(parametros: ParametrosPlanCuotas): PlanCuotasCalculado {
  const numeroCuotas = calcularNumeroCuotas(
    parametros.plazoMeses,
    parametros.periodicidad,
    parametros.fechaDesembolso,
  );

  if (numeroCuotas < 1) {
    throw new Error('No se puede generar un plan con menos de 1 cuota');
  }

  const interes = redondearDinero(
    parametros.montoPrincipal.mul(parametros.tasaInteres).div(100),
  );
  const totalAPagar = redondearDinero(parametros.montoPrincipal.add(interes));
  const montoCuotaBase = redondearDinero(totalAPagar.div(numeroCuotas));

  const cuotas: CuotaCalculada[] = [];
  let acumulado = new Prisma.Decimal(0);

  for (let numeroCuota = 1; numeroCuota <= numeroCuotas; numeroCuota += 1) {
    const esUltima = numeroCuota === numeroCuotas;
    const montoEsperado = esUltima
      ? redondearDinero(totalAPagar.minus(acumulado))
      : montoCuotaBase;
    acumulado = acumulado.add(montoEsperado);

    const fechaVencimientoBruta = sumarPeriodos(
      parametros.fechaDesembolso,
      parametros.periodicidad,
      numeroCuota,
    );

    cuotas.push({
      numeroCuota,
      fechaVencimiento: ajustarVencimientoADiaHabil(fechaVencimientoBruta),
      montoEsperado,
    });
  }

  const condicionesOriginales: CondicionesOriginalesCredito = {
    monto_principal: formatearDinero(parametros.montoPrincipal),
    tasa_interes: formatearTasa(parametros.tasaInteres),
    cobra_mora: parametros.valorMora !== null,
    valor_mora: parametros.valorMora === null ? null : formatearDinero(parametros.valorMora),
    periodicidad: parametros.periodicidad,
    plazo_meses: parametros.plazoMeses,
    numero_cuotas: numeroCuotas,
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
