import { Module } from '@nestjs/common';
import { CobradoresControlador } from '../controladores/cobradores.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { CupoPlanServicio } from '../servicios/cupo-plan.servicio';
import { CobradoresServicio } from '../servicios/cobradores.servicio';
import { AuthRoutes } from './auth.routes';

@Module({
  imports: [EntidadesModule, AuthRoutes],
  controllers: [CobradoresControlador],
  providers: [CobradoresServicio, CupoPlanServicio],
})
export class CobradoresRoutes {}
