import { HttpErrorResponse } from '@angular/common/http';

export function mensajeErrorHttp(error: unknown, respaldo: string): string {
  if (error instanceof HttpErrorResponse) {
    const cuerpo = error.error as { message?: string | string[] } | null;

    if (typeof cuerpo?.message === 'string' && cuerpo.message.length > 0) {
      return cuerpo.message;
    }

    if (Array.isArray(cuerpo?.message) && cuerpo.message.length > 0) {
      return cuerpo.message.join(', ');
    }
  }

  return respaldo;
}
