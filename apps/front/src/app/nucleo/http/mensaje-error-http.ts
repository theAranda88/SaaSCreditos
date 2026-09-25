import { HttpErrorResponse } from '@angular/common/http';

/**
 * Devuelve una clave i18n para mostrar con `| translate`.
 * No expone mensajes crudos del API en la UI.
 */
export function claveMensajeErrorHttp(error: unknown, claveRespaldo: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'errores.http.sin_conexion';
    }
    if (error.status === 401) {
      return 'errores.http.no_autorizado';
    }
    if (error.status === 403) {
      return 'errores.http.prohibido';
    }
    if (error.status === 404) {
      return 'errores.http.no_encontrado';
    }
  }

  return claveRespaldo;
}

/** @deprecated Usar claveMensajeErrorHttp y `| translate` en template. */
export function mensajeErrorHttp(error: unknown, claveRespaldo: string): string {
  return claveMensajeErrorHttp(error, claveRespaldo);
}
