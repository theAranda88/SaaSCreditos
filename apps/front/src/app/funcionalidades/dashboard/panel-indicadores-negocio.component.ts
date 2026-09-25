import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { DashboardNegocio } from '@creditos/shared-types';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { fechaHoyIsoColombia } from '../../nucleo/utilidades/fecha-colombia';
import { infoDiaCalendario } from '../../nucleo/utilidades/dias-habiles-colombia';
import { DashboardServicio } from './dashboard.servicio';

function montoANumero(valor: string): number {
  const parseado = Number.parseFloat(valor);
  return Number.isFinite(parseado) ? parseado : 0;
}

@Component({
  selector: 'app-panel-indicadores-negocio',
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="panel-indicadores" [attr.aria-label]="'dashboard.indicadores.titulo' | translate">
      <header class="encabezado-panel">
        <div>
          <h2>{{ 'dashboard.indicadores.titulo' | translate }}</h2>
          <p>{{ 'dashboard.indicadores.subtitulo' | translate }}</p>
          @if (infoHoy(); as hoy) {
            @if (!hoy.esHabil) {
              <p
                class="aviso-dia"
                [innerHTML]="'comun.calendario.aviso_dia_inhabil' | translate: { etiqueta: hoy.etiqueta }"
              ></p>
            }
          }
        </div>
        <a routerLink="/app/cartera" [queryParams]="{ segmento: 'mora' }" class="boton-secundario">
          {{ 'dashboard.indicadores.ver_mora' | translate }}
        </a>
      </header>

      @if (error(); as claveError) {
        <p class="error">{{ claveError | translate }}</p>
      }

      @if (cargando()) {
        <p class="estado-carga">{{ 'comun.carga.indicadores' | translate }}</p>
      } @else {
        @if (dashboard(); as datos) {
          <div class="kpi-destacado">
            <span>{{ 'dashboard.indicadores.recaudo_dia' | translate }}</span>
            <strong>{{ datos.recaudo_dia }}</strong>
            <small>{{ 'dashboard.indicadores.fecha_kpi' | translate: { fecha: datos.fecha } }}</small>
          </div>

          <div class="rejilla-kpi">
            <article>
              <span>{{ 'dashboard.indicadores.cartera_activa' | translate }}</span>
              <strong>{{ datos.cartera_activa }}</strong>
              <small>{{
                'dashboard.indicadores.creditos_count' | translate: { count: datos.creditos_activos }
              }}</small>
            </article>
            <article class="alerta">
              <span>{{ 'dashboard.indicadores.cartera_mora' | translate }}</span>
              <strong>{{ datos.cartera_mora }}</strong>
              <small>{{
                'dashboard.indicadores.creditos_count' | translate: { count: datos.creditos_en_mora }
              }}</small>
            </article>
            <article>
              <span>{{ 'dashboard.indicadores.cobradores_activos' | translate }}</span>
              <strong>{{ datos.cobradores_activos }}</strong>
              <small>{{ 'dashboard.indicadores.en_operacion' | translate }}</small>
            </article>
          </div>

          <div class="graficos">
            <article class="grafico-barras">
              <h3>{{ 'dashboard.indicadores.composicion_cartera' | translate }}</h3>
              <div
                class="barra-apilada"
                role="img"
                [attr.aria-label]="etiquetaAriaComposicion()"
              >
                <span
                  class="segmento activa"
                  [style.flex-grow]="porcentajeActiva()"
                  [title]="
                    ('dashboard.indicadores.title_activa' | translate: { porcentaje: porcentajeActiva() })
                  "
                ></span>
                <span
                  class="segmento mora"
                  [style.flex-grow]="porcentajeMora()"
                  [title]="
                    ('dashboard.indicadores.title_mora' | translate: { porcentaje: porcentajeMora() })
                  "
                ></span>
              </div>
              <ul class="leyenda">
                <li>
                  <span class="muestra activa"></span>
                  {{
                    'dashboard.indicadores.leyenda_activa' | translate: { porcentaje: porcentajeActiva() }
                  }}
                </li>
                <li>
                  <span class="muestra mora"></span>
                  {{
                    'dashboard.indicadores.leyenda_mora' | translate: { porcentaje: porcentajeMora() }
                  }}
                </li>
              </ul>
            </article>

            <article class="grafico-creditos">
              <h3>{{ 'dashboard.indicadores.creditos_estado' | translate }}</h3>
              <div class="barras-verticales">
                <div class="columna">
                  <div class="barra" [style.height.%]="alturaBarraCreditosActivos()"></div>
                  <span>{{ 'dashboard.indicadores.activos' | translate }}</span>
                  <strong>{{ datos.creditos_activos }}</strong>
                </div>
                <div class="columna alerta">
                  <div class="barra" [style.height.%]="alturaBarraCreditosMora()"></div>
                  <span>{{ 'dashboard.indicadores.en_mora' | translate }}</span>
                  <strong>{{ datos.creditos_en_mora }}</strong>
                </div>
              </div>
            </article>
          </div>
        }
      }
    </section>
  `,
  styleUrl: './panel-indicadores-negocio.component.scss',
})
export class PanelIndicadoresNegocioComponent implements OnInit {
  private readonly dashboardServicio = inject(DashboardServicio);
  private readonly translate = inject(TranslateService);

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

  etiquetaAriaComposicion(): string {
    return this.translate.instant('dashboard.indicadores.aria_composicion', {
      activa: this.porcentajeActiva(),
      mora: this.porcentajeMora(),
    });
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
        this.error.set(claveMensajeErrorHttp(error, 'errores.dashboard.resumen_operativo'));
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
