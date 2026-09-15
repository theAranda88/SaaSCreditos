import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Inject } from '@nestjs/common';
import type { RespuestaSaludApi } from '@creditos/shared-types';
import { SaludServicio } from '../servicios/salud.servicio';

@ApiTags('salud')
@Controller('salud')
export class SaludControlador {
  constructor(@Inject(SaludServicio) private readonly saludServicio: SaludServicio) {}

  @Get()
  @ApiOperation({ summary: 'Verifica que la API responde correctamente' })
  @ApiOkResponse({
    description: 'Servicio operativo',
    schema: {
      example: {
        estado: 'ok',
        servicio: 'api',
        version: '0.1.0',
      },
    },
  })
  obtenerSalud(): RespuestaSaludApi {
    return this.saludServicio.obtenerSalud();
  }
}
