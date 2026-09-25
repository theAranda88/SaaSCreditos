import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DashboardNegocio } from '@creditos/shared-types';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { fechaHoyIsoColombia } from '../../nucleo/utilidades/fecha-colombia';
import { infoDiaCalendario } from '../../nucleo/utilidades/dias-habiles-colombia';
import { DashboardServicio } from './dashboard.servicio';

function montoANumero(valor: string): number {
  const parseado = Number.parseFloat(valor);
  return Number.isFinite(parseado) ? parseado : 0;
}

@Component({
  selector: 'app-panel-indicadores-negocio',
  imports: [RouterLink],
  template: `
    <section class="panel-indicadores" aria-label="Indicadores operativos">
      <header class="encabezado-panel">
        <div>
          <h2>Resumen del negocio</h2>
          <p>Recaudo, cartera y operación en campo.</p>
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
        <p class="estado-carga">Cargando indicadores…</p>
      } @else {
        @if (dashboard(); as datos) {
        <div class="kpi-destacado">
          <span>Recaudo del día</span>
          <strong>{{ datos.recaudo_dia }}</strong>
          <small>Fecha {{ datos.fecha }}</small>
        </div>

        <div class="rejilla-kpi">
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

        <div class="graficos">
          <article class="grafico-barras">
            <h3>Composición de cartera</h3>
            <div
              class="barra-apilada"
              role="img"
              [attr.aria-label]="
                'Activa ' + porcentajeActiva() + ' por ciento, mora ' + porcentajeMora() + ' por ciento'
              "
            >
              <span
                class="segmento activa"
                [style.flex-grow]="porcentajeActiva()"
                [title]="'Cartera activa ' + porcentajeActiva() + '%'"
              ></span>
              <span
                class="segmento mora"
                [style.flex-grow]="porcentajeMora()"
                [title]="'Cartera en mora ' + porcentajeMora() + '%'"
              ></span>
            </div>
            <ul class="leyenda">
              <li><span class="muestra activa"></span> Activa ({{ porcentajeActiva() }}%)</li>
              <li><span class="muestra mora"></span> Mora ({{ porcentajeMora() }}%)</li>
            </ul>
          </article>

          <article class="grafico-creditos">
            <h3>Créditos por estado</h3>
            <div class="barras-verticales">
              <div class="columna">
                <div class="barra" [style.height.%]="alturaBarraCreditosActivos()"></div>
                <span>Activos</span>
                <strong>{{ datos.creditos_activos }}</strong>
              </div>
              <div class="columna alerta">
                <div class="barra" [style.height.%]="alturaBarraCreditosMora()"></div>
                <span>En mora</span>
                <strong>{{ datos.creditos_en_mora }}</strong>
              </div>
            </div>
          </article>
        </div>
        }
      }
    </section>
  `,
  styles: `
    .panel-indicadores { display: grid; gap: 1rem; }
    .encabezado-panel { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; align-items: flex-start; }
    h2, h3 { margin: 0; font-size: 1.1rem; }
    .encabezado-panel p { margin: 0.25rem 0 0; color: #64748b; font-size: 0.875rem; }
    .aviso-dia { margin: 0.5rem 0 0; padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: #fff7ed; color: #9a3412; font-size: 0.85rem; }
    .kpi-destacado {
      padding: 1rem 1.1rem;
      border-radius: 0.75rem;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid #bfdbfe;
      display: grid;
      gap: 0.25rem;
    }
    .kpi-destacado span { color: #1e40af; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi-destacado strong { font-size: 1.75rem; color: #1e3a8a; }
    .kpi-destacado small { color: #64748b; }
    .rejilla-kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.65rem; }
    .rejilla-kpi article {
      padding: 0.85rem;
      border-radius: 0.65rem;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      display: grid;
      gap: 0.25rem;
    }
    .rejilla-kpi span { color: #64748b; font-size: 0.8rem; }
    .rejilla-kpi strong { font-size: 1.15rem; }
    .rejilla-kpi small { color: #94a3b8; font-size: 0.75rem; }
    .alerta { border-color: #fecaca; background: #fff1f2; }
    .graficos { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.75rem; }
    .grafico-barras, .grafico-creditos {
      padding: 0.85rem;
      border-radius: 0.65rem;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      display: grid;
      gap: 0.65rem;
    }
    .barra-apilada {
      display: flex;
      height: 1.25rem;
      border-radius: 999px;
      overflow: hidden;
      background: #f1f5f9;
    }
    .segmento.activa { background: #2563eb; min-width: 2px; }
    .segmento.mora { background: #e11d48; min-width: 2px; }
    .leyenda { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.8rem; color: #475569; }
    .muestra { display: inline-block; width: 0.65rem; height: 0.65rem; border-radius: 999px; margin-right: 0.25rem; }
    .muestra.activa { background: #2563eb; }
    .muestra.mora { background: #e11d48; }
    .barras-verticales { display: flex; align-items: flex-end; justify-content: space-around; gap: 1rem; min-height: 8rem; padding-top: 0.5rem; }
    .columna { display: grid; justify-items: center; gap: 0.35rem; flex: 1; font-size: 0.8rem; color: #64748b; }
    .columna .barra { width: 2.5rem; min-height: 4px; border-radius: 0.35rem 0.35rem 0 0; background: #2563eb; transition: height 0.2s ease; }
    .columna.alerta .barra { background: #e11d48; }
    .columna strong { color: #0f172a; font-size: 1rem; }
    .boton-secundario {
      display: inline-flex;
      align-items: center;
      min-height: 2.25rem;
      padding: 0.45rem 0.85rem;
      border-radius: 0.5rem;
      border: 1px solid #d1d5db;
      color: #1d4ed8;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
    }
    .error { color: #b91c1c; margin: 0; }
    .estado-carga { margin: 0; color: #64748b; }
  `,
})
export class PanelIndicadoresNegocioComponent implements OnInit {
  private readonly dashboardServicio = inject(DashboardServicio);

  readonly dashboard = signal<DashboardNegocio | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly infoHoy = signal(infoDiaCalendario(fechaHoyIsoColombia()));

  readonly porcentajeActiva = computed(() => {
    const datos = this.dashboard();
    if (!datos) {
      return 0;
    }
    const activa = montoANumero(datos.cartera_activa);
    const mora = montoANumero(datos.cartera_mora);
    const total = activa + mora;
    if (total <= 0) {
      return activa > 0 ? 100 : 50;
    }
    return Math.round((activa / total) * 100);
  });

  readonly porcentajeMora = computed(() => {
    const activa = this.porcentajeActiva();
    const datos = this.dashboard();
    if (!datos) {
      return 0;
    }
    const mora = montoANumero(datos.cartera_mora);
    const total = montoANumero(datos.cartera_activa) + mora;
    if (total <= 0) {
      return mora > 0 ? 100 : 50;
    }
    return Math.max(0, 100 - activa);
  });

  readonly alturaBarraCreditosActivos = computed(() => this.alturaRelativaCreditos('activos'));
  readonly alturaBarraCreditosMora = computed(() => this.alturaRelativaCreditos('mora'));

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
        this.error.set(mensajeErrorHttp(error, 'No se pudo cargar el resumen operativo.'));
      },
    });
  }

  private alturaRelativaCreditos(tipo: 'activos' | 'mora'): number {
    const datos = this.dashboard();
    if (!datos) {
      return 0;
    }
    const activos = datos.creditos_activos;
    const mora = datos.creditos_en_mora;
    const maximo = Math.max(activos, mora, 1);
    const valor = tipo === 'activos' ? activos : mora;
    return Math.max(8, Math.round((valor / maximo) * 100));
  }
}
