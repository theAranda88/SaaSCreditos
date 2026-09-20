import { Module } from '@nestjs/common';
import { SuscripcionesControlador } from '../controladores/suscripciones.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { CupoPlanServicio } from '../servicios/cupo-plan.servicio';
import { SuscripcionesServicio } from '../servicios/suscripciones.servicio';
import { AuthRoutes } from './auth.routes';

@Module({
  imports: [EntidadesModule, AuthRoutes],
  controllers: [SuscripcionesControlador],
  providers: [SuscripcionesServicio, CupoPlanServicio],
})
export class SuscripcionesRoutes {}
