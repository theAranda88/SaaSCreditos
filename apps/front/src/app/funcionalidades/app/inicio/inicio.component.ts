import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthServicio } from '../../../nucleo/auth/auth.servicio';
import { ROLES_ADMINISTRACION_NEGOCIO } from '../../../nucleo/auth/roles-negocio';
import { PanelIndicadoresNegocioComponent } from '../../dashboard/panel-indicadores-negocio.component';
import { NegociosServicio } from '../../negocios/negocios.servicio';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, PanelIndicadoresNegocioComponent, TranslatePipe],
  template: `
    <div class="pagina-inicio">
      <section class="bienvenida">
        <h2>
          {{
            'app.inicio.bienvenida'
              | translate: { nombre: authServicio.perfilActual()?.nombre ?? '' }
          }}
        </h2>
        @if (puedeVerNegocio()) {
          <p
            [innerHTML]="
              'app.inicio.sesion_en_negocio'
                | translate: { nombreNegocio: etiquetaNegocio() }
            "
          ></p>
        }
        @if (esCobrador()) {
          <p>{{ 'app.inicio.texto_cobrador' | translate }}</p>
          <a routerLink="/app/cobros" class="boton-primario">{{ 'app.inicio.ir_cobros' | translate }}</a>
        } @else if (!puedeVerIndicadores()) {
          <p>{{ 'app.inicio.texto_admin' | translate }}</p>
        }
      </section>

      @if (puedeVerIndicadores()) {
        <app-panel-indicadores-negocio />
      }
    </div>
  `,
  styleUrl: './inicio.component.scss',
})
export class InicioComponent implements OnInit {
  readonly authServicio = inject(AuthServicio);
  private readonly negociosServicio = inject(NegociosServicio);
  private readonly translate = inject(TranslateService);

  readonly nombreNegocio = signal<string | null>(null);

  readonly esCobrador = computed(() => this.authServicio.perfilActual()?.rol === 'cobrador');

  readonly puedeVerNegocio = computed(() => {
    const rol = this.authServicio.perfilActual()?.rol;
    return rol !== undefined && ROLES_ADMINISTRACION_NEGOCIO.includes(rol);
  });

  readonly puedeVerIndicadores = computed(() => this.puedeVerNegocio());

  etiquetaNegocio(): string {
    return this.nombreNegocio() ?? this.translate.instant('app.inicio.negocio_fallback');
  }

  ngOnInit(): void {
    if (!this.puedeVerNegocio()) {
      return;
    }

    this.negociosServicio.obtenerMiNegocio().subscribe({
      next: (negocio) => this.nombreNegocio.set(negocio.nombre_comercial),
      error: () => this.nombreNegocio.set(null),
    });
  }
}
