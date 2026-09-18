import { Module } from '@nestjs/common';
import { AsignacionesControlador } from '../controladores/asignaciones.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { AsignacionesServicio } from '../servicios/asignaciones.servicio';
import { AuthRoutes } from './auth.routes';

@Module({
  imports: [EntidadesModule, AuthRoutes],
  controllers: [AsignacionesControlador],
  providers: [AsignacionesServicio],
})
export class AsignacionesRoutes {}
