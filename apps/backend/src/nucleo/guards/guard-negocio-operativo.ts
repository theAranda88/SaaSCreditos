import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaServicio } from '../../bd/prisma.servicio';
import {
  CLAVE_ES_PUBLICO,
  CLAVE_PERMITIR_NEGOCIO_NO_OPERATIVO,
} from '../constantes/auth.constantes';
import {
  ESTADOS_SUSCRIPCION_OPERATIVA,
  MENSAJE_NEGOCIO_NO_OPERATIVO,
} from '../constantes/planes.constantes';
import type { UsuarioSolicitud } from '../tipos/usuario-solicitud';

@Injectable()
export class GuardNegocioOperativo implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaServicio) private readonly prisma: PrismaServicio,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(CLAVE_ES_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (esPublico) {
      return true;
    }

    const permitirNoOperativo = this.reflector.getAllAndOverride<boolean>(
      CLAVE_PERMITIR_NEGOCIO_NO_OPERATIVO,
      [contexto.getHandler(), contexto.getClass()],
    );

    if (permitirNoOperativo) {
      return true;
    }

    const solicitud = contexto.switchToHttp().getRequest<{ user?: UsuarioSolicitud }>();
    const usuario = solicitud.user;

    if (!usuario?.negocio_id) {
      return true;
    }

    const negocio = await this.prisma.negocio.findUnique({
      where: { id: usuario.negocio_id },
      include: { suscripcion: true },
    });

    const suscripcionOperativa =
      negocio?.suscripcion &&
      (ESTADOS_SUSCRIPCION_OPERATIVA as readonly string[]).includes(negocio.suscripcion.estado);

    if (!negocio || negocio.estado !== 'activo' || !suscripcionOperativa) {
      throw new ForbiddenException(MENSAJE_NEGOCIO_NO_OPERATIVO);
    }

    return true;
  }
}
