import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthServicio } from '../../../nucleo/auth/auth.servicio';
import { ROLES_ADMINISTRACION_NEGOCIO } from '../../../nucleo/auth/roles-negocio';
import { PanelIndicadoresNegocioComponent } from '../../dashboard/panel-indicadores-negocio.component';
import { NegociosServicio } from '../../negocios/negocios.servicio';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, PanelIndicadoresNegocioComponent],
  template: `
    <div class="pagina-inicio">
      <section class="bienvenida">
        <h2>Bienvenido, {{ authServicio.perfilActual()?.nombre }}</h2>
        @if (puedeVerNegocio()) {
          <p>
            Sesión activa en
            <strong>{{ nombreNegocio() ?? 'su negocio' }}</strong>.
          </p>
        }
        @if (esCobrador()) {
          <p>Consulte sus cobros del día y registre recaudos desde la jornada de cobro.</p>
          <a routerLink="/app/cobros" class="boton-primario">Ir a cobros del día</a>
        } @else if (!puedeVerIndicadores()) {
          <p>Gestione clientes, créditos, cobradores y la asignación de cartera desde el menú.</p>
        }
      </section>

      @if (puedeVerIndicadores()) {
        <app-panel-indicadores-negocio />
      }
    </div>
  `,
  styles: `
    .pagina-inicio { display: grid; gap: 1rem; max-width: 960px; }
    .bienvenida {
      padding: 1rem;
      border-radius: 0.75rem;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      display: grid;
      gap: 0.5rem;
    }
    h2 { margin: 0; font-size: 1.15rem; }
    .bienvenida p { margin: 0; color: #64748b; font-size: 0.9rem; }
    .boton-primario {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      border: none;
      background: #1d4ed8;
      color: #ffffff;
      text-decoration: none;
      width: fit-content;
      cursor: pointer;
    }
  `,
})
export class InicioComponent implements OnInit {
  readonly authServicio = inject(AuthServicio);
  private readonly negociosServicio = inject(NegociosServicio);

  readonly nombreNegocio = signal<string | null>(null);

  readonly esCobrador = computed(() => this.authServicio.perfilActual()?.rol === 'cobrador');

  readonly puedeVerNegocio = computed(() => {
    const rol = this.authServicio.perfilActual()?.rol;
    return rol !== undefined && ROLES_ADMINISTRACION_NEGOCIO.includes(rol);
  });

  readonly puedeVerIndicadores = computed(() => this.puedeVerNegocio());

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
