import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthServicio } from './auth.servicio';

export const guardAutenticacion: CanActivateFn = () => {
  const authServicio = inject(AuthServicio);
  const router = inject(Router);

  if (authServicio.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
