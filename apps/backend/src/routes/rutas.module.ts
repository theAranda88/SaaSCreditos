import { Module } from '@nestjs/common';
import { AuthRoutes } from './auth.routes';
import { ClientesRoutes } from './clientes.routes';
import { CobradoresRoutes } from './cobradores.routes';
import { NegociosRoutes } from './negocios.routes';
import { SaludRoutes } from './salud.routes';

@Module({
  imports: [SaludRoutes, AuthRoutes, NegociosRoutes, ClientesRoutes, CobradoresRoutes],
})
export class RutasModule {}
