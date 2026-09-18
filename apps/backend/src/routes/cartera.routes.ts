import { Module } from '@nestjs/common';
import { CarteraControlador } from '../controladores/cartera.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { CarteraServicio } from '../servicios/cartera.servicio';
import { AuthRoutes } from './auth.routes';

@Module({
  imports: [EntidadesModule, AuthRoutes],
  controllers: [CarteraControlador],
  providers: [CarteraServicio],
})
export class CarteraRoutes {}
