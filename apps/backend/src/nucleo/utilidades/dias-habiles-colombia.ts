import { parsearFechaIso, formatearFechaIso } from '../../servicios/generar-plan-cuotas';

/** Domingo (UTC) o festivo nacional colombiano: no hay cobro en campo. */
export function esDiaHabilCobro(fecha: Date): boolean {
  if (fecha.getUTCDay() === 0) {
    return false;
  }

  return !esFestivoColombia(fecha);
}

/**
 * Si el vencimiento cae en domingo o festivo, se traslada al siguiente día hábil.
 * Así la obligación aparece en el primer día en que el cobrador puede recaudar.
 */
export function fechaCobroEfectiva(fechaVencimiento: Date): Date {
  let fecha = new Date(fechaVencimiento.getTime());

  while (!esDiaHabilCobro(fecha)) {
    fecha = sumarDiasUtc(fecha, 1);
  }

  return fecha;
}

/** Ajusta la fecha de vencimiento al siguiente día hábil (alias semántico para el plan de cuotas). */
export function ajustarVencimientoADiaHabil(fechaVencimiento: Date): Date {
  return fechaCobroEfectiva(fechaVencimiento);
}

function sumarDiasUtc(fecha: Date, dias: number): Date {
  const anio = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth();
  const dia = fecha.getUTCDate();
  return new Date(Date.UTC(anio, mes, dia + dias));
}

function esFestivoColombia(fecha: Date): boolean {
  const anio = fecha.getUTCFullYear();
  const festivos = construirFestivosColombia(anio);
  return festivos.has(formatearFechaIso(fecha));
}

function construirFestivosColombia(anio: number): Set<string> {
  const festivos = new Set<string>();

  const agregar = (mes: number, dia: number, trasladarEmiliani = false) => {
    const base = new Date(Date.UTC(anio, mes - 1, dia));
    const celebracion = trasladarEmiliani ? trasladarFestivoEmiliani(base) : base;
    festivos.add(formatearFechaIso(celebracion));
  };

  agregar(1, 1);
  agregar(1, 6, true);
  agregar(3, 19, true);
  agregar(5, 1);
  agregar(6, 29, true);
  agregar(7, 20, true);
  agregar(8, 7, true);
  agregar(8, 15, true);
  agregar(10, 12, true);
  agregar(11, 1, true);
  agregar(11, 11, true);
  agregar(12, 25);

  const pascua = calcularDomingoPascua(anio);
  festivos.add(formatearFechaIso(sumarDiasUtc(pascua, -3)));
  festivos.add(formatearFechaIso(sumarDiasUtc(pascua, -2)));
  festivos.add(formatearFechaIso(trasladarFestivoEmiliani(sumarDiasUtc(pascua, 43))));
  festivos.add(formatearFechaIso(trasladarFestivoEmiliani(sumarDiasUtc(pascua, 64))));
  festivos.add(formatearFechaIso(trasladarFestivoEmiliani(sumarDiasUtc(pascua, 71))));

  return festivos;
}

/** Ley Emiliani: si no cae en lunes, se celebra el lunes de esa semana (o el siguiente si es domingo). */
function trasladarFestivoEmiliani(fecha: Date): Date {
  const diaSemana = fecha.getUTCDay();

  if (diaSemana === 1) {
    return fecha;
  }

  if (diaSemana === 0) {
    return sumarDiasUtc(fecha, 1);
  }

  return sumarDiasUtc(fecha, 1 - diaSemana);
}

/** Algoritmo de Meeus/Jones/Butcher para el domingo de Pascua (calendario gregoriano). */
function calcularDomingoPascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(anio, mes - 1, dia));
}

export function parsearFechaConsulta(valor: string | undefined, fechaDefecto: Date): Date {
  if (!valor) {
    return fechaDefecto;
  }

  return parsearFechaIso(valor);
}
