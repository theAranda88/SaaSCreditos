import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type {
  AsignacionPerfil,
  CobradorPerfil,
  EstadoAsignacion,
} from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { ROLES_ADMINISTRACION_NEGOCIO } from '../../nucleo/auth/roles-negocio';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { CobradoresServicio } from '../cobradores/cobradores.servicio';
import { AsignacionesServicio } from './asignaciones.servicio';

@Component({
  selector: 'app-listado-asignaciones',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>
            {{
              (puedeAdministrar() ? 'asignaciones.listado.titulo_admin' : 'asignaciones.listado.titulo_cobrador')
                | translate
            }}
          </h2>
          <p>
            @if (puedeAdministrar()) {
              {{ 'asignaciones.listado.subtitulo_admin' | translate }}
            } @else {
              {{ 'asignaciones.listado.subtitulo_cobrador' | translate }}
            }
          </p>
        </div>
        @if (puedeAdministrar()) {
          <a routerLink="/app/asignaciones/nueva" class="boton-primario">{{
            'asignaciones.listado.asignar' | translate
          }}</a>
        } @else {
          <a routerLink="/app/cobros" class="boton-primario">{{ 'asignaciones.listado.ir_cobros' | translate }}</a>
        }
      </header>

      @if (puedeAdministrar()) {
        <form class="filtros" [formGroup]="filtros" (ngSubmit)="cargar()">
          <label>
            {{ 'comun.filtros.cobrador' | translate }}
            <select formControlName="cobradorId">
              <option value="">{{ 'comun.filtros.todos' | translate }}</option>
              @for (cobrador of cobradores(); track cobrador.id) {
                <option [value]="cobrador.id">{{ cobrador.nombre }}</option>
              }
            </select>
          </label>
          <label>
            {{ 'comun.filtros.estado' | translate }}
            <select formControlName="estado">
              <option value="">{{ 'comun.filtros.todos' | translate }}</option>
              <option value="activa">{{ 'comun.estados.activa' | translate }}</option>
              <option value="finalizada">{{ 'comun.estados.finalizada' | translate }}</option>
            </select>
          </label>
          <button type="submit" [disabled]="cargando()">{{ 'comun.acciones.buscar' | translate }}</button>
        </form>
      }

      @if (error(); as claveError) {
        <p class="error">{{ claveError | translate }}</p>
      }

      @if (cargando()) {
        <p>{{ 'comun.carga.cartera' | translate }}</p>
      } @else if (asignaciones().length === 0) {
        <p class="vacio">{{ 'asignaciones.listado.vacio' | translate }}</p>
      } @else {
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>{{ 'comun.filtros.cliente' | translate }}</th>
                <th>{{ 'creditos.listado.columna_principal' | translate }}</th>
                <th>{{ 'asignaciones.listado.columna_estado_credito' | translate }}</th>
                @if (puedeAdministrar()) {
                  <th>{{ 'comun.filtros.cobrador' | translate }}</th>
                }
                <th>{{ 'asignaciones.listado.columna_asignacion' | translate }}</th>
                <th>{{ 'asignaciones.listado.columna_desde' | translate }}</th>
                @if (!puedeAdministrar()) {
                  <th>{{ 'asignaciones.listado.columna_accion' | translate }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (asignacion of asignaciones(); track asignacion.id) {
                <tr>
                  <td>{{ asignacion.credito.cliente_nombre_completo }}</td>
                  <td>{{ asignacion.credito.monto_principal }}</td>
                  <td>{{ ('comun.estados.' + asignacion.credito.estado) | translate }}</td>
                  @if (puedeAdministrar()) {
                    <td>{{ nombreCobrador(asignacion.cobrador_id) }}</td>
                  }
                  <td>
                    <span class="estado">{{ ('comun.estados.' + asignacion.estado) | translate }}</span>
                  </td>
                  <td>{{ fechaCorta(asignacion.fecha_asignacion) }}</td>
                  @if (!puedeAdministrar()) {
                    <td>
                      <a
                        class="boton-tabla"
                        [routerLink]="['/app/cobros']"
                        [queryParams]="{ creditoId: asignacion.credito_id }"
                      >
                        {{ 'asignaciones.listado.revisar_cobro' | translate }}
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
  styleUrl: './listado-asignaciones.component.scss',
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
          this.error.set(claveMensajeErrorHttp(error, 'errores.asignaciones.carga_cobradores'));
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
          this.error.set(claveMensajeErrorHttp(error, 'errores.asignaciones.carga_listado'));
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
