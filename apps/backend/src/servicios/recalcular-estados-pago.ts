import { Prisma } from '@prisma/client';
import type { Credito, Cuota } from '@prisma/client';

export function recalcularEstadoCuota(
  saldoPendiente: Prisma.Decimal,
  montoEsperado: Prisma.Decimal,
): Cuota['estado'] {
  if (saldoPendiente.lte(0)) {
    return 'pagada';
  }

  if (saldoPendiente.lt(montoEsperado)) {
    return 'parcial';
  }

  return 'pendiente';
}

export function recalcularEstadoCredito(cuotas: Pick<Cuota, 'estado'>[]): Credito['estado'] {
  if (cuotas.every((cuota) => cuota.estado === 'pagada')) {
    return 'pagado';
  }

  if (cuotas.some((cuota) => cuota.estado === 'mora')) {
    return 'mora';
  }

  return 'activo';
}
