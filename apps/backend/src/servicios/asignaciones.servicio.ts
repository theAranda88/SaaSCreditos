import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AsignacionPerfil, PerfilUsuario } from '@creditos/shared-types';
import type { ConsultarAsignacionesDto } from '../dtos/consultar-asignaciones.dto';
import type { CrearAsignacionDto } from '../dtos/crear-asignacion.dto';
import {
  AsignacionRepositorio,
  type AsignacionConCartera,
} from '../entidades/asignacion.repositorio';
import { CreditoRepositorio } from '../entidades/credito.repositorio';
import { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { ESTADOS_CREDITO_ASIGNABLES } from '../nucleo/constantes/asignaciones.constantes';
import { formatearDinero } from './generar-plan-cuotas';

@Injectable()
export class AsignacionesServicio {
  constructor(
    @Inject(AsignacionRepositorio) private readonly asignacionRepositorio: AsignacionRepositorio,
    @Inject(CreditoRepositorio) private readonly creditoRepositorio: CreditoRepositorio,
    @Inject(UsuarioRepositorio) private readonly usuarioRepositorio: UsuarioRepositorio,
  ) {}

  async asignar(usuario: PerfilUsuario, dto: CrearAsignacionDto): Promise<AsignacionPerfil> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const credito = await this.creditoRepositorio.buscarPorIdYNegocio(dto.creditoId, negocioId);

    if (!credito) {
      throw new NotFoundException('Crédito no encontrado');
    }

    if (!this.esEstadoAsignable(credito.estado)) {
      throw new UnprocessableEntityException(
        'Solo se puede asignar un crédito activo o en mora',
      );
    }

    const cobrador = await this.usuarioRepositorio.buscarCobradorPorIdYNegocio(
      dto.cobradorId,
      negocioId,
    );

    if (!cobrador) {
      throw new NotFoundException('Cobrador no encontrado');
    }

    if (cobrador.estado !== 'activo') {
      throw new UnprocessableEntityException('El cobrador está inactivo y no puede recibir cartera');
    }

    const activa = await this.asignacionRepositorio.buscarActivaPorCredito(dto.creditoId, negocioId);

    if (activa && activa.cobradorId === dto.cobradorId) {
      throw new UnprocessableEntityException('El crédito ya está asignado a este cobrador');
    }

    try {
      const persistida = await this.asignacionRepositorio.asignar({
        negocioId,
        creditoId: dto.creditoId,
        cobradorId: dto.cobradorId,
        asignadoPor: usuario.id,
      });

      return this.mapearAsignacion(persistida);
    } catch (error) {
      this.lanzarSiConflictoActiva(error);
      throw error;
    }
  }

  async listar(
    usuario: PerfilUsuario,
    consulta: ConsultarAsignacionesDto,
  ): Promise<AsignacionPerfil[]> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const filtros = this.filtrosSegunRol(usuario, consulta);
    const asignaciones = await this.asignacionRepositorio.listar(negocioId, filtros);

    return asignaciones.map((asignacion) => this.mapearAsignacion(asignacion));
  }

  async obtenerPorId(usuario: PerfilUsuario, id: string): Promise<AsignacionPerfil> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const asignacion = await this.asignacionRepositorio.buscarPorIdYNegocio(id, negocioId);

    if (!asignacion) {
      throw new NotFoundException('Asignación no encontrada');
    }

    if (usuario.rol === 'cobrador' && asignacion.cobradorId !== usuario.id) {
      throw new ForbiddenException('No puede consultar la cartera de otro cobrador');
    }

    return this.mapearAsignacion(asignacion);
  }

  private filtrosSegunRol(usuario: PerfilUsuario, consulta: ConsultarAsignacionesDto) {
    if (usuario.rol === 'cobrador') {
      return {
        cobradorId: usuario.id,
        creditoId: consulta.creditoId,
        estado: 'activa' as const,
      };
    }

    return {
      cobradorId: consulta.cobradorId,
      creditoId: consulta.creditoId,
      estado: consulta.estado,
    };
  }

  private esEstadoAsignable(estado: string): boolean {
    return (ESTADOS_CREDITO_ASIGNABLES as readonly string[]).includes(estado);
  }

  private lanzarSiConflictoActiva(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('El crédito ya tiene una asignación activa');
    }
  }

  private exigirNegocioAsignado(usuario: PerfilUsuario): string {
    if (!usuario.negocio_id) {
      throw new ForbiddenException('Los usuarios de plataforma no tienen negocio asignado');
    }

    return usuario.negocio_id;
  }

  private mapearAsignacion(asignacion: AsignacionConCartera): AsignacionPerfil {
    return {
      id: asignacion.id,
      negocio_id: asignacion.negocioId,
      credito_id: asignacion.creditoId,
      cobrador_id: asignacion.cobradorId,
      fecha_asignacion: asignacion.fechaAsignacion.toISOString(),
      fecha_fin: asignacion.fechaFin?.toISOString() ?? null,
      estado: asignacion.estado,
      asignado_por: asignacion.asignadoPor,
      credito: {
        id: asignacion.credito.id,
        cliente_id: asignacion.credito.clienteId,
        cliente_nombre_completo: asignacion.credito.cliente.nombreCompleto,
        estado: asignacion.credito.estado,
        monto_principal: formatearDinero(asignacion.credito.montoPrincipal),
      },
    };
  }
}
