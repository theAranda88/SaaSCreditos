import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthServicio } from './auth.servicio';
import { esRolPlataforma } from './roles-negocio';

export const guardExigirNegocio: CanActivateFn = () => {
  const authServicio = inject(AuthServicio);
  const router = inject(Router);
  const perfil = authServicio.perfilActual();

  if (perfil && esRolPlataforma(perfil.rol)) {
    return router.createUrlTree(['/plataforma']);
  }

  return true;
};

export const guardExigirPlataforma: CanActivateFn = () => {
  const authServicio = inject(AuthServicio);
  const router = inject(Router);
  const perfil = authServicio.perfilActual();

  if (!perfil || !esRolPlataforma(perfil.rol)) {
    return router.createUrlTree(['/app']);
  }

  return true;
};
