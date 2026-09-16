import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Usuario } from '@prisma/client';
import type { CobradorPerfil, PerfilUsuario } from '@creditos/shared-types';
import * as bcrypt from 'bcrypt';
import type { ActualizarCobradorDto } from '../dtos/actualizar-cobrador.dto';
import type { CambiarEstadoCobradorDto } from '../dtos/cambiar-estado-cobrador.dto';
import type { ConsultarCobradoresDto } from '../dtos/consultar-cobradores.dto';
import type { CrearCobradorDto } from '../dtos/crear-cobrador.dto';
import { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { RONDAS_BCRYPT } from '../nucleo/constantes/usuarios.constantes';

@Injectable()
export class CobradoresServicio {
  constructor(
    @Inject(UsuarioRepositorio) private readonly usuarioRepositorio: UsuarioRepositorio,
  ) {}

  async crear(usuario: PerfilUsuario, dto: CrearCobradorDto): Promise<CobradorPerfil> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const correo = dto.correo.trim().toLowerCase();

    await this.asegurarCupoPlan(negocioId);
    await this.asegurarCorreoLibre(correo);

    const hashContrasena = await bcrypt.hash(dto.contrasena, RONDAS_BCRYPT);

    try {
      const cobrador = await this.usuarioRepositorio.crear({
        nombre: dto.nombre.trim(),
        correo,
        hashContrasena,
        rol: 'cobrador',
        telefono: dto.telefono?.trim() ?? null,
        negocio: { connect: { id: negocioId } },
      });

      return this.mapearCobrador(cobrador);
    } catch (error) {
      this.lanzarSiCorreoDuplicado(error);
      throw error;
    }
  }

  async listar(
    usuario: PerfilUsuario,
    consulta: ConsultarCobradoresDto,
  ): Promise<CobradorPerfil[]> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const cobradores = await this.usuarioRepositorio.listarCobradores(negocioId, {
      nombre: consulta.nombre?.trim(),
      correo: consulta.correo?.trim().toLowerCase(),
      telefono: consulta.telefono?.trim(),
      estado: consulta.estado,
    });

    return cobradores.map((cobrador) => this.mapearCobrador(cobrador));
  }

  async obtenerPorId(usuario: PerfilUsuario, id: string): Promise<CobradorPerfil> {
    const cobrador = await this.obtenerDelNegocio(usuario, id);
    return this.mapearCobrador(cobrador);
  }

  async actualizar(
    usuario: PerfilUsuario,
    id: string,
    dto: ActualizarCobradorDto,
  ): Promise<CobradorPerfil> {
    const cobrador = await this.obtenerDelNegocio(usuario, id);
    const correo = dto.correo?.trim().toLowerCase();

    if (correo && correo !== cobrador.correo) {
      await this.asegurarCorreoLibre(correo, cobrador.id);
    }

    try {
      const actualizado = await this.usuarioRepositorio.actualizar(cobrador.id, cobrador.negocioId!, {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(correo !== undefined && { correo }),
        ...(dto.telefono !== undefined && {
          telefono: dto.telefono === null ? null : dto.telefono.trim(),
        }),
        ...(dto.contrasena !== undefined && {
          hashContrasena: await bcrypt.hash(dto.contrasena, RONDAS_BCRYPT),
        }),
      });

      return this.mapearCobrador(actualizado);
    } catch (error) {
      this.lanzarSiCorreoDuplicado(error);
      throw error;
    }
  }

  async cambiarEstado(
    usuario: PerfilUsuario,
    id: string,
    dto: CambiarEstadoCobradorDto,
  ): Promise<CobradorPerfil> {
    const cobrador = await this.obtenerDelNegocio(usuario, id);
    const actualizado = await this.usuarioRepositorio.actualizar(cobrador.id, cobrador.negocioId!, {
      estado: dto.estado,
    });

    return this.mapearCobrador(actualizado);
  }

  /**
   * Hook de plan (RF-015 / Fase 7): consulta el cupo actual.
   * No aplica `planes.limite_cobradores` todavía.
   */
  async asegurarCupoPlan(negocioId: string): Promise<void> {
    await this.usuarioRepositorio.contarCobradoresActivos(negocioId);
  }

  private async obtenerDelNegocio(usuario: PerfilUsuario, id: string): Promise<Usuario> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const cobrador = await this.usuarioRepositorio.buscarCobradorPorIdYNegocio(id, negocioId);

    if (!cobrador) {
      throw new NotFoundException('Cobrador no encontrado');
    }

    return cobrador;
  }

  private async asegurarCorreoLibre(correo: string, excluirId?: string): Promise<void> {
    const existente = await this.usuarioRepositorio.buscarPorCorreo(correo);

    if (existente && existente.id !== excluirId) {
      throw new ConflictException('El correo ya está registrado');
    }
  }

  private lanzarSiCorreoDuplicado(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('El correo ya está registrado');
    }
  }

  private exigirNegocioAsignado(usuario: PerfilUsuario): string {
    if (!usuario.negocio_id) {
      throw new ForbiddenException('Los usuarios de plataforma no tienen negocio asignado');
    }

    return usuario.negocio_id;
  }

  private mapearCobrador(usuario: Usuario): CobradorPerfil {
    return {
      id: usuario.id,
      negocio_id: usuario.negocioId!,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: 'cobrador',
      estado: usuario.estado,
      telefono: usuario.telefono,
      fecha_creacion: usuario.fechaCreacion.toISOString(),
      ultimo_acceso: usuario.ultimoAcceso?.toISOString() ?? null,
    };
  }
}
