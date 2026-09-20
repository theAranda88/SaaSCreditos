import type { Plan } from '@prisma/client';
import type { CodigoPlan, PlanPerfil, SuscripcionPerfil } from '@creditos/shared-types';
import type { SuscripcionConPlan } from '../../entidades/suscripcion.repositorio';
import { formatearFechaIso } from './fechas-plan';

export function mapearPlan(plan: Plan): PlanPerfil {
  const caracteristicas =
    typeof plan.caracteristicas === 'object' && plan.caracteristicas !== null
      ? (plan.caracteristicas as Record<string, unknown>)
      : {};

  return {
    id: plan.id,
    codigo: plan.codigo as CodigoPlan,
    nombre: plan.nombre,
    limite_cobradores: plan.limiteCobradores,
    precio_implementacion: plan.precioImplementacion.toFixed(2),
    precio_mensual: plan.precioMensual.toFixed(2),
    caracteristicas,
    estado: plan.estado,
  };
}

export function mapearSuscripcion(
  suscripcion: SuscripcionConPlan,
  cobradoresActivos: number,
): SuscripcionPerfil {
  const plan = mapearPlan(suscripcion.plan);

  return {
    id: suscripcion.id,
    negocio_id: suscripcion.negocioId,
    estado: suscripcion.estado,
    fecha_inicio: formatearFechaIso(suscripcion.fechaInicio),
    fecha_renovacion: formatearFechaIso(suscripcion.fechaRenovacion),
    fecha_cancelacion: suscripcion.fechaCancelacion
      ? formatearFechaIso(suscripcion.fechaCancelacion)
      : null,
    referencia_pago_externo: suscripcion.referenciaPagoExterno,
    plan,
    cobradores_activos: cobradoresActivos,
    limite_cobradores: plan.limite_cobradores,
  };
}
