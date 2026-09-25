import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { ClientePerfil, CreditoPerfil, EstadoCredito } from '@creditos/shared-types';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { ClientesServicio } from '../clientes/clientes.servicio';
import { CreditosServicio } from './creditos.servicio';

@Component({
  selector: 'app-listado-creditos',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>{{ 'creditos.listado.titulo' | translate }}</h2>
          <p>{{ 'creditos.listado.subtitulo' | translate }}</p>
        </div>
        <a routerLink="/app/creditos/nuevo" class="boton-primario">{{ 'creditos.listado.nuevo' | translate }}</a>
      </header>

      <form class="filtros" [formGroup]="filtros" (ngSubmit)="cargar()">
        <label>
          {{ 'comun.filtros.cliente' | translate }}
          <select formControlName="clienteId">
            <option value="">{{ 'comun.filtros.todos' | translate }}</option>
            @for (cliente of clientes(); track cliente.id) {
              <option [value]="cliente.id">{{ cliente.nombre_completo }}</option>
            }
          </select>
        </label>
        <label>
          {{ 'comun.filtros.estado' | translate }}
          <select formControlName="estado">
            <option value="">{{ 'comun.filtros.todos' | translate }}</option>
            <option value="activo">{{ 'comun.estados.activo' | translate }}</option>
            <option value="pagado">{{ 'comun.estados.pagado' | translate }}</option>
            <option value="mora">{{ 'comun.estados.mora' | translate }}</option>
            <option value="anulado">{{ 'comun.estados.anulado' | translate }}</option>
            <option value="refinanciado">{{ 'comun.estados.refinanciado' | translate }}</option>
          </select>
        </label>
        <button type="submit" [disabled]="cargando()">{{ 'comun.acciones.buscar' | translate }}</button>
      </form>

      @if (error(); as claveError) {
        <p class="error">{{ claveError | translate }}</p>
      }

      @if (cargando()) {
        <p>{{ 'comun.carga.creditos' | translate }}</p>
      } @else if (creditos().length === 0) {
        <p class="vacio">{{ 'creditos.listado.vacio' | translate }}</p>
      } @else {
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>{{ 'comun.filtros.cliente' | translate }}</th>
                <th>{{ 'creditos.listado.columna_principal' | translate }}</th>
                <th>{{ 'creditos.listado.columna_cuotas' | translate }}</th>
                <th>{{ 'creditos.listado.columna_desembolso' | translate }}</th>
                <th>{{ 'comun.filtros.estado' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (credito of creditos(); track credito.id) {
                <tr>
                  <td>{{ nombreCliente(credito.cliente_id) }}</td>
                  <td>{{ credito.monto_principal }}</td>
                  <td>{{ credito.numero_cuotas }} · {{ credito.periodicidad }}</td>
                  <td>{{ credito.fecha_desembolso }}</td>
                  <td>
                    <span class="estado">{{ ('comun.estados.' + credito.estado) | translate }}</span>
                  </td>
                  <td class="acciones">
                    <a [routerLink]="['/app/creditos', credito.id]">{{ 'creditos.listado.ver_plan' | translate }}</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class ListadoCreditosComponent implements OnInit {
  private readonly creditosServicio = inject(CreditosServicio);
  private readonly clientesServicio = inject(ClientesServicio);
  private readonly formBuilder = inject(FormBuilder);

  readonly creditos = signal<CreditoPerfil[]>([]);
  readonly clientes = signal<ClientePerfil[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly filtros = this.formBuilder.nonNullable.group({
    clienteId: [''],
    estado: [''],
  });

  ngOnInit(): void {
    this.clientesServicio.listar().subscribe({
      next: (clientes) => this.clientes.set(clientes),
      error: (error: unknown) => {
        this.error.set(claveMensajeErrorHttp(error, 'errores.creditos.carga_clientes_filtro'));
      },
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const { clienteId, estado } = this.filtros.getRawValue();

    this.creditosServicio
      .listar({
        ...(clienteId && { clienteId }),
        ...(estado && { estado: estado as EstadoCredito }),
      })
      .subscribe({
        next: (creditos) => {
          this.creditos.set(creditos);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.cargando.set(false);
          this.error.set(claveMensajeErrorHttp(error, 'errores.creditos.carga_listado'));
        },
      });
  }

  nombreCliente(clienteId: string): string {
    return this.clientes().find((cliente) => cliente.id === clienteId)?.nombre_completo ?? clienteId;
  }
}
