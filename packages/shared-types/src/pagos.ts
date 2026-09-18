import type { EstadoCuota } from './creditos';

/** Medio de recaudo del pago. */
export type MetodoPago = 'efectivo' | 'transferencia' | 'nequi' | 'daviplata' | 'otro';

/** Estado del registro de pago. */
export type EstadoPago = 'valido' | 'anulado';

/** Representación pública de un pago. */
export interface PagoPerfil {
  id: string;
  negocio_id: string;
  cuota_id: string;
  credito_id: string;
  cobrador_id: string;
  monto: string;
  fecha_pago: string;
  metodo_pago: MetodoPago;
  estado: EstadoPago;
  motivo_anulacion: string | null;
  anulado_por: string | null;
  fecha_anulacion: string | null;
  fecha_creacion: string;
}

/** Cuota pendiente de cobro en la jornada del cobrador. */
export interface CobroDelDia {
  cuota_id: string;
  credito_id: string;
  numero_cuota: number;
  fecha_vencimiento: string;
  fecha_cobro_efectiva: string;
  monto_esperado: string;
  saldo_pendiente: string;
  estado: EstadoCuota;
  cliente_id: string;
  cliente_nombre_completo: string;
  atrasado: boolean;
  /** Próxima cuota del crédito cuando aún no vence hoy (anticipo permitido). */
  programado: boolean;
}

/** Respuesta de cobros del día con indicador de día hábil. */
export interface CobrosDelDiaRespuesta {
  fecha: string;
  dia_habil: boolean;
  mensaje: string | null;
  cobros: CobroDelDia[];
}

/** Resumen diario de recaudo (RC-009). */
export interface ResumenDiarioPago {
  fecha: string;
  dia_habil: boolean;
  cobrador_id: string;
  esperado: string;
  cobrado: string;
  pendiente: string;
}
