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
import { PlanesRoutes } from './planes.routes';
import { SuscripcionesRoutes } from './suscripciones.routes';
import { PlataformaRoutes } from './plataforma.routes';
import { SaludRoutes } from './salud.routes';

@Module({
  imports: [
    SaludRoutes,
    AuthRoutes,
    NegociosRoutes,
    PlanesRoutes,
    SuscripcionesRoutes,
    PlataformaRoutes,
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
