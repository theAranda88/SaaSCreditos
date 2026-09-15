import { Module } from '@nestjs/common';
import { SaludControlador } from '../controladores/salud.controlador';
import { SaludServicio } from '../servicios/salud.servicio';

@Module({
  controllers: [SaludControlador],
  providers: [SaludServicio],
})
export class SaludRoutes {}
