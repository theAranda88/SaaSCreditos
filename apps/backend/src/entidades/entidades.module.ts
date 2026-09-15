import { Module } from '@nestjs/common';
import { BdModule } from '../bd/bd.module';
import { PlanRepositorio } from '../entidades/plan.repositorio';

/**
 * Módulo de acceso a datos compartido por rutas que consultan PostgreSQL.
 * Importar desde routes de dominio (auth, clientes, planes, etc.).
 */
@Module({
  imports: [BdModule],
  providers: [PlanRepositorio],
  exports: [PlanRepositorio, BdModule],
})
export class EntidadesModule {}
