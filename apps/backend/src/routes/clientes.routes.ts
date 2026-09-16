import { Module } from '@nestjs/common';
import { ClientesControlador } from '../controladores/clientes.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { AuthRoutes } from './auth.routes';
import { ClientesServicio } from '../servicios/clientes.servicio';

@Module({
  imports: [EntidadesModule, AuthRoutes],
  controllers: [ClientesControlador],
  providers: [ClientesServicio],
})
export class ClientesRoutes {}
