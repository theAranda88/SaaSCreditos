import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { CobradorPerfil, ItemCartera, SegmentoCartera } from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { ROLES_ADMINISTRACION_NEGOCIO } from '../../nucleo/auth/roles-negocio';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { CobradoresServicio } from '../cobradores/cobradores.servicio';
import { CarteraServicio } from './cartera.servicio';

const SEGMENTOS: SegmentoCartera[] = ['vigente', 'mora', 'pagada'];

@Component({
  selector: 'app-listado-cartera',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>Control de cartera</h2>
          <p>Consulte cartera vigente, en mora y pagada sin recalcular en el cliente.</p>
        </div>
        @if (puedeAdministrar()) {
          <button
            type="button"
            class="boton-primario"
            (click)="aplicarMora()"
            [disabled]="aplicandoMora()"
          >
            Aplicar mora
          </button>
        }
      </header>

      <form class="filtros" [formGroup]="filtros" (ngSubmit)="cargar()">
        <label>
          Segmento
          <select formControlName="segmento">
            @for (segmento of segmentos; track segmento) {
              <option [value]="segmento">{{ etiquetaSegmento(segmento) }}</option>
            }
          </select>
        </label>
        @if (puedeAdministrar()) {
          <label>
            Cobrador
            <select formControlName="cobradorId">
              <option value="">Todos</option>
              @for (cobrador of cobradores(); track cobrador.id) {
                <option [value]="cobrador.id">{{ cobrador.nombre }}</option>
              }
            </select>
          </label>
        }
        <button type="submit" [disabled]="cargando()">Buscar</button>
      </form>

      @if (mensajeMora()) {
        <p class="aviso">{{ mensajeMora() }}</p>
      }

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (cargando()) {
        <p>Cargando cartera…</p>
      } @else if (items().length === 0) {
        <p class="vacio">No hay créditos en este segmento.</p>
      } @else {
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Saldo pendiente</th>
                <th>Cuotas mora</th>
                @if (puedeAdministrar()) {
                  <th>Cobrador</th>
                }
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.credito_id) {
                <tr [class.fila-mora]="item.cuotas_en_mora > 0">
                  <td>{{ item.cliente_nombre_completo }}</td>
                  <td>
                    <span class="etiqueta estado-{{ item.estado_credito }}">{{ item.estado_credito }}</span>
                  </td>
                  <td>{{ item.saldo_pendiente }}</td>
                  <td>{{ item.cuotas_en_mora }}</td>
                  @if (puedeAdministrar()) {
                    <td>{{ item.cobrador_nombre ?? 'Sin asignar' }}</td>
                  }
                  <td>
                    <a [routerLink]="['/app/creditos', item.credito_id]">Ver crédito</a>
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
    .pagina { display: grid; gap: 1rem; }
    .encabezado { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    h2 { margin: 0; }
    .filtros { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end; }
    label { display: grid; gap: 0.35rem; font-weight: 600; font-size: 0.9rem; }
    select, button { padding: 0.45rem 0.65rem; border-radius: 0.5rem; font-size: 0.875rem; border: 1px solid #d1d5db; }
    .boton-primario { border: none; background: #1d4ed8; color: #ffffff; cursor: pointer; }
    .tabla-contenedor { overflow-x: auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .fila-mora { background: #fff7ed; }
    .etiqueta { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.75rem; text-transform: capitalize; }
    .estado-activo { background: #ecfdf5; color: #166534; }
    .estado-mora { background: #fee2e2; color: #b91c1c; }
    .estado-pagado { background: #dbeafe; color: #1d4ed8; }
    .aviso { margin: 0; padding: 1rem; border-radius: 0.75rem; background: #eff6ff; color: #1d4ed8; }
    .vacio, .error { margin: 0; }
    .error { color: #b91c1c; }
    a { color: #1d4ed8; font-weight: 600; text-decoration: none; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `,
})
export class ListadoCarteraComponent implements OnInit {
  private readonly carteraServicio = inject(CarteraServicio);
  private readonly cobradoresServicio = inject(CobradoresServicio);
  private readonly authServicio = inject(AuthServicio);
  private readonly formBuilder = inject(FormBuilder);

  readonly segmentos = SEGMENTOS;
  readonly items = signal<ItemCartera[]>([]);
  readonly cobradores = signal<CobradorPerfil[]>([]);
  readonly cargando = signal(false);
  readonly aplicandoMora = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensajeMora = signal<string | null>(null);

  readonly filtros = this.formBuilder.nonNullable.group({
    segmento: ['vigente' as SegmentoCartera],
    cobradorId: [''],
  });

  readonly puedeAdministrar = computed(() => {
    const rol = this.authServicio.perfilActual()?.rol;
    return rol !== undefined && ROLES_ADMINISTRACION_NEGOCIO.includes(rol);
  });

  ngOnInit(): void {
    if (this.puedeAdministrar()) {
      this.cobradoresServicio.listar({ estado: 'activo' }).subscribe({
        next: (cobradores) => this.cobradores.set(cobradores),
        error: () => this.cobradores.set([]),
      });
    }

    this.cargar();
  }

  cargar(): void {
    const { segmento, cobradorId } = this.filtros.getRawValue();
    this.cargando.set(true);
    this.error.set(null);

    this.carteraServicio
      .listar({
        segmento,
        cobradorId: cobradorId || undefined,
      })
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.cargando.set(false);
          this.error.set(mensajeErrorHttp(error, 'No se pudo cargar la cartera.'));
        },
      });
  }

  aplicarMora(): void {
    this.aplicandoMora.set(true);
    this.mensajeMora.set(null);
    this.error.set(null);

    this.carteraServicio.aplicarMora().subscribe({
      next: (resultado) => {
        this.aplicandoMora.set(false);
        this.mensajeMora.set(
          `Mora aplicada: ${resultado.cuotas_actualizadas} cuota(s), ${resultado.creditos_actualizados} crédito(s).`,
        );
        this.filtros.patchValue({ segmento: 'mora' });
        this.cargar();
      },
      error: (error: unknown) => {
        this.aplicandoMora.set(false);
        this.error.set(mensajeErrorHttp(error, 'No se pudo aplicar la mora.'));
      },
    });
  }

  etiquetaSegmento(segmento: SegmentoCartera): string {
    switch (segmento) {
      case 'vigente':
        return 'Vigente';
      case 'mora':
        return 'En mora';
      case 'pagada':
        return 'Pagada';
    }
  }
}
