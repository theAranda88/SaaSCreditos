import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Credito, Cuota } from '@prisma/client';
import type {
  CondicionesOriginalesCredito,
  CreditoCreado,
  CreditoPerfil,
  CuotaPerfil,
  PerfilUsuario,
} from '@creditos/shared-types';
import type { ConsultarCreditosDto } from '../dtos/consultar-creditos.dto';
import type { CrearCreditoDto } from '../dtos/crear-credito.dto';
import { ClienteRepositorio } from '../entidades/cliente.repositorio';
import { CreditoRepositorio } from '../entidades/credito.repositorio';
import {
  formatearDinero,
  formatearFechaIso,
  formatearTasa,
  generarPlanCuotas,
  parsearFechaIso,
} from './generar-plan-cuotas';

@Injectable()
export class CreditosServicio {
  constructor(
    @Inject(CreditoRepositorio) private readonly creditoRepositorio: CreditoRepositorio,
    @Inject(ClienteRepositorio) private readonly clienteRepositorio: ClienteRepositorio,
  ) {}

  async crear(usuario: PerfilUsuario, dto: CrearCreditoDto): Promise<CreditoCreado> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const cliente = await this.clienteRepositorio.buscarPorIdYNegocio(dto.clienteId, negocioId);

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (cliente.estado !== 'activo') {
      throw new UnprocessableEntityException(
        'El cliente está inactivo y no puede recibir créditos',
      );
    }

    const montoPrincipal = this.parsearMontoPositivo(dto.montoPrincipal, 'El monto principal debe ser mayor a 0');
    const tasaInteres = this.parsearTasa(dto.tasaInteres);
    const valorMora = this.parsearValorMora(dto.valorMora);
    const numeroCuotas = this.parsearNumeroCuotas(dto.numeroCuotas);
    const fechaDesembolso = this.parsearFechaDesembolso(dto.fechaDesembolso);

    const plan = generarPlanCuotas({
      montoPrincipal,
      tasaInteres,
      valorMora,
      periodicidad: dto.periodicidad,
      numeroCuotas,
      fechaDesembolso,
    });

    const persistido = await this.creditoRepositorio.crearConPlan({
      negocioId,
      clienteId: cliente.id,
      montoPrincipal,
      tasaInteres,
      valorMora,
      periodicidad: dto.periodicidad,
      numeroCuotas,
      fechaDesembolso,
      condicionesOriginales: plan.condicionesOriginales as unknown as Prisma.InputJsonValue,
      creadoPor: usuario.id,
      cuotas: plan.cuotas,
    });

    return {
      credito: this.mapearCredito(persistido.credito),
      cuotas: persistido.cuotas.map((cuota) => this.mapearCuota(cuota)),
    };
  }

  async listar(usuario: PerfilUsuario, consulta: ConsultarCreditosDto): Promise<CreditoPerfil[]> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const creditos = await this.creditoRepositorio.listar(negocioId, {
      clienteId: consulta.clienteId,
      estado: consulta.estado,
    });

    return creditos.map((credito) => this.mapearCredito(credito));
  }

  async obtenerPorId(usuario: PerfilUsuario, id: string): Promise<CreditoPerfil> {
    const credito = await this.obtenerDelNegocio(usuario, id);
    return this.mapearCredito(credito);
  }

  async listarCuotas(usuario: PerfilUsuario, creditoId: string): Promise<CuotaPerfil[]> {
    await this.obtenerDelNegocio(usuario, creditoId);
    const negocioId = this.exigirNegocioAsignado(usuario);
    const cuotas = await this.creditoRepositorio.listarCuotas(creditoId, negocioId);
    return cuotas.map((cuota) => this.mapearCuota(cuota));
  }

  private async obtenerDelNegocio(usuario: PerfilUsuario, id: string): Promise<Credito> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const credito = await this.creditoRepositorio.buscarPorIdYNegocio(id, negocioId);

    if (!credito) {
      throw new NotFoundException('Crédito no encontrado');
    }

    return credito;
  }

  private exigirNegocioAsignado(usuario: PerfilUsuario): string {
    if (!usuario.negocio_id) {
      throw new ForbiddenException('Los usuarios de plataforma no tienen negocio asignado');
    }

    return usuario.negocio_id;
  }

  private parsearMontoPositivo(valor: number, mensaje: string): Prisma.Decimal {
    const decimal = new Prisma.Decimal(valor);
    if (!decimal.isFinite() || decimal.lte(0)) {
      throw new UnprocessableEntityException(mensaje);
    }

    return redondearSiEsDinero(decimal);
  }

  private parsearTasa(valor: number): Prisma.Decimal {
    const decimal = new Prisma.Decimal(valor);
    if (!decimal.isFinite() || decimal.lt(0)) {
      throw new UnprocessableEntityException('La tasa de interés no puede ser negativa');
    }

    return decimal.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
  }

  private parsearValorMora(valor: number | null | undefined): Prisma.Decimal | null {
    if (valor === undefined || valor === null) {
      return null;
    }

    const decimal = new Prisma.Decimal(valor);
    if (!decimal.isFinite() || decimal.lte(0)) {
      throw new UnprocessableEntityException('El valor de mora debe ser mayor a 0 o nulo');
    }

    return redondearSiEsDinero(decimal);
  }

  private parsearNumeroCuotas(valor: number): number {
    if (!Number.isInteger(valor) || valor < 1) {
      throw new UnprocessableEntityException('El número de cuotas debe ser al menos 1');
    }

    return valor;
  }

  private parsearFechaDesembolso(valor: string): Date {
    try {
      return parsearFechaIso(valor);
    } catch {
      throw new UnprocessableEntityException('La fecha de desembolso no es válida');
    }
  }

  private mapearCredito(credito: Credito): CreditoPerfil {
    return {
      id: credito.id,
      negocio_id: credito.negocioId,
      cliente_id: credito.clienteId,
      monto_principal: formatearDinero(credito.montoPrincipal),
      tasa_interes: formatearTasa(credito.tasaInteres),
      valor_mora: credito.valorMora === null ? null : formatearDinero(credito.valorMora),
      periodicidad: credito.periodicidad,
      numero_cuotas: credito.numeroCuotas,
      fecha_desembolso: formatearFechaIso(credito.fechaDesembolso),
      estado: credito.estado,
      condiciones_originales: credito.condicionesOriginales as unknown as CondicionesOriginalesCredito,
      fecha_creacion: credito.fechaCreacion.toISOString(),
      fecha_actualizacion: credito.fechaActualizacion.toISOString(),
      creado_por: credito.creadoPor,
    };
  }

  private mapearCuota(cuota: Cuota): CuotaPerfil {
    return {
      id: cuota.id,
      negocio_id: cuota.negocioId,
      credito_id: cuota.creditoId,
      numero_cuota: cuota.numeroCuota,
      fecha_vencimiento: formatearFechaIso(cuota.fechaVencimiento),
      monto_esperado: formatearDinero(cuota.montoEsperado),
      saldo_pendiente: formatearDinero(cuota.saldoPendiente),
      estado: cuota.estado,
    };
  }
}

function redondearSiEsDinero(valor: Prisma.Decimal): Prisma.Decimal {
  return valor.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}
