import type { EstadoCredito } from './creditos';

/** Estado de la relación cartera–cobrador. */
export type EstadoAsignacion = 'activa' | 'finalizada';

/** Crédito resumido en el listado de cartera. */
export interface CreditoEnCartera {
  id: string;
  cliente_id: string;
  cliente_nombre_completo: string;
  estado: EstadoCredito;
  monto_principal: string;
}

/** Representación pública de una asignación de cartera. */
export interface AsignacionPerfil {
  id: string;
  negocio_id: string;
  credito_id: string;
  cobrador_id: string;
  fecha_asignacion: string;
  fecha_fin: string | null;
  estado: EstadoAsignacion;
  asignado_por: string;
  credito: CreditoEnCartera;
}
