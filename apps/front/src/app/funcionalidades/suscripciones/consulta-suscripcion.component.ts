import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { PlanPerfil, SuscripcionPerfil } from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { SuscripcionesServicio } from './suscripciones.servicio';

@Component({
  selector: 'app-consulta-suscripcion',
  imports: [TranslatePipe],
  template: `
    <section class="pagina">
      <header>
        <h2>{{ 'suscripciones.consulta.titulo' | translate }}</h2>
        <p>{{ 'suscripciones.consulta.subtitulo' | translate }}</p>
      </header>

      @if (error(); as claveError) {
        <p class="error">{{ claveError | translate }}</p>
      }

      @if (cargando()) {
        <p>{{ 'comun.carga.suscripcion' | translate }}</p>
      } @else {
        @if (suscripcion(); as actual) {
          @if (actual.estado !== 'activa') {
            <p class="aviso">
              {{
                'suscripciones.consulta.servicio_inactivo' | translate: { estado: actual.estado }
              }}
            </p>
          }

          <div class="tarjetas">
            <article>
              <span>{{ 'suscripciones.consulta.plan' | translate }}</span>
              <strong>{{ actual.plan.nombre }}</strong>
              <small>{{ actual.plan.codigo }}</small>
            </article>
            <article>
              <span>{{ 'suscripciones.consulta.cobradores' | translate }}</span>
              <strong>{{ actual.cobradores_activos }} / {{ actual.limite_cobradores }}</strong>
              <small>{{ 'suscripciones.consulta.cupo_plan' | translate }}</small>
            </article>
            <article>
              <span>{{ 'comun.filtros.estado' | translate }}</span>
              <strong class="estado">{{ actual.estado }}</strong>
              <small>{{
                'suscripciones.consulta.renovacion' | translate: { fecha: actual.fecha_renovacion }
              }}</small>
            </article>
            <article>
              <span>{{ 'suscripciones.consulta.mensualidad' | translate }}</span>
              <strong>{{ actual.plan.precio_mensual }}</strong>
              <small>{{
                'suscripciones.consulta.implementacion'
                  | translate: { monto: actual.plan.precio_implementacion }
              }}</small>
            </article>
          </div>

          @if (esPropietario()) {
            <section class="cambio">
              <h3>{{ 'suscripciones.consulta.cambiar_plan' | translate }}</h3>
              <p>{{ 'suscripciones.consulta.checkout_stub' | translate }}</p>

              @if (planesDisponibles().length === 0) {
                <p class="vacio">{{ 'suscripciones.consulta.sin_planes' | translate }}</p>
              } @else {
                <ul>
                  @for (plan of planesDisponibles(); track plan.id) {
                    <li>
                      <div>
                        <strong>{{ plan.nombre }}</strong>
                        <small>{{
                          'suscripciones.consulta.plan_detalle'
                            | translate: { limite: plan.limite_cobradores, precio: plan.precio_mensual }
                        }}</small>
                      </div>
                      <button type="button" (click)="pedirCambio(plan)" [disabled]="guardando()">
                        {{ 'comun.acciones.elegir' | translate }}
                      </button>
                    </li>
                  }
                </ul>
              }

              @if (planPendiente(); as plan) {
                <div class="confirmacion">
                  <p>
                    {{
                      'suscripciones.consulta.confirmar_cambio_texto'
                        | translate: { nombre: plan.nombre, limite: plan.limite_cobradores }
                    }}
                  </p>
                  <div class="acciones">
                    <button type="button" class="primario" (click)="confirmarCambio()" [disabled]="guardando()">
                      {{
                        (guardando() ? 'comun.acciones.cambiando' : 'suscripciones.consulta.confirmar_cambio')
                          | translate
                      }}
                    </button>
                    <button type="button" (click)="cancelarCambio()" [disabled]="guardando()">
                      {{ 'comun.acciones.cancelar' | translate }}
                    </button>
                  </div>
                </div>
              }
            </section>
          }
        }
      }
    </section>
  `,
  styleUrl: './consulta-suscripcion.component.scss',
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
        this.error.set(claveMensajeErrorHttp(error, 'errores.suscripciones.carga'));
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
        this.error.set(claveMensajeErrorHttp(error, 'errores.suscripciones.cambio_plan'));
      },
    });
  }
}
