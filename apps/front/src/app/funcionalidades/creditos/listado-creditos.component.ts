import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { ClientePerfil, EstadoCredito } from '@creditos/shared-types';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { ClientesServicio } from '../clientes/clientes.servicio';
import { CreditosServicio, type CreditoEnriquecido } from './creditos.servicio';

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
                <th>{{ 'creditos.listado.columna_cliente' | translate }}</th>
                <th>{{ 'creditos.listado.columna_direccion' | translate }}</th>
                <th>{{ 'creditos.listado.columna_barrio' | translate }}</th>
                <th>{{ 'creditos.listado.columna_principal' | translate }}</th>
                <th>{{ 'creditos.listado.columna_modalidad' | translate }}</th>
                <th>{{ 'creditos.listado.columna_cobrador' | translate }}</th>
                <th>{{ 'comun.filtros.estado' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (credito of creditos(); track credito.id) {
                <tr>
                  <td>{{ credito.cliente_nombre_completo }}</td>
                  <td>{{ credito.cliente_direccion }}</td>
                  <td>{{ credito.cliente_barrio }}</td>
                  <td>{{ credito.monto_principal }}</td>
                  <td>{{ credito.numero_cuotas }} · {{ ('creditos.modalidades.' + credito.periodicidad) | translate }}</td>
                  <td>{{ credito.cobrador_nombre ?? ('creditos.listado.sin_asignar' | translate) }}</td>
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
  private readonly formBuilder = inject(FormBuilder);

  readonly creditos = signal<CreditoEnriquecido[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly filtros = this.formBuilder.nonNullable.group({
    estado: [''],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const { estado } = this.filtros.getRawValue();

    this.creditosServicio
      .listarEnriquecido({
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
}
