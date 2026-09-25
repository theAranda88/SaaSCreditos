import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ClientePerfil, CreditoPerfil, EstadoCredito } from '@creditos/shared-types';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { ClientesServicio } from '../clientes/clientes.servicio';
import { CreditosServicio } from './creditos.servicio';

@Component({
  selector: 'app-listado-creditos',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>Créditos</h2>
          <p>Alta de crédito y consulta del plan de cuotas. Las condiciones no se editan.</p>
        </div>
        <a routerLink="/app/creditos/nuevo" class="boton-primario">Nuevo crédito</a>
      </header>

      <form class="filtros" [formGroup]="filtros" (ngSubmit)="cargar()">
        <label>
          Cliente
          <select formControlName="clienteId">
            <option value="">Todos</option>
            @for (cliente of clientes(); track cliente.id) {
              <option [value]="cliente.id">{{ cliente.nombre_completo }}</option>
            }
          </select>
        </label>
        <label>
          Estado
          <select formControlName="estado">
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="pagado">Pagado</option>
            <option value="mora">Mora</option>
            <option value="anulado">Anulado</option>
            <option value="refinanciado">Refinanciado</option>
          </select>
        </label>
        <button type="submit" [disabled]="cargando()">Buscar</button>
      </form>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (cargando()) {
        <p>Cargando créditos…</p>
      } @else if (creditos().length === 0) {
        <p class="vacio">No hay créditos para mostrar.</p>
      } @else {
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Principal</th>
                <th>Cuotas</th>
                <th>Desembolso</th>
                <th>Estado</th>
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
                    <span class="estado">{{ credito.estado }}</span>
                  </td>
                  <td class="acciones">
                    <a [routerLink]="['/app/creditos', credito.id]">Ver plan</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: `
    .pagina { display: grid; gap: 1.25rem; }
    .encabezado { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    h2 { margin: 0; }
    .encabezado p, .vacio { margin: 0.35rem 0 0; color: #64748b; }
    .filtros { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; padding: 1rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    label { display: grid; gap: 0.35rem; font-size: 0.85rem; font-weight: 600; }
    input, select { padding: 0.45rem 0.65rem; border-radius: 0.5rem; font-size: 0.875rem; border: 1px solid #d1d5db; }
    .filtros button, .boton-primario { border: none; background: #1d4ed8; color: #ffffff; text-decoration: none; cursor: pointer; }
    .boton-primario { display: inline-flex; align-items: center; }
    .tabla-contenedor { overflow-x: auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .estado { text-transform: capitalize; color: #166534; }
    .acciones a { color: #1d4ed8; }
    .error { color: #b91c1c; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
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
        this.error.set(mensajeErrorHttp(error, 'No se pudieron cargar los clientes.'));
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
          this.error.set(mensajeErrorHttp(error, 'No se pudieron cargar los créditos.'));
        },
      });
  }

  nombreCliente(clienteId: string): string {
    return this.clientes().find((cliente) => cliente.id === clienteId)?.nombre_completo ?? clienteId;
  }
}
