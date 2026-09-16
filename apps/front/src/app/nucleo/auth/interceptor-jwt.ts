import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthServicio } from './auth.servicio';

export const interceptorJwt: HttpInterceptorFn = (solicitud, siguiente) => {
  const authServicio = inject(AuthServicio);
  const token = authServicio.obtenerToken();

  if (!token || solicitud.url.includes('/auth/login') || solicitud.url.includes('/auth/registro')) {
    return siguiente(solicitud);
  }

  return siguiente(
    solicitud.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
