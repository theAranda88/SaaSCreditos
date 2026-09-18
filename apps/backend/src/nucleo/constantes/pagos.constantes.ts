import type { MetodoPago } from '@creditos/shared-types';

export const METODOS_PAGO: readonly MetodoPago[] = [
  'efectivo',
  'transferencia',
  'nequi',
  'daviplata',
  'otro',
];

export const ESTADOS_CUOTA_COBRABLES = ['pendiente', 'parcial', 'mora'] as const;

export const MENSAJE_DIA_NO_HABIL =
  'No hay cobro en domingos ni festivos nacionales de Colombia. Consulte el siguiente día hábil.';
