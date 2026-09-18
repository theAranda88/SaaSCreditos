import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  ItemCartera,
  PerfilUsuario,
  ResultadoAplicarMora,
} from '@creditos/shared-types';
import type { ConsultarCarteraDto } from '../dtos/consultar-cartera.dto';
import { AsignacionRepositorio } from '../entidades/asignacion.repositorio';
import {
  CarteraRepositorio,
  type CreditoCartera,
} from '../entidades/cartera.repositorio';
import { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { formatearDinero, formatearFechaIso } from './generar-plan-cuotas';

@Injectable()
export class CarteraServicio {
  constructor(
    @Inject(CarteraRepositorio) private readonly carteraRepositorio: CarteraRepositorio,
    @Inject(AsignacionRepositorio) private readonly asignacionRepositorio: AsignacionRepositorio,
    @Inject(UsuarioRepositorio) private readonly usuarioRepositorio: UsuarioRepositorio,
  ) {}

  async listar(usuario: PerfilUsuario, consulta: ConsultarCarteraDto): Promise<ItemCartera[]> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const creditoIds = await this.resolverCreditosVisibles(usuario, consulta.cobradorId);

    if (creditoIds && creditoIds.length === 0) {
      return [];
    }

    const creditos = await this.carteraRepositorio.listarCreditos(negocioId, {
      segmento: consulta.segmento,
      creditoIds,
    });

    return creditos.map((credito) => this.mapearItem(credito));
  }

  async aplicarMora(usuario: PerfilUsuario): Promise<ResultadoAplicarMora> {
    const negocioId = this.exigirNegocioAsignado(usuario);

    if (usuario.rol === 'cobrador') {
      throw new ForbiddenException('El cobrador no puede aplicar mora');
    }

    const fechaReferencia = this.inicioDiaUtc(new Date());
    const resultado = await this.carteraRepositorio.aplicarMora(
      negocioId,
      fechaReferencia,
      usuario.id,
    );

    return {
      cuotas_actualizadas: resultado.cuotasActualizadas,
      creditos_actualizados: resultado.creditosActualizados,
      fecha_referencia: formatearFechaIso(fechaReferencia),
    };
  }

  private async resolverCreditosVisibles(
    usuario: PerfilUsuario,
    cobradorIdConsulta?: string,
  ): Promise<string[] | undefined> {
    const negocioId = usuario.negocio_id!;

    if (usuario.rol === 'cobrador') {
      const asignaciones = await this.asignacionRepositorio.listar(negocioId, {
        cobradorId: usuario.id,
        estado: 'activa',
      });

      return asignaciones.map((asignacion) => asignacion.creditoId);
    }

    if (cobradorIdConsulta) {
      const cobrador = await this.usuarioRepositorio.buscarCobradorPorIdYNegocio(
        cobradorIdConsulta,
        negocioId,
      );

      if (!cobrador) {
        throw new NotFoundException('Cobrador no encontrado');
      }

      const asignaciones = await this.asignacionRepositorio.listar(negocioId, {
        cobradorId: cobradorIdConsulta,
        estado: 'activa',
      });

      return asignaciones.map((asignacion) => asignacion.creditoId);
    }

    return undefined;
  }

  private mapearItem(credito: CreditoCartera): ItemCartera {
    const asignacionActiva = credito.asignaciones[0];
    const saldo = credito.cuotas.reduce(
      (acumulado, cuota) => acumulado.add(cuota.saldoPendiente),
      new Prisma.Decimal(0),
    );

    const cuotasPendientes = credito.cuotas.filter(
      (cuota) => cuota.estado === 'pendiente' || cuota.estado === 'parcial' || cuota.estado === 'mora',
    ).length;
    const cuotasEnMora = credito.cuotas.filter((cuota) => cuota.estado === 'mora').length;

    return {
      credito_id: credito.id,
      cliente_id: credito.cliente.id,
      cliente_nombre_completo: credito.cliente.nombreCompleto,
      cobrador_id: asignacionActiva?.cobrador.id ?? null,
      cobrador_nombre: asignacionActiva?.cobrador.nombre ?? null,
      estado_credito: credito.estado,
      monto_principal: formatearDinero(credito.montoPrincipal),
      saldo_pendiente: formatearDinero(saldo),
      cuotas_pendientes: cuotasPendientes,
      cuotas_en_mora: cuotasEnMora,
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
