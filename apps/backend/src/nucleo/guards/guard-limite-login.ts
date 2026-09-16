import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

interface IntentoLogin {
  contador: number;
  reinicioEn: number;
}

const MAXIMO_INTENTOS = 10;
const VENTANA_MS = 60_000;

@Injectable()
export class GuardLimiteLogin implements CanActivate {
  private readonly intentos = new Map<string, IntentoLogin>();

  canActivate(contexto: ExecutionContext): boolean {
    const solicitud = contexto.switchToHttp().getRequest<Request>();
    const clave = solicitud.ip ?? 'desconocido';
    const ahora = Date.now();
    const registro = this.intentos.get(clave);

    if (!registro || ahora >= registro.reinicioEn) {
      this.intentos.set(clave, { contador: 1, reinicioEn: ahora + VENTANA_MS });
      return true;
    }

    if (registro.contador >= MAXIMO_INTENTOS) {
      throw new HttpException(
        'Demasiados intentos de inicio de sesión. Intente más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    registro.contador += 1;
    return true;
  }
}
