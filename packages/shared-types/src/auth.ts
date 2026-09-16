/** Roles de usuario del dominio. */
export type RolUsuario =
  | 'propietario'
  | 'administrador'
  | 'cobrador'
  | 'soporte'
  | 'admin_plataforma';

/** Claims del JWT emitido por la API. */
export interface PayloadJwt {
  sub: string;
  negocio_id: string | null;
  rol: RolUsuario;
}

/** Perfil público del usuario autenticado. */
export interface PerfilUsuario {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  negocio_id: string | null;
}

/** Respuesta de login exitoso. */
export interface RespuestaLogin {
  token: string;
  usuario: PerfilUsuario;
}

/** Datos mínimos del negocio expuestos al panel operativo. */
export interface NegocioPerfil {
  id: string;
  nombre_comercial: string;
  moneda: string;
  configuracion: Record<string, unknown>;
}
