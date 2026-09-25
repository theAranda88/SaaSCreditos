import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { estado_negocio, estado_suscripcion } from '@prisma/client';
import type {
  AuditoriaPlataforma,
  CodigoPlan,
  NegocioPlataforma,
  PerfilUsuario,
  PlanPerfil,
  RolUsuario,
  UsuarioPlataforma,
} from '@creditos/shared-types';
import { PrismaServicio } from '../bd/prisma.servicio';
import type { ActualizarPlanDto } from '../dtos/actualizar-plan.dto';
import type { CambiarEstadoNegocioDto } from '../dtos/cambiar-estado-negocio.dto';
import type { ConsultarAuditoriasDto } from '../dtos/consultar-auditorias.dto';
import type { WebhookSuscripcionDto } from '../dtos/webhook-suscripcion.dto';
import { NegocioRepositorio } from '../entidades/negocio.repositorio';
import { PlanRepositorio } from '../entidades/plan.repositorio';
import { SuscripcionRepositorio } from '../entidades/suscripcion.repositorio';
import { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { AuditoriaRepositorio } from '../entidades/auditoria.repositorio';
import { fechaHoyUtc, formatearFechaIso, sumarMesesUtc } from '../nucleo/utilidades/fechas-plan';
import { mapearPlan } from '../nucleo/utilidades/mapeadores-plan';
import type { CrearNegocioPlataformaDto } from '../dtos/crear-negocio-plataforma.dto';
import { AltaNegocioServicio } from './alta-negocio.servicio';

const ROLES_PLATAFORMA: RolUsuario[] = ['admin_plataforma', 'soporte'];

@Injectable()
export class PlataformaServicio {
  constructor(
    @Inject(NegocioRepositorio) private readonly negocioRepositorio: NegocioRepositorio,
    @Inject(UsuarioRepositorio) private readonly usuarioRepositorio: UsuarioRepositorio,
    @Inject(PlanRepositorio) private readonly planRepositorio: PlanRepositorio,
    @Inject(SuscripcionRepositorio)
    private readonly suscripcionRepositorio: SuscripcionRepositorio,
    @Inject(AuditoriaRepositorio) private readonly auditoriaRepositorio: AuditoriaRepositorio,
    @Inject(PrismaServicio) private readonly prisma: PrismaServicio,
    @Inject(AltaNegocioServicio) private readonly altaNegocioServicio: AltaNegocioServicio,
  ) {}

  async crearNegocio(
    usuario: PerfilUsuario,
    dto: CrearNegocioPlataformaDto,
  ): Promise<NegocioPlataforma> {
    this.exigirAdminPlataforma(usuario);

    const resultado = await this.altaNegocioServicio.crearNegocioYPropietario(
      {
        nombreComercial: dto.nombreComercial,
        nombre: dto.nombre,
        correo: dto.correo,
        contrasena: dto.contrasena,
        moneda: dto.moneda,
        telefono: dto.telefono,
        codigoPlan: dto.codigoPlan,
      },
      { registrarAuditoriaPlataforma: { usuarioAdminId: usuario.id } },
    );

    const negocio = await this.negocioRepositorio.buscarPorIdConSuscripcion(resultado.negocio.id);

    if (!negocio) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return this.mapearNegocioPlataforma(negocio);
  }

  async listarNegocios(usuario: PerfilUsuario): Promise<NegocioPlataforma[]> {
    this.exigirPlataforma(usuario);
    const negocios = await this.negocioRepositorio.listarConSuscripcion();
    return negocios.map((negocio) => this.mapearNegocioPlataforma(negocio));
  }

  async obtenerNegocio(usuario: PerfilUsuario, negocioId: string): Promise<NegocioPlataforma> {
    this.exigirPlataforma(usuario);
    const negocio = await this.negocioRepositorio.buscarPorIdConSuscripcion(negocioId);

    if (!negocio) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return this.mapearNegocioPlataforma(negocio);
  }

  async cambiarEstadoNegocio(
    usuario: PerfilUsuario,
    negocioId: string,
    dto: CambiarEstadoNegocioDto,
  ): Promise<NegocioPlataforma> {
    this.exigirAdminPlataforma(usuario);
    const negocio = await this.negocioRepositorio.buscarPorIdConSuscripcion(negocioId);

    if (!negocio) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const hoy = fechaHoyUtc();
    const estadoSuscripcion = this.estadoSuscripcionSegunNegocio(dto.estado);

    await this.prisma.$transaction(async (tx) => {
      await tx.negocio.update({
        where: { id: negocioId },
        data: { estado: dto.estado },
      });

      if (negocio.suscripcion) {
        await tx.suscripcion.update({
          where: { id: negocio.suscripcion.id },
          data: {
            estado: estadoSuscripcion,
            fechaCancelacion: dto.estado === 'cancelado' ? hoy : null,
          },
        });
      }

      await tx.auditoria.create({
        data: {
          negocioId,
          usuarioId: usuario.id,
          entidad: 'negocios',
          entidadId: negocioId,
          accion: this.accionSegunEstado(dto.estado),
          detalle: {
            estado_anterior: negocio.estado,
            estado_nuevo: dto.estado,
          },
        },
      });
    });

    const actualizado = await this.negocioRepositorio.buscarPorIdConSuscripcion(negocioId);
    return this.mapearNegocioPlataforma(actualizado!);
  }

  async listarUsuarios(usuario: PerfilUsuario, negocioId: string): Promise<UsuarioPlataforma[]> {
    this.exigirPlataforma(usuario);
    const negocio = await this.negocioRepositorio.buscarPorId(negocioId);

    if (!negocio) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const usuarios = await this.usuarioRepositorio.listarPorNegocio(negocioId);
    return usuarios.map((item) => ({
      id: item.id,
      negocio_id: item.negocioId,
      nombre: item.nombre,
      correo: item.correo,
      rol: item.rol,
      estado: item.estado,
    }));
  }

  async actualizarPlan(
    usuario: PerfilUsuario,
    planId: string,
    dto: ActualizarPlanDto,
  ): Promise<PlanPerfil> {
    this.exigirAdminPlataforma(usuario);
    const plan = await this.planRepositorio.buscarPorId(planId);

    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }

    if (dto.estado === 'inactivo' && plan.estado === 'activo') {
      const activas = await this.planRepositorio.contarSuscripcionesActivas(planId);
      if (activas > 0) {
        throw new UnprocessableEntityException(
          'No se puede inactivar un plan con suscripciones activas',
        );
      }
    }

    const actualizado = await this.planRepositorio.actualizar(planId, {
      ...(dto.limiteCobradores !== undefined && { limiteCobradores: dto.limiteCobradores }),
      ...(dto.precioImplementacion !== undefined && {
        precioImplementacion: dto.precioImplementacion.toFixed(2),
      }),
      ...(dto.precioMensual !== undefined && { precioMensual: dto.precioMensual.toFixed(2) }),
      ...(dto.estado !== undefined && { estado: dto.estado }),
    });

    return mapearPlan(actualizado);
  }

  async aplicarWebhookStub(
    usuario: PerfilUsuario,
    dto: WebhookSuscripcionDto,
  ): Promise<NegocioPlataforma> {
    this.exigirAdminPlataforma(usuario);
    const suscripcion = await this.suscripcionRepositorio.buscarPorId(dto.suscripcionId);

    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    const hoy = fechaHoyUtc();
    const { estadoNegocio, estadoSuscripcion, fechaCancelacion, fechaRenovacion } =
      this.estadosSegunWebhook(dto.evento, hoy);

    await this.prisma.$transaction(async (tx) => {
      await tx.suscripcion.update({
        where: { id: suscripcion.id },
        data: {
          estado: estadoSuscripcion,
          fechaCancelacion,
          ...(fechaRenovacion && { fechaRenovacion }),
          ...(dto.referenciaPagoExterno !== undefined && {
            referenciaPagoExterno: dto.referenciaPagoExterno,
          }),
        },
      });

      await tx.negocio.update({
        where: { id: suscripcion.negocioId },
        data: { estado: estadoNegocio },
      });

      await tx.auditoria.create({
        data: {
          negocioId: suscripcion.negocioId,
          usuarioId: usuario.id,
          entidad: 'suscripciones',
          entidadId: suscripcion.id,
          accion: dto.evento,
          detalle: { stub: true, referencia: dto.referenciaPagoExterno ?? null },
        },
      });
    });

    const negocio = await this.negocioRepositorio.buscarPorIdConSuscripcion(suscripcion.negocioId);
    return this.mapearNegocioPlataforma(negocio!);
  }

  async listarAuditorias(
    usuario: PerfilUsuario,
    consulta: ConsultarAuditoriasDto,
  ): Promise<AuditoriaPlataforma[]> {
    this.exigirPlataforma(usuario);
    const filas = await this.auditoriaRepositorio.listar({
      negocioId: consulta.negocioId,
      entidad: consulta.entidad,
      accion: consulta.accion,
    });

    return filas.map((fila) => ({
      id: fila.id,
      negocio_id: fila.negocioId,
      usuario_id: fila.usuarioId,
      entidad: fila.entidad,
      entidad_id: fila.entidadId,
      accion: fila.accion,
      detalle:
        typeof fila.detalle === 'object' && fila.detalle !== null
          ? (fila.detalle as Record<string, unknown>)
          : {},
      fecha: fila.fecha.toISOString(),
    }));
  }

  private exigirPlataforma(usuario: PerfilUsuario): void {
    if (!ROLES_PLATAFORMA.includes(usuario.rol) || usuario.negocio_id) {
      throw new ForbiddenException('Solo roles de plataforma pueden operar este recurso');
    }
  }

  private exigirAdminPlataforma(usuario: PerfilUsuario): void {
    this.exigirPlataforma(usuario);
    if (usuario.rol !== 'admin_plataforma') {
      throw new ForbiddenException('Solo el administrador de plataforma puede modificar');
    }
  }

  private estadoSuscripcionSegunNegocio(estado: estado_negocio): estado_suscripcion {
    if (estado === 'suspendido') {
      return 'suspendida';
    }
    if (estado === 'cancelado') {
      return 'cancelada';
    }
    return 'activa';
  }

  private accionSegunEstado(estado: estado_negocio): string {
    if (estado === 'suspendido') {
      return 'suspender';
    }
    if (estado === 'cancelado') {
      return 'cancelar';
    }
    return 'activar';
  }

  private estadosSegunWebhook(
    evento: 'pago_aprobado' | 'pago_fallido' | 'cancelacion',
    hoy: Date,
  ): {
    estadoNegocio: estado_negocio;
    estadoSuscripcion: estado_suscripcion;
    fechaCancelacion: Date | null;
    fechaRenovacion?: Date;
  } {
    if (evento === 'pago_aprobado') {
      return {
        estadoNegocio: 'activo',
        estadoSuscripcion: 'activa',
        fechaCancelacion: null,
        fechaRenovacion: sumarMesesUtc(hoy, 1),
      };
    }
    if (evento === 'pago_fallido') {
      return {
        estadoNegocio: 'activo',
        estadoSuscripcion: 'pago_fallido',
        fechaCancelacion: null,
      };
    }
    return {
      estadoNegocio: 'cancelado',
      estadoSuscripcion: 'cancelada',
      fechaCancelacion: hoy,
    };
  }

  private mapearNegocioPlataforma(negocio: {
    id: string;
    nombreComercial: string;
    moneda: string;
    estado: estado_negocio;
    fechaCreacion: Date;
    suscripcion: {
      id: string;
      estado: estado_suscripcion;
      fechaRenovacion: Date;
      plan: { codigo: string; nombre: string; limiteCobradores: number };
    } | null;
  }): NegocioPlataforma {
    return {
      id: negocio.id,
      nombre_comercial: negocio.nombreComercial,
      moneda: negocio.moneda,
      estado: negocio.estado,
      fecha_creacion: negocio.fechaCreacion.toISOString(),
      suscripcion: negocio.suscripcion
        ? {
            id: negocio.suscripcion.id,
            estado: negocio.suscripcion.estado,
            plan_codigo: negocio.suscripcion.plan.codigo as CodigoPlan,
            plan_nombre: negocio.suscripcion.plan.nombre,
            limite_cobradores: negocio.suscripcion.plan.limiteCobradores,
            fecha_renovacion: formatearFechaIso(negocio.suscripcion.fechaRenovacion),
          }
        : null,
    };
  }
}
