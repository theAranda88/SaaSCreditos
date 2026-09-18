import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { DashboardNegocio, PerfilUsuario } from '@creditos/shared-types';
import { CarteraRepositorio } from '../entidades/cartera.repositorio';
import { PagoRepositorio } from '../entidades/pago.repositorio';
import { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { formatearDinero, formatearFechaIso } from './generar-plan-cuotas';

@Injectable()
export class DashboardServicio {
  constructor(
    @Inject(CarteraRepositorio) private readonly carteraRepositorio: CarteraRepositorio,
    @Inject(PagoRepositorio) private readonly pagoRepositorio: PagoRepositorio,
    @Inject(UsuarioRepositorio) private readonly usuarioRepositorio: UsuarioRepositorio,
  ) {}

  async obtener(usuario: PerfilUsuario): Promise<DashboardNegocio> {
    const negocioId = this.exigirNegocioAsignado(usuario);

    if (usuario.rol === 'cobrador') {
      throw new ForbiddenException('El cobrador no puede consultar el dashboard administrativo');
    }

    const hoy = this.inicioDiaUtc(new Date());
    const manana = new Date(hoy.getTime());
    manana.setUTCDate(manana.getUTCDate() + 1);

    const [recaudoDia, carteraActiva, carteraMora, cobradoresActivos, creditosActivos, creditosEnMora] =
      await Promise.all([
        this.pagoRepositorio.sumarPagosValidosDelNegocioDia(negocioId, hoy, manana),
        this.carteraRepositorio.sumarSaldoCarteraActiva(negocioId),
        this.carteraRepositorio.sumarSaldoCarteraMora(negocioId),
        this.usuarioRepositorio.contarCobradoresActivos(negocioId),
        this.carteraRepositorio.contarCreditosPorEstado(negocioId, 'activo'),
        this.carteraRepositorio.contarCreditosEnMora(negocioId),
      ]);

    return {
      fecha: formatearFechaIso(hoy),
      recaudo_dia: formatearDinero(recaudoDia),
      cartera_activa: formatearDinero(carteraActiva),
      cartera_mora: formatearDinero(carteraMora),
      cobradores_activos: cobradoresActivos,
      creditos_activos: creditosActivos,
      creditos_en_mora: creditosEnMora,
    };
  }

  private exigirNegocioAsignado(usuario: PerfilUsuario): string {
    if (!usuario.negocio_id) {
      throw new ForbiddenException('Los usuarios de plataforma no tienen negocio asignado');
    }

    return usuario.negocio_id;
  }

  private inicioDiaUtc(fecha: Date): Date {
    return new Date(
      Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()),
    );
  }
}
