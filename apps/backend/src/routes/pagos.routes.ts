import { Module } from '@nestjs/common';
import { PagosControlador } from '../controladores/pagos.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { PagosServicio } from '../servicios/pagos.servicio';
import { AuthRoutes } from './auth.routes';

@Module({
  imports: [EntidadesModule, AuthRoutes],
  controllers: [PagosControlador],
  providers: [PagosServicio],
})
export class PagosRoutes {}
