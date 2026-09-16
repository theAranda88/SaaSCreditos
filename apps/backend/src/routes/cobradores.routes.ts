import { Module } from '@nestjs/common';
import { CobradoresControlador } from '../controladores/cobradores.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { CobradoresServicio } from '../servicios/cobradores.servicio';
import { AuthRoutes } from './auth.routes';

@Module({
  imports: [EntidadesModule, AuthRoutes],
  controllers: [CobradoresControlador],
  providers: [CobradoresServicio],
})
export class CobradoresRoutes {}
