import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RolUsuario } from '@creditos/shared-types';
import type { UsuarioSolicitud } from '../tipos/usuario-solicitud';

export const UsuarioActual = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext): UsuarioSolicitud => {
    const solicitud = contexto.switchToHttp().getRequest<{ user?: Record<string, unknown> }>();
    const usuario = solicitud.user ?? {};

    return {
      id: String(usuario.id ?? usuario.sub ?? ''),
      nombre: String(usuario.nombre ?? ''),
      correo: String(usuario.correo ?? ''),
      rol: usuario.rol as RolUsuario,
      negocio_id: (usuario.negocio_id ?? usuario.negocioId ?? null) as string | null,
    };
  },
);
