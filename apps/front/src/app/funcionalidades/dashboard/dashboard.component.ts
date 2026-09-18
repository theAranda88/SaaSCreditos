import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DashboardNegocio } from '@creditos/shared-types';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { fechaHoyIsoColombia } from '../../nucleo/utilidades/fecha-colombia';
import { infoDiaCalendario } from '../../nucleo/utilidades/dias-habiles-colombia';
import { DashboardServicio } from './dashboard.servicio';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>Dashboard operativo</h2>
          <p>Indicadores de recaudo y cartera del negocio.</p>
          @if (infoHoy(); as hoy) {
            @if (!hoy.esHabil) {
              <p class="aviso-dia">
                Hoy es <strong>{{ hoy.etiqueta }}</strong>: no hay jornada de cobro en campo.
              </p>
            }
          }
        </div>
        <a routerLink="/app/cartera" [queryParams]="{ segmento: 'mora' }" class="boton-secundario">
          Ver cartera en mora
        </a>
      </header>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (cargando()) {
        <p>Cargando indicadores…</p>
      } @else {
        @if (dashboard(); as datos) {
          <div class="tarjetas">
            <article>
              <span>Recaudo del día</span>
              <strong>{{ datos.recaudo_dia }}</strong>
              <small>{{ datos.fecha }}</small>
            </article>
            <article>
              <span>Cartera activa</span>
              <strong>{{ datos.cartera_activa }}</strong>
              <small>{{ datos.creditos_activos }} crédito(s)</small>
            </article>
            <article class="alerta">
              <span>Cartera en mora</span>
              <strong>{{ datos.cartera_mora }}</strong>
              <small>{{ datos.creditos_en_mora }} crédito(s)</small>
            </article>
            <article>
              <span>Cobradores activos</span>
              <strong>{{ datos.cobradores_activos }}</strong>
              <small>En operación</small>
            </article>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .pagina { display: grid; gap: 1.25rem; }
    .encabezado { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    h2 { margin: 0; }
    .aviso-dia { margin: 0.5rem 0 0; padding: 0.65rem 0.85rem; border-radius: 0.65rem; background: #fff7ed; color: #9a3412; }
    .tarjetas { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.85rem; }
    article { padding: 1rem; border-radius: 0.85rem; background: #ffffff; border: 1px solid #e5e7eb; display: grid; gap: 0.35rem; }
    article span { color: #64748b; font-size: 0.85rem; }
    article strong { font-size: 1.35rem; }
    article small { color: #94a3b8; font-size: 0.8rem; }
    .alerta { border-color: #fecaca; background: #fff1f2; }
    .boton-secundario { display: inline-flex; align-items: center; min-height: 2.75rem; padding: 0.65rem 1rem; border-radius: 0.65rem; border: 1px solid #d1d5db; color: #1d4ed8; text-decoration: none; font-weight: 600; }
    .error { color: #b91c1c; }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardServicio = inject(DashboardServicio);

  readonly dashboard = signal<DashboardNegocio | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly infoHoy = signal(infoDiaCalendario(fechaHoyIsoColombia()));

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.dashboardServicio.obtener().subscribe({
      next: (datos) => {
        this.dashboard.set(datos);
        this.infoHoy.set(infoDiaCalendario(datos.fecha));
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeErrorHttp(error, 'No se pudo cargar el dashboard.'));
      },
    });
  }
}
