import type { RolUsuario } from '@creditos/shared-types';

export const ROLES_ADMINISTRACION_NEGOCIO: RolUsuario[] = ['propietario', 'administrador'];

export const ROLES_PLATAFORMA: RolUsuario[] = ['admin_plataforma', 'soporte'];

export function esRolPlataforma(rol: RolUsuario | undefined): boolean {
  return rol !== undefined && ROLES_PLATAFORMA.includes(rol);
}

export function rutaInicioPorRol(rol: RolUsuario): string {
  return esRolPlataforma(rol) ? '/plataforma' : '/app';
}
