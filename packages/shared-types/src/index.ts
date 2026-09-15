/** Respuesta estándar del endpoint de salud de la API. */
export interface RespuestaSaludApi {
  estado: 'ok';
  servicio: 'api';
  version: string;
}

/** Códigos de plan comercial del catálogo global. */
export type CodigoPlan = 'emprendedor' | 'profesional' | 'empresarial';
