import { Module } from '@nestjs/common';
import { PlataformaControlador } from '../controladores/plataforma.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { PlataformaServicio } from '../servicios/plataforma.servicio';
import { AuthRoutes } from './auth.routes';

@Module({
  imports: [EntidadesModule, AuthRoutes],
  controllers: [PlataformaControlador],
  providers: [PlataformaServicio],
})
export class PlataformaRoutes {}
