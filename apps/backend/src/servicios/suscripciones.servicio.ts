import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { PerfilUsuario, SuscripcionPerfil } from '@creditos/shared-types';
import { PrismaServicio } from '../bd/prisma.servicio';
import type { CheckoutSuscripcionDto } from '../dtos/checkout-suscripcion.dto';
import { PlanRepositorio } from '../entidades/plan.repositorio';
import { SuscripcionRepositorio } from '../entidades/suscripcion.repositorio';
import { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { fechaHoyUtc, sumarMesesUtc } from '../nucleo/utilidades/fechas-plan';
import { mapearSuscripcion } from '../nucleo/utilidades/mapeadores-plan';
import { CupoPlanServicio } from './cupo-plan.servicio';

@Injectable()
export class SuscripcionesServicio {
  constructor(
    @Inject(SuscripcionRepositorio)
    private readonly suscripcionRepositorio: SuscripcionRepositorio,
    @Inject(UsuarioRepositorio) private readonly usuarioRepositorio: UsuarioRepositorio,
    @Inject(PlanRepositorio) private readonly planRepositorio: PlanRepositorio,
    @Inject(CupoPlanServicio) private readonly cupoPlanServicio: CupoPlanServicio,
    @Inject(PrismaServicio) private readonly prisma: PrismaServicio,
  ) {}

  async obtenerMia(usuario: PerfilUsuario): Promise<SuscripcionPerfil> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    return this.obtenerPorNegocio(negocioId);
  }

  async checkoutStub(
    usuario: PerfilUsuario,
    dto: CheckoutSuscripcionDto,
  ): Promise<SuscripcionPerfil> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const suscripcion = await this.suscripcionRepositorio.buscarPorNegocioId(negocioId);

    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    const planDestino = await this.planRepositorio.buscarPorId(dto.planId);

    if (!planDestino || planDestino.estado !== 'activo') {
      throw new UnprocessableEntityException('El plan destino no está disponible');
    }

    await this.cupoPlanServicio.exigirCupoParaPlanDestino(negocioId, planDestino);

    const hoy = fechaHoyUtc();
    const actualizada = await this.prisma.$transaction(async (tx) => {
      const resultado = await tx.suscripcion.update({
        where: { id: suscripcion.id },
        data: {
          planId: planDestino.id,
          estado: 'activa',
          fechaRenovacion: sumarMesesUtc(hoy, 1),
          ...(dto.referenciaPagoExterno !== undefined && {
            referenciaPagoExterno: dto.referenciaPagoExterno,
          }),
        },
        include: { plan: true },
      });

      await tx.auditoria.create({
        data: {
          negocioId,
          usuarioId: usuario.id,
          entidad: 'suscripciones',
          entidadId: suscripcion.id,
          accion: 'cambiar_plan',
          detalle: {
            plan_origen_id: suscripcion.planId,
            plan_destino_id: planDestino.id,
            stub: true,
          },
        },
      });

      return resultado;
    });

    const cobradoresActivos = await this.usuarioRepositorio.contarCobradoresActivos(negocioId);
    return mapearSuscripcion(actualizada, cobradoresActivos);
  }

  private async obtenerPorNegocio(negocioId: string): Promise<SuscripcionPerfil> {
    const suscripcion = await this.suscripcionRepositorio.buscarPorNegocioId(negocioId);

    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    const cobradoresActivos = await this.usuarioRepositorio.contarCobradoresActivos(negocioId);
    return mapearSuscripcion(suscripcion, cobradoresActivos);
  }

  private exigirNegocioAsignado(usuario: PerfilUsuario): string {
    if (!usuario.negocio_id) {
      throw new ForbiddenException('Los usuarios de plataforma no tienen negocio asignado');
    }

    return usuario.negocio_id;
  }
}
