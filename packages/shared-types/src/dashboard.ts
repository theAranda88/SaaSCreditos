/** Indicadores operativos del negocio (RF-011). */
export interface DashboardNegocio {
  fecha: string;
  recaudo_dia: string;
  cartera_activa: string;
  cartera_mora: string;
  cobradores_activos: number;
  creditos_activos: number;
  creditos_en_mora: number;
}
