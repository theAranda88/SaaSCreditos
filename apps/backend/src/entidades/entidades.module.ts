import { Module } from '@nestjs/common';
import { BdModule } from '../bd/bd.module';
import { AsignacionRepositorio } from '../entidades/asignacion.repositorio';
import { CarteraRepositorio } from '../entidades/cartera.repositorio';
import { PagoRepositorio } from '../entidades/pago.repositorio';
import { ClienteRepositorio } from '../entidades/cliente.repositorio';
import { CreditoRepositorio } from '../entidades/credito.repositorio';
import { NegocioRepositorio } from '../entidades/negocio.repositorio';
import { PlanRepositorio } from '../entidades/plan.repositorio';
import { UsuarioRepositorio } from '../entidades/usuario.repositorio';

/**
 * Módulo de acceso a datos compartido por rutas que consultan PostgreSQL.
 * Importar desde routes de dominio (auth, clientes, planes, etc.).
 */
@Module({
  imports: [BdModule],
  providers: [
    PlanRepositorio,
    UsuarioRepositorio,
    NegocioRepositorio,
    ClienteRepositorio,
    CreditoRepositorio,
    AsignacionRepositorio,
    CarteraRepositorio,
    PagoRepositorio,
  ],
  exports: [
    PlanRepositorio,
    UsuarioRepositorio,
    NegocioRepositorio,
    ClienteRepositorio,
    CreditoRepositorio,
    AsignacionRepositorio,
    CarteraRepositorio,
    PagoRepositorio,
    BdModule,
  ],
})
export class EntidadesModule {}
