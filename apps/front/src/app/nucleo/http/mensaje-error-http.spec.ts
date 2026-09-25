import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { claveMensajeErrorHttp } from './mensaje-error-http';

describe('claveMensajeErrorHttp', () => {
  it('debe devolver clave de sin conexión cuando status es 0', () => {
    const error = new HttpErrorResponse({ status: 0 });
    expect(claveMensajeErrorHttp(error, 'errores.clientes.cargar')).toBe(
      'errores.http.sin_conexion',
    );
  });

  it('debe devolver clave de prohibido cuando status es 403', () => {
    const error = new HttpErrorResponse({ status: 403 });
    expect(claveMensajeErrorHttp(error, 'errores.clientes.cargar')).toBe('errores.http.prohibido');
  });

  it('debe devolver clave de respaldo para otros errores', () => {
    const error = new HttpErrorResponse({ status: 500 });
    expect(claveMensajeErrorHttp(error, 'errores.clientes.cargar')).toBe('errores.clientes.cargar');
  });
});
