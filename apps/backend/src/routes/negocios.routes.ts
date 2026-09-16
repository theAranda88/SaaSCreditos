import { Module } from '@nestjs/common';
import { NegociosControlador } from '../controladores/negocios.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { AuthRoutes } from './auth.routes';
import { NegociosServicio } from '../servicios/negocios.servicio';

@Module({
  imports: [EntidadesModule, AuthRoutes],
  controllers: [NegociosControlador],
  providers: [NegociosServicio],
})
export class NegociosRoutes {}
