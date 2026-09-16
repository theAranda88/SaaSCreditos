import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RolUsuario } from '@creditos/shared-types';
import { CLAVE_ROLES } from '../constantes/auth.constantes';
import type { UsuarioSolicitud } from '../tipos/usuario-solicitud';

@Injectable()
export class GuardRoles implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolUsuario[]>(CLAVE_ROLES, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const solicitud = contexto.switchToHttp().getRequest<{ user?: UsuarioSolicitud }>();
    const usuario = solicitud.user;

    if (!usuario || !rolesRequeridos.includes(usuario.rol)) {
      throw new ForbiddenException('No tiene permisos para esta operación');
    }

    return true;
  }
}
