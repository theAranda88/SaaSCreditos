import type { CodigoPlan } from '@creditos/shared-types';

export const CODIGO_PLAN_INICIAL: CodigoPlan = 'emprendedor';

export const ESTADOS_PLAN = ['activo', 'inactivo'] as const;

export const ESTADOS_SUSCRIPCION = ['activa', 'pago_fallido', 'cancelada', 'suspendida'] as const;

export const ESTADOS_NEGOCIO = ['activo', 'suspendido', 'cancelado'] as const;

export const ESTADOS_SUSCRIPCION_OPERATIVA = ['activa'] as const;

export const EVENTOS_WEBHOOK_SUSCRIPCION = [
  'pago_aprobado',
  'pago_fallido',
  'cancelacion',
] as const;

export const MENSAJE_NEGOCIO_NO_OPERATIVO =
  'El negocio no está operativo. Consulte su suscripción.';

export const MENSAJE_PLAN_INICIAL_AUSENTE = 'No hay un plan inicial disponible';
