/** Tipo de documento de identidad del cliente (catálogo abierto MVP). */
export type TipoDocumento = 'CC' | 'CE' | 'NIT' | 'PASAPORTE' | 'OTRO';

/** Disponibilidad del cliente para nuevos créditos. */
export type EstadoCliente = 'activo' | 'inactivo';

/** Representación pública de un cliente del negocio. */
export interface ClientePerfil {
  id: string;
  negocio_id: string;
  nombre_completo: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  telefono: string;
  direccion: string | null;
  referencia_ubicacion: string | null;
  estado: EstadoCliente;
  fecha_creacion: string;
  fecha_actualizacion: string;
  creado_por: string;
}
