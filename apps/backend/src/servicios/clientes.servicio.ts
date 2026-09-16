import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Cliente } from '@prisma/client';
import type { ClientePerfil, PerfilUsuario, TipoDocumento } from '@creditos/shared-types';
import type { ActualizarClienteDto } from '../dtos/actualizar-cliente.dto';
import type { CambiarEstadoClienteDto } from '../dtos/cambiar-estado-cliente.dto';
import type { ConsultarClientesDto } from '../dtos/consultar-clientes.dto';
import type { CrearClienteDto } from '../dtos/crear-cliente.dto';
import { ClienteRepositorio } from '../entidades/cliente.repositorio';

@Injectable()
export class ClientesServicio {
  constructor(
    @Inject(ClienteRepositorio) private readonly clienteRepositorio: ClienteRepositorio,
  ) {}

  async crear(usuario: PerfilUsuario, dto: CrearClienteDto): Promise<ClientePerfil> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const numeroDocumento = dto.numeroDocumento.trim();

    await this.asegurarDocumentoLibre(negocioId, dto.tipoDocumento, numeroDocumento);

    try {
      const cliente = await this.clienteRepositorio.crear({
        nombreCompleto: dto.nombreCompleto.trim(),
        tipoDocumento: dto.tipoDocumento,
        numeroDocumento,
        telefono: dto.telefono.trim(),
        direccion: dto.direccion?.trim() ?? null,
        referenciaUbicacion: dto.referenciaUbicacion?.trim() ?? null,
        negocio: { connect: { id: negocioId } },
        creador: { connect: { id: usuario.id } },
      });

      return this.mapearCliente(cliente);
    } catch (error) {
      this.lanzarSiDocumentoDuplicado(error);
      throw error;
    }
  }

  async listar(usuario: PerfilUsuario, consulta: ConsultarClientesDto): Promise<ClientePerfil[]> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const clientes = await this.clienteRepositorio.listar(negocioId, {
      nombre: consulta.nombre?.trim(),
      numeroDocumento: consulta.numeroDocumento?.trim(),
      telefono: consulta.telefono?.trim(),
      estado: consulta.estado,
    });

    return clientes.map((cliente) => this.mapearCliente(cliente));
  }

  async obtenerPorId(usuario: PerfilUsuario, id: string): Promise<ClientePerfil> {
    const cliente = await this.obtenerDelNegocio(usuario, id);
    return this.mapearCliente(cliente);
  }

  async actualizar(
    usuario: PerfilUsuario,
    id: string,
    dto: ActualizarClienteDto,
  ): Promise<ClientePerfil> {
    const cliente = await this.obtenerDelNegocio(usuario, id);
    const tipoDocumento = dto.tipoDocumento ?? cliente.tipoDocumento;
    const numeroDocumento = dto.numeroDocumento?.trim() ?? cliente.numeroDocumento;

    if (dto.tipoDocumento !== undefined || dto.numeroDocumento !== undefined) {
      await this.asegurarDocumentoLibre(cliente.negocioId, tipoDocumento, numeroDocumento, cliente.id);
    }

    try {
      const actualizado = await this.clienteRepositorio.actualizar(cliente.id, cliente.negocioId, {
        ...(dto.nombreCompleto !== undefined && { nombreCompleto: dto.nombreCompleto.trim() }),
        ...(dto.tipoDocumento !== undefined && { tipoDocumento: dto.tipoDocumento }),
        ...(dto.numeroDocumento !== undefined && { numeroDocumento }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono.trim() }),
        ...(dto.direccion !== undefined && {
          direccion: dto.direccion === null ? null : dto.direccion.trim(),
        }),
        ...(dto.referenciaUbicacion !== undefined && {
          referenciaUbicacion:
            dto.referenciaUbicacion === null ? null : dto.referenciaUbicacion.trim(),
        }),
      });

      return this.mapearCliente(actualizado);
    } catch (error) {
      this.lanzarSiDocumentoDuplicado(error);
      throw error;
    }
  }

  async cambiarEstado(
    usuario: PerfilUsuario,
    id: string,
    dto: CambiarEstadoClienteDto,
  ): Promise<ClientePerfil> {
    const cliente = await this.obtenerDelNegocio(usuario, id);
    const actualizado = await this.clienteRepositorio.actualizar(cliente.id, cliente.negocioId, {
      estado: dto.estado,
    });

    return this.mapearCliente(actualizado);
  }

  private async obtenerDelNegocio(usuario: PerfilUsuario, id: string): Promise<Cliente> {
    const negocioId = this.exigirNegocioAsignado(usuario);
    const cliente = await this.clienteRepositorio.buscarPorIdYNegocio(id, negocioId);

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return cliente;
  }

  private async asegurarDocumentoLibre(
    negocioId: string,
    tipoDocumento: string,
    numeroDocumento: string,
    excluirId?: string,
  ): Promise<void> {
    const existente = await this.clienteRepositorio.buscarPorDocumento(
      negocioId,
      tipoDocumento,
      numeroDocumento,
    );

    if (existente && existente.id !== excluirId) {
      throw new ConflictException('Ya existe un cliente con ese documento en este negocio');
    }
  }

  private lanzarSiDocumentoDuplicado(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Ya existe un cliente con ese documento en este negocio');
    }
  }

  private exigirNegocioAsignado(usuario: PerfilUsuario): string {
    if (!usuario.negocio_id) {
      throw new ForbiddenException('Los usuarios de plataforma no tienen negocio asignado');
    }

    return usuario.negocio_id;
  }

  private mapearCliente(cliente: Cliente): ClientePerfil {
    return {
      id: cliente.id,
      negocio_id: cliente.negocioId,
      nombre_completo: cliente.nombreCompleto,
      tipo_documento: cliente.tipoDocumento as TipoDocumento,
      numero_documento: cliente.numeroDocumento,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      referencia_ubicacion: cliente.referenciaUbicacion,
      estado: cliente.estado,
      fecha_creacion: cliente.fechaCreacion.toISOString(),
      fecha_actualizacion: cliente.fechaActualizacion.toISOString(),
      creado_por: cliente.creadoPor,
    };
  }
}
