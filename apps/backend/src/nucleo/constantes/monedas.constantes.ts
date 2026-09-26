/** Catálogo de monedas ISO soportadas. Extensible. */
export const CODIGOS_MONEDA = ['COP', 'USD', 'EUR'] as const;

export type CodigoMoneda = (typeof CODIGOS_MONEDA)[number];
