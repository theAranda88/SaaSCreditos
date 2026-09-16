import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { RolUsuario } from '@creditos/shared-types';
import { AuthServicio } from './auth.servicio';

export const crearGuardRol = (rolesPermitidos: RolUsuario[]): CanActivateFn => {
  return () => {
    const authServicio = inject(AuthServicio);
    const router = inject(Router);
    const perfil = authServicio.perfilActual();

    if (perfil && rolesPermitidos.includes(perfil.rol)) {
      return true;
    }

    return router.createUrlTree(['/app']);
  };
};
