/** Periodicidad del plan de cuotas. */
export type PeriodicidadCredito = 'diaria' | 'semanal' | 'quincenal' | 'mensual';

/** Ciclo de vida del crédito. */
export type EstadoCredito = 'activo' | 'pagado' | 'mora' | 'anulado' | 'refinanciado';

/** Estado de una cuota del plan. */
export type EstadoCuota = 'pendiente' | 'pagada' | 'parcial' | 'mora' | 'anulada';

/** Snapshot inmutable persistido en creditos.condiciones_originales (RF-005). */
export interface CondicionesOriginalesCredito {
  monto_principal: string;
  tasa_interes: string;
  cobra_mora: boolean;
  valor_mora: string | null;
  periodicidad: PeriodicidadCredito;
  numero_cuotas: number;
  fecha_desembolso: string;
  formula_interes: 'flat_sobre_principal';
  redondeo: 'half_up_2';
  total_a_pagar: string;
  monto_cuota_base: string;
}

/** Representación pública de un crédito. */
export interface CreditoPerfil {
  id: string;
  negocio_id: string;
  cliente_id: string;
  monto_principal: string;
  tasa_interes: string;
  valor_mora: string | null;
  periodicidad: PeriodicidadCredito;
  numero_cuotas: number;
  fecha_desembolso: string;
  estado: EstadoCredito;
  condiciones_originales: CondicionesOriginalesCredito;
  fecha_creacion: string;
  fecha_actualizacion: string;
  creado_por: string;
}

/** Cuota del plan de pagos. */
export interface CuotaPerfil {
  id: string;
  negocio_id: string;
  credito_id: string;
  numero_cuota: number;
  fecha_vencimiento: string;
  monto_esperado: string;
  saldo_pendiente: string;
  estado: EstadoCuota;
}

/** Respuesta del alta: crédito + plan generado en la misma transacción. */
export interface CreditoCreado {
  credito: CreditoPerfil;
  cuotas: CuotaPerfil[];
}
