import { Module } from '@nestjs/common';
import { AuthRoutes } from './auth.routes';
import { ClientesRoutes } from './clientes.routes';
import { CobradoresRoutes } from './cobradores.routes';
import { AsignacionesRoutes } from './asignaciones.routes';
import { CreditosRoutes } from './creditos.routes';
import { PagosRoutes } from './pagos.routes';
import { CarteraRoutes } from './cartera.routes';
import { DashboardRoutes } from './dashboard.routes';
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
    CarteraRoutes,
    DashboardRoutes,
  ],
})
export class RutasModule {}
