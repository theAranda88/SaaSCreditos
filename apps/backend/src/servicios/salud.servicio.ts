import { Injectable } from '@nestjs/common';
import type { RespuestaSaludApi } from '@creditos/shared-types';

@Injectable()
export class SaludServicio {
  obtenerSalud(): RespuestaSaludApi {
    return {
      estado: 'ok',
      servicio: 'api',
      version: '0.1.0',
    };
  }
}
