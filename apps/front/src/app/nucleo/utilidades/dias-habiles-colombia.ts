export type MotivoDiaInhabil = 'domingo' | 'festivo';

export type InfoDiaCalendario = {
  fecha: string;
  esHabil: boolean;
  motivo: MotivoDiaInhabil | null;
  etiqueta: string | null;
};

/** Domingo (UTC) o festivo nacional colombiano: no hay cobro en campo. */
export function esDiaHabilCobro(fechaIso: string): boolean {
  const fecha = parsearFechaIso(fechaIso);

  if (fecha.getUTCDay() === 0) {
    return false;
  }

  return !esFestivoColombia(fecha);
}

export function fechaCobroEfectiva(fechaVencimientoIso: string): string {
  let fecha = parsearFechaIso(fechaVencimientoIso);

  while (!esDiaHabilCobro(formatearFechaIso(fecha))) {
    fecha = sumarDiasUtc(fecha, 1);
  }

  return formatearFechaIso(fecha);
}

export function vencimientoTrasladado(
  fechaVencimientoIso: string,
  fechaCobroEfectivaIso: string,
): boolean {
  return fechaVencimientoIso !== fechaCobroEfectivaIso;
}

export function infoDiaCalendario(fechaIso: string): InfoDiaCalendario {
  if (esDiaHabilCobro(fechaIso)) {
    return {
      fecha: fechaIso,
      esHabil: true,
      motivo: null,
      etiqueta: null,
    };
  }

  const fecha = parsearFechaIso(fechaIso);
  const motivo: MotivoDiaInhabil = fecha.getUTCDay() === 0 ? 'domingo' : 'festivo';

  return {
    fecha: fechaIso,
    esHabil: false,
    motivo,
    etiqueta: motivo === 'domingo' ? 'Domingo' : 'Festivo',
  };
}

function parsearFechaIso(valor: string): Date {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function formatearFechaIso(fecha: Date): string {
  const anio = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getUTCDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
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
