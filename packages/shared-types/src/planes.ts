import type { RolUsuario } from './auth';
import type { EstadoUsuario } from './cobradores';

/** Códigos de plan comercial del catálogo global. */
export type CodigoPlan = 'emprendedor' | 'profesional' | 'empresarial';

/** Códigos de moneda ISO soportadas (extensible). */
export type CodigoMoneda = 'COP' | 'USD' | 'EUR';

/** Estado comercial de un plan del catálogo global. */
export type EstadoPlan = 'activo' | 'inactivo';

/** Estado del servicio SaaS por negocio. */
export type EstadoSuscripcion = 'activa' | 'pago_fallido' | 'cancelada' | 'suspendida';

/** Estado del negocio en la plataforma. */
export type EstadoNegocio = 'activo' | 'suspendido' | 'cancelado';

/** Eventos del webhook stub de suscripción (sin pasarela real). */
export type EventoWebhookSuscripcion = 'pago_aprobado' | 'pago_fallido' | 'cancelacion';

/** Plan comercial expuesto por la API. */
export interface PlanPerfil {
  id: string;
  codigo: CodigoPlan;
  nombre: string;
  limite_cobradores: number;
  precio_implementacion: string;
  precio_mensual: string;
  caracteristicas: Record<string, unknown>;
  estado: EstadoPlan;
}

/** Suscripción del negocio autenticado (RF-015). */
export interface SuscripcionPerfil {
  id: string;
  negocio_id: string;
  estado: EstadoSuscripcion;
  fecha_inicio: string;
  fecha_renovacion: string;
  fecha_cancelacion: string | null;
  referencia_pago_externo: string | null;
  plan: PlanPerfil;
  cobradores_activos: number;
  limite_cobradores: number;
}

/** Negocio visto desde el panel de plataforma. */
export interface NegocioPlataforma {
  id: string;
  nombre_comercial: string;
  moneda: string;
  estado: EstadoNegocio;
  fecha_creacion: string;
  suscripcion: {
    id: string;
    estado: EstadoSuscripcion;
    plan_codigo: CodigoPlan;
    plan_nombre: string;
    limite_cobradores: number;
    fecha_renovacion: string;
  } | null;
}

/** Usuario de un negocio, sin hash, para administración SaaS (RA-003). */
export interface UsuarioPlataforma {
  id: string;
  negocio_id: string | null;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
}

/** Fila de auditoría consultable por roles de plataforma (RA-007). */
export interface AuditoriaPlataforma {
  id: string;
  negocio_id: string | null;
  usuario_id: string;
  entidad: string;
  entidad_id: string;
  accion: string;
  detalle: Record<string, unknown>;
  fecha: string;
}
