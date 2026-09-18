import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  AsignacionPerfil,
  CobradorPerfil,
  EstadoAsignacion,
} from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { ROLES_ADMINISTRACION_NEGOCIO } from '../../nucleo/auth/roles-negocio';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { CobradoresServicio } from '../cobradores/cobradores.servicio';
import { AsignacionesServicio } from './asignaciones.servicio';

@Component({
  selector: 'app-listado-asignaciones',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>{{ puedeAdministrar() ? 'Asignación de cartera' : 'Mi cartera' }}</h2>
          <p>
            @if (puedeAdministrar()) {
              Un crédito activo o en mora tiene un cobrador responsable. Reasignar cierra la previa.
            } @else {
              Revise y confirme cada cobro desde <strong>Cobros del día</strong> o use el botón de cada fila.
            }
          </p>
        </div>
        @if (puedeAdministrar()) {
          <a routerLink="/app/asignaciones/nueva" class="boton-primario">Asignar cartera</a>
        } @else {
          <a routerLink="/app/cobros" class="boton-primario">Ir a cobros del día</a>
        }
      </header>

      @if (puedeAdministrar()) {
        <form class="filtros" [formGroup]="filtros" (ngSubmit)="cargar()">
          <label>
            Cobrador
            <select formControlName="cobradorId">
              <option value="">Todos</option>
              @for (cobrador of cobradores(); track cobrador.id) {
                <option [value]="cobrador.id">{{ cobrador.nombre }}</option>
              }
            </select>
          </label>
          <label>
            Estado
            <select formControlName="estado">
              <option value="">Todos</option>
              <option value="activa">Activa</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </label>
          <button type="submit" [disabled]="cargando()">Buscar</button>
        </form>
      }

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (cargando()) {
        <p>Cargando cartera…</p>
      } @else if (asignaciones().length === 0) {
        <p class="vacio">No hay asignaciones para mostrar.</p>
      } @else {
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Principal</th>
                <th>Estado crédito</th>
                @if (puedeAdministrar()) {
                  <th>Cobrador</th>
                }
                <th>Asignación</th>
                <th>Desde</th>
                @if (!puedeAdministrar()) {
                  <th>Acción</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (asignacion of asignaciones(); track asignacion.id) {
                <tr>
                  <td>{{ asignacion.credito.cliente_nombre_completo }}</td>
                  <td>{{ asignacion.credito.monto_principal }}</td>
                  <td>{{ asignacion.credito.estado }}</td>
                  @if (puedeAdministrar()) {
                    <td>{{ nombreCobrador(asignacion.cobrador_id) }}</td>
                  }
                  <td>
                    <span class="estado">{{ asignacion.estado }}</span>
                  </td>
                  <td>{{ fechaCorta(asignacion.fecha_asignacion) }}</td>
                  @if (!puedeAdministrar()) {
                    <td>
                      <a
                        class="boton-tabla"
                        [routerLink]="['/app/cobros']"
                        [queryParams]="{ creditoId: asignacion.credito_id }"
                      >
                        Revisar cobro
                      </a>
                    </td>
                  }
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
    select, button, .boton-primario { padding: 0.65rem 0.8rem; border-radius: 0.5rem; font-size: 0.95rem; }
    select { border: 1px solid #d1d5db; }
    .filtros button, .boton-primario, .boton-tabla { border: none; background: #1d4ed8; color: #ffffff; font-weight: 600; text-decoration: none; cursor: pointer; }
    .boton-primario, .boton-tabla { display: inline-flex; align-items: center; justify-content: center; }
    .boton-tabla { padding: 0.55rem 0.75rem; border-radius: 0.5rem; font-size: 0.85rem; white-space: nowrap; }
    .tabla-contenedor { overflow-x: auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .estado { text-transform: capitalize; color: #166534; }
    .error { color: #b91c1c; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `,
})
export class ListadoAsignacionesComponent implements OnInit {
  private readonly asignacionesServicio = inject(AsignacionesServicio);
  private readonly cobradoresServicio = inject(CobradoresServicio);
  private readonly authServicio = inject(AuthServicio);
  private readonly formBuilder = inject(FormBuilder);

  readonly asignaciones = signal<AsignacionPerfil[]>([]);
  readonly cobradores = signal<CobradorPerfil[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly puedeAdministrar = computed(() => {
    const rol = this.authServicio.perfilActual()?.rol;
    return rol !== undefined && ROLES_ADMINISTRACION_NEGOCIO.includes(rol);
  });

  readonly filtros = this.formBuilder.nonNullable.group({
    cobradorId: [''],
    estado: ['activa'],
  });

  ngOnInit(): void {
    if (this.puedeAdministrar()) {
      this.cobradoresServicio.listar({ estado: 'activo' }).subscribe({
        next: (cobradores) => this.cobradores.set(cobradores),
        error: (error: unknown) => {
          this.error.set(mensajeErrorHttp(error, 'No se pudieron cargar los cobradores.'));
        },
      });
    }

    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const { cobradorId, estado } = this.filtros.getRawValue();

    this.asignacionesServicio
      .listar(
        this.puedeAdministrar()
          ? {
              ...(cobradorId && { cobradorId }),
              ...(estado && { estado: estado as EstadoAsignacion }),
            }
          : {},
      )
      .subscribe({
        next: (asignaciones) => {
          this.asignaciones.set(asignaciones);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.cargando.set(false);
          this.error.set(mensajeErrorHttp(error, 'No se pudo cargar la cartera.'));
        },
      });
  }

  nombreCobrador(cobradorId: string): string {
    return this.cobradores().find((cobrador) => cobrador.id === cobradorId)?.nombre ?? cobradorId;
  }

  fechaCorta(valor: string): string {
    return valor.slice(0, 10);
  }
}
