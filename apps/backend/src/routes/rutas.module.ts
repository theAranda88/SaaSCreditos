import { Module } from '@nestjs/common';
import { AuthRoutes } from './auth.routes';
import { NegociosRoutes } from './negocios.routes';
import { SaludRoutes } from './salud.routes';

@Module({
  imports: [SaludRoutes, AuthRoutes, NegociosRoutes],
})
export class RutasModule {}
