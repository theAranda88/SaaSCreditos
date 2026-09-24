import { Component, computed, inject, OnInit, signal } from '@angular/core';
import type { PlanPerfil, SuscripcionPerfil } from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { SuscripcionesServicio } from './suscripciones.servicio';

@Component({
  selector: 'app-consulta-suscripcion',
  template: `
    <section class="pagina">
      <header>
        <h2>Suscripción</h2>
        <p>Plan contratado, límites y estado del servicio.</p>
      </header>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (cargando()) {
        <p>Cargando suscripción…</p>
      } @else {
        @if (suscripcion(); as actual) {
          @if (actual.estado !== 'activa') {
            <p class="aviso">
              El servicio está <strong>{{ actual.estado }}</strong>. Las operaciones de cartera
              quedan bloqueadas hasta reactivar la cuenta.
            </p>
          }

          <div class="tarjetas">
            <article>
              <span>Plan</span>
              <strong>{{ actual.plan.nombre }}</strong>
              <small>{{ actual.plan.codigo }}</small>
            </article>
            <article>
              <span>Cobradores</span>
              <strong>{{ actual.cobradores_activos }} / {{ actual.limite_cobradores }}</strong>
              <small>Cupo del plan</small>
            </article>
            <article>
              <span>Estado</span>
              <strong class="estado">{{ actual.estado }}</strong>
              <small>Renovación {{ actual.fecha_renovacion }}</small>
            </article>
            <article>
              <span>Mensualidad</span>
              <strong>{{ actual.plan.precio_mensual }}</strong>
              <small>Implementación {{ actual.plan.precio_implementacion }}</small>
            </article>
          </div>

          @if (esPropietario()) {
            <section class="cambio">
              <h3>Cambiar de plan</h3>
              <p>Checkout stub: no hay pasarela. El cupo actual debe caber en el plan destino.</p>

              @if (planesDisponibles().length === 0) {
                <p class="vacio">No hay otros planes activos para cambiar.</p>
              } @else {
                <ul>
                  @for (plan of planesDisponibles(); track plan.id) {
                    <li>
                      <div>
                        <strong>{{ plan.nombre }}</strong>
                        <small>Hasta {{ plan.limite_cobradores }} cobradores · {{ plan.precio_mensual }}/mes</small>
                      </div>
                      <button type="button" (click)="pedirCambio(plan)" [disabled]="guardando()">
                        Elegir
                      </button>
                    </li>
                  }
                </ul>
              }

              @if (planPendiente(); as plan) {
                <div class="confirmacion">
                  <p>
                    Va a cambiar al plan <strong>{{ plan.nombre }}</strong> (hasta
                    {{ plan.limite_cobradores }} cobradores).
                  </p>
                  <div class="acciones">
                    <button type="button" class="primario" (click)="confirmarCambio()" [disabled]="guardando()">
                      {{ guardando() ? 'Cambiando…' : 'Confirmar cambio' }}
                    </button>
                    <button type="button" (click)="cancelarCambio()" [disabled]="guardando()">Cancelar</button>
                  </div>
                </div>
              }
            </section>
          }
        }
      }
    </section>
  `,
  styles: `
    .pagina { display: grid; gap: 1.25rem; max-width: 820px; }
    h2, h3 { margin: 0; }
    header p, .vacio, .cambio p { margin: 0.35rem 0 0; color: #64748b; }
    .tarjetas { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.85rem; }
    article { padding: 1rem; border-radius: 0.85rem; background: #ffffff; border: 1px solid #e5e7eb; display: grid; gap: 0.35rem; }
    article span, article small { color: #64748b; font-size: 0.85rem; }
    .estado { text-transform: capitalize; }
    .aviso { margin: 0; padding: 0.75rem 1rem; border-radius: 0.65rem; background: #fff7ed; color: #9a3412; }
    .cambio { padding: 1rem; border-radius: 0.85rem; background: #ffffff; border: 1px solid #e5e7eb; display: grid; gap: 0.85rem; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.65rem; }
    li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; align-items: center; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.65rem; }
    li small { display: block; color: #64748b; }
    button { padding: 0.65rem 0.9rem; border-radius: 0.5rem; border: 1px solid #d1d5db; background: #ffffff; cursor: pointer; }
    .primario, li button { border: none; background: #1d4ed8; color: #ffffff; font-weight: 600; }
    .confirmacion { padding: 1rem; border-radius: 0.75rem; background: #eff6ff; border: 1px solid #bfdbfe; display: grid; gap: 0.75rem; }
    .acciones { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .error { color: #b91c1c; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `,
})
export class ConsultaSuscripcionComponent implements OnInit {
  private readonly suscripcionesServicio = inject(SuscripcionesServicio);
  private readonly authServicio = inject(AuthServicio);

  readonly suscripcion = signal<SuscripcionPerfil | null>(null);
  readonly planes = signal<PlanPerfil[]>([]);
  readonly planPendiente = signal<PlanPerfil | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly esPropietario = computed(() => this.authServicio.perfilActual()?.rol === 'propietario');

  readonly planesDisponibles = computed(() => {
    const actual = this.suscripcion();
    return this.planes().filter((plan) => plan.id !== actual?.plan.id && plan.estado === 'activo');
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.suscripcionesServicio.obtenerMia().subscribe({
      next: (suscripcion) => {
        this.suscripcion.set(suscripcion);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeErrorHttp(error, 'No se pudo cargar la suscripción.'));
      },
    });

    if (this.esPropietario()) {
      this.suscripcionesServicio.listarPlanes().subscribe({
        next: (planes) => this.planes.set(planes),
        error: () => this.planes.set([]),
      });
    }
  }

  pedirCambio(plan: PlanPerfil): void {
    if (!this.esPropietario() || this.guardando()) {
      return;
    }

    this.error.set(null);
    this.planPendiente.set(plan);
  }

  cancelarCambio(): void {
    this.planPendiente.set(null);
  }

  confirmarCambio(): void {
    const plan = this.planPendiente();

    if (!plan || !this.esPropietario() || this.guardando()) {
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.suscripcionesServicio.checkoutStub(plan.id).subscribe({
      next: (suscripcion) => {
        this.suscripcion.set(suscripcion);
        this.planPendiente.set(null);
        this.guardando.set(false);
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.error.set(mensajeErrorHttp(error, 'No se pudo cambiar el plan.'));
      },
    });
  }
}
