import { Module } from '@nestjs/common';
import { PlanesControlador } from '../controladores/planes.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { PlanesServicio } from '../servicios/planes.servicio';
import { AuthRoutes } from './auth.routes';

@Module({
  imports: [EntidadesModule, AuthRoutes],
  controllers: [PlanesControlador],
  providers: [PlanesServicio],
})
export class PlanesRoutes {}
