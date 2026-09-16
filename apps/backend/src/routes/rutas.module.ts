import { Module } from '@nestjs/common';
import { AuthRoutes } from './auth.routes';
import { ClientesRoutes } from './clientes.routes';
import { NegociosRoutes } from './negocios.routes';
import { SaludRoutes } from './salud.routes';

@Module({
  imports: [SaludRoutes, AuthRoutes, NegociosRoutes, ClientesRoutes],
})
export class RutasModule {}
