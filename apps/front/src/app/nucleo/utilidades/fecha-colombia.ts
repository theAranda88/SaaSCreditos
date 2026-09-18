/** Fecha calendario en zona horaria de Colombia (YYYY-MM-DD). */
export function fechaHoyIsoColombia(fecha = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(fecha);
}
