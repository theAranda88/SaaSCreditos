import { Module } from '@nestjs/common';
import { CreditosControlador } from '../controladores/creditos.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { CreditosServicio } from '../servicios/creditos.servicio';
import { AuthRoutes } from './auth.routes';

@Module({
  imports: [EntidadesModule, AuthRoutes],
  controllers: [CreditosControlador],
  providers: [CreditosServicio],
})
export class CreditosRoutes {}
