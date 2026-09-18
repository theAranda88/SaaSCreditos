import { Module } from '@nestjs/common';
import { AuthRoutes } from './auth.routes';
import { ClientesRoutes } from './clientes.routes';
import { CobradoresRoutes } from './cobradores.routes';
import { AsignacionesRoutes } from './asignaciones.routes';
import { CreditosRoutes } from './creditos.routes';
import { PagosRoutes } from './pagos.routes';
import { NegociosRoutes } from './negocios.routes';
import { SaludRoutes } from './salud.routes';

@Module({
  imports: [
    SaludRoutes,
    AuthRoutes,
    NegociosRoutes,
    ClientesRoutes,
    CobradoresRoutes,
    CreditosRoutes,
    AsignacionesRoutes,
    PagosRoutes,
  ],
})
export class RutasModule {}
