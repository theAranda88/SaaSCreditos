export function fechaHoyUtc(): Date {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
}

export function sumarMesesUtc(fecha: Date, meses: number): Date {
  return new Date(
    Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + meses, fecha.getUTCDate()),
  );
}

export function formatearFechaIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}
