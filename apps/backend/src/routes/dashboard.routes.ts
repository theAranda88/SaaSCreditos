import { Module } from '@nestjs/common';
import { DashboardControlador } from '../controladores/dashboard.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { DashboardServicio } from '../servicios/dashboard.servicio';
import { AuthRoutes } from './auth.routes';

@Module({
  imports: [EntidadesModule, AuthRoutes],
  controllers: [DashboardControlador],
  providers: [DashboardServicio],
})
export class DashboardRoutes {}
