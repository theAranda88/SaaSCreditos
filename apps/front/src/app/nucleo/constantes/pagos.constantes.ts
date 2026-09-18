import type { MetodoPago } from '@creditos/shared-types';

export const METODOS_PAGO: readonly MetodoPago[] = [
  'efectivo',
  'transferencia',
  'nequi',
  'daviplata',
  'otro',
];

export const ETIQUETAS_METODO_PAGO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  otro: 'Otro',
};
