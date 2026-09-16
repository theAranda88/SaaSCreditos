/** Estado de acceso de un usuario de negocio. */
export type EstadoUsuario = 'activo' | 'inactivo';

/** Representación pública de un cobrador (nunca incluye hash de contraseña). */
export interface CobradorPerfil {
  id: string;
  negocio_id: string;
  nombre: string;
  correo: string;
  rol: 'cobrador';
  estado: EstadoUsuario;
  telefono: string | null;
  fecha_creacion: string;
  ultimo_acceso: string | null;
}
