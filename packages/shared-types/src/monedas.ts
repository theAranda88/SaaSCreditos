/** Catálogo de monedas ISO soportadas. */
export const CODIGOS_MONEDA = ['COP'] as const;

export type CodigoMoneda = (typeof CODIGOS_MONEDA)[number];
