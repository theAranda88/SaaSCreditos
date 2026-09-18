import type { EstadoCredito } from './creditos';

/** Segmento operativo de cartera (RF-010). */
export type SegmentoCartera = 'vigente' | 'mora' | 'pagada';

/** Fila agregada de cartera por crédito. */
export interface ItemCartera {
  credito_id: string;
  cliente_id: string;
  cliente_nombre_completo: string;
  cobrador_id: string | null;
  cobrador_nombre: string | null;
  estado_credito: EstadoCredito;
  monto_principal: string;
  saldo_pendiente: string;
  cuotas_pendientes: number;
  cuotas_en_mora: number;
}

/** Resultado de aplicar mora sobre cuotas vencidas. */
export interface ResultadoAplicarMora {
  cuotas_actualizadas: number;
  creditos_actualizados: number;
  fecha_referencia: string;
}
