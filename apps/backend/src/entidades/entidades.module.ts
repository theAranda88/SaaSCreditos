import { Module } from '@nestjs/common';
import { BdModule } from '../bd/bd.module';
import { NegocioRepositorio } from '../entidades/negocio.repositorio';
import { PlanRepositorio } from '../entidades/plan.repositorio';
import { UsuarioRepositorio } from '../entidades/usuario.repositorio';

/**
 * Módulo de acceso a datos compartido por rutas que consultan PostgreSQL.
 * Importar desde routes de dominio (auth, clientes, planes, etc.).
 */
@Module({
  imports: [BdModule],
  providers: [PlanRepositorio, UsuarioRepositorio, NegocioRepositorio],
  exports: [PlanRepositorio, UsuarioRepositorio, NegocioRepositorio, BdModule],
})
export class EntidadesModule {}
