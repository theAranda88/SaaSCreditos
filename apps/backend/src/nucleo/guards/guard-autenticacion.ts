import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { CLAVE_ES_PUBLICO } from '../constantes/auth.constantes';

@Injectable()
export class GuardAutenticacion extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(contexto: ExecutionContext): boolean | Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(CLAVE_ES_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (esPublico) {
      return true;
    }

    return super.canActivate(contexto) as boolean | Promise<boolean>;
  }
}
