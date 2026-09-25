import {
  ConflictException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { CodigoPlan } from '@creditos/shared-types';
import * as bcrypt from 'bcrypt';
import { PrismaServicio } from '../bd/prisma.servicio';
import {
  CODIGO_PLAN_INICIAL,
  MENSAJE_PLAN_INICIAL_AUSENTE,
} from '../nucleo/constantes/planes.constantes';
import { fechaHoyUtc, sumarMesesUtc } from '../nucleo/utilidades/fechas-plan';
import { UsuarioRepositorio } from '../entidades/usuario.repositorio';

const RONDAS_BCRYPT = 12;

export type DatosAltaNegocio = {
  nombreComercial: string;
  nombre: string;
  correo: string;
  contrasena: string;
  moneda?: string;
  telefono?: string;
  codigoPlan?: CodigoPlan;
};

export type OpcionesAltaNegocio = {
  registrarAuditoriaPlataforma?: { usuarioAdminId: string };
};

export type ResultadoAltaNegocio = {
  negocio: { id: string; nombreComercial: string; moneda: string };
  usuario: {
    id: string;
    nombre: string;
    correo: string;
    rol: 'propietario';
    negocioId: string;
  };
};

@Injectable()
export class AltaNegocioServicio {
  constructor(
    @Inject(PrismaServicio) private readonly prisma: PrismaServicio,
    @Inject(UsuarioRepositorio) private readonly usuarioRepositorio: UsuarioRepositorio,
  ) {}

  async crearNegocioYPropietario(
    datos: DatosAltaNegocio,
    opciones?: OpcionesAltaNegocio,
  ): Promise<ResultadoAltaNegocio> {
    const correoNormalizado = datos.correo.trim().toLowerCase();
    const existente = await this.usuarioRepositorio.buscarPorCorreo(correoNormalizado);

    if (existente) {
      throw new ConflictException('El correo ya está registrado');
    }

    const codigoPlan = datos.codigoPlan ?? CODIGO_PLAN_INICIAL;
    const hashContrasena = await bcrypt.hash(datos.contrasena, RONDAS_BCRYPT);

    return this.prisma.$transaction(async (tx) => {
      const planInicial = await tx.plan.findUnique({ where: { codigo: codigoPlan } });

      if (!planInicial) {
        throw new UnprocessableEntityException(MENSAJE_PLAN_INICIAL_AUSENTE);
      }

      const negocio = await tx.negocio.create({
        data: {
          nombreComercial: datos.nombreComercial.trim(),
          moneda: datos.moneda ?? 'COP',
          configuracion: {},
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          negocioId: negocio.id,
          nombre: datos.nombre.trim(),
          correo: correoNormalizado,
          hashContrasena,
          rol: 'propietario',
          telefono: datos.telefono?.trim() ?? null,
        },
      });

      const hoy = fechaHoyUtc();
      await tx.suscripcion.create({
        data: {
          negocioId: negocio.id,
          planId: planInicial.id,
          estado: 'activa',
          fechaInicio: hoy,
          fechaRenovacion: sumarMesesUtc(hoy, 1),
        },
      });

      if (opciones?.registrarAuditoriaPlataforma) {
        await tx.auditoria.create({
          data: {
            negocioId: negocio.id,
            usuarioId: opciones.registrarAuditoriaPlataforma.usuarioAdminId,
            entidad: 'negocios',
            entidadId: negocio.id,
            accion: 'crear',
            detalle: {
              origen: 'plataforma',
              correo_propietario: correoNormalizado,
              plan_codigo: codigoPlan,
            },
          },
        });
      }

      return {
        negocio: {
          id: negocio.id,
          nombreComercial: negocio.nombreComercial,
          moneda: negocio.moneda,
        },
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: 'propietario' as const,
          negocioId: negocio.id,
        },
      };
    });
  }
}
