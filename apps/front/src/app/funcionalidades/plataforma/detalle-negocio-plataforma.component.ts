import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type {
  AuditoriaPlataforma,
  EstadoNegocio,
  NegocioPlataforma,
  UsuarioPlataforma,
} from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { PlataformaServicio } from './plataforma.servicio';

@Component({
  selector: 'app-detalle-negocio-plataforma',
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <a routerLink="/plataforma/negocios" class="volver">{{
        'plataforma.negocios.detalle.volver' | translate
      }}</a>

      @if (error(); as claveError) {
        <p class="error">{{ claveError | translate }}</p>
      }

      @if (cargando()) {
        <p>{{ 'comun.carga.negocio' | translate }}</p>
      } @else {
        @if (negocio(); as actual) {
          <header>
            <h2>{{ actual.nombre_comercial }}</h2>
            @if (actual.suscripcion) {
              <p>
                {{
                  'plataforma.negocios.detalle.estado_plan'
                    | translate
                      : {
                          estado: actual.estado,
                          plan: actual.suscripcion.plan_nombre,
                          limite: actual.suscripcion.limite_cobradores,
                        }
                }}
              </p>
            }
          </header>

          @if (esAdminPlataforma()) {
            <div class="acciones">
              @if (actual.estado !== 'suspendido') {
                <button type="button" (click)="pedirCambioEstado('suspendido')">
                  {{ 'plataforma.negocios.detalle.suspender' | translate }}
                </button>
              }
              @if (actual.estado !== 'activo') {
                <button type="button" class="primario" (click)="pedirCambioEstado('activo')">
                  {{ 'plataforma.negocios.detalle.activar' | translate }}
                </button>
              }
              @if (actual.estado !== 'cancelado') {
                <button type="button" class="peligro" (click)="pedirCambioEstado('cancelado')">
                  {{ 'plataforma.negocios.detalle.cancelar_cuenta' | translate }}
                </button>
              }
            </div>
          }

          @if (estadoPendiente(); as estado) {
            <div class="confirmacion">
              <p>
                {{
                  'plataforma.negocios.detalle.confirmar_estado' | translate: { estado: estado }
                }}
              </p>
              <div class="acciones">
                <button type="button" class="primario" (click)="confirmarCambioEstado()" [disabled]="guardando()">
                  {{
                    (guardando() ? 'comun.acciones.aplicando' : 'comun.acciones.confirmar') | translate
                  }}
                </button>
                <button type="button" (click)="cancelarCambioEstado()" [disabled]="guardando()">
                  {{ 'comun.acciones.cancelar' | translate }}
                </button>
              </div>
            </div>
          }

          <h3>{{ 'plataforma.negocios.detalle.usuarios' | translate }}</h3>
          @if (usuarios().length === 0) {
            <p class="vacio">{{ 'plataforma.negocios.detalle.usuarios_vacio' | translate }}</p>
          } @else {
            <div class="tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>{{ 'comun.filtros.nombre' | translate }}</th>
                    <th>{{ 'comun.filtros.correo' | translate }}</th>
                    <th>Rol</th>
                    <th>{{ 'comun.filtros.estado' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (usuario of usuarios(); track usuario.id) {
                    <tr>
                      <td>{{ usuario.nombre }}</td>
                      <td>{{ usuario.correo }}</td>
                      <td>{{ usuario.rol }}</td>
                      <td>{{ usuario.estado }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <h3>{{ 'plataforma.negocios.detalle.auditoria' | translate }}</h3>
          @if (auditorias().length === 0) {
            <p class="vacio">{{ 'plataforma.negocios.detalle.auditoria_vacio' | translate }}</p>
          } @else {
            <ul class="auditorias">
              @for (evento of auditorias(); track evento.id) {
                <li>
                  <strong>{{ evento.accion }}</strong>
                  <span>{{ evento.entidad }} · {{ evento.fecha }}</span>
                </li>
              }
            </ul>
          }
        }
      }
    </section>
  `,
  styleUrl: './detalle-negocio-plataforma.component.scss',
})
export class DetalleNegocioPlataformaComponent implements OnInit {
  private readonly plataformaServicio = inject(PlataformaServicio);
  private readonly authServicio = inject(AuthServicio);
  private readonly ruta = inject(ActivatedRoute);

  readonly negocio = signal<NegocioPlataforma | null>(null);
  readonly usuarios = signal<UsuarioPlataforma[]>([]);
  readonly auditorias = signal<AuditoriaPlataforma[]>([]);
  readonly estadoPendiente = signal<EstadoNegocio | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly esAdminPlataforma = computed(
    () => this.authServicio.perfilActual()?.rol === 'admin_plataforma',
  );

  ngOnInit(): void {
    const id = this.ruta.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('plataforma.negocios.detalle.no_encontrado');
      return;
    }

    this.cargar(id);
  }

  pedirCambioEstado(estado: EstadoNegocio): void {
    if (!this.esAdminPlataforma() || this.guardando()) {
      return;
    }

    this.error.set(null);
    this.estadoPendiente.set(estado);
  }

  cancelarCambioEstado(): void {
    this.estadoPendiente.set(null);
  }

  confirmarCambioEstado(): void {
    const negocio = this.negocio();
    const estado = this.estadoPendiente();

    if (!negocio || !estado || !this.esAdminPlataforma() || this.guardando()) {
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.plataformaServicio.cambiarEstadoNegocio(negocio.id, estado).subscribe({
      next: (actualizado) => {
        this.negocio.set(actualizado);
        this.estadoPendiente.set(null);
        this.guardando.set(false);
        this.cargarAuditorias(negocio.id);
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.error.set(claveMensajeErrorHttp(error, 'errores.plataforma.cambio_estado'));
      },
    });
  }

  private cargar(id: string): void {
    this.cargando.set(true);
    this.error.set(null);

    this.plataformaServicio.obtenerNegocio(id).subscribe({
      next: (negocio) => {
        this.negocio.set(negocio);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(claveMensajeErrorHttp(error, 'errores.plataforma.carga_detalle'));
      },
    });

    this.plataformaServicio.listarUsuarios(id).subscribe({
      next: (usuarios) => this.usuarios.set(usuarios),
      error: () => this.usuarios.set([]),
    });

    this.cargarAuditorias(id);
  }

  private cargarAuditorias(id: string): void {
    this.plataformaServicio.listarAuditorias(id).subscribe({
      next: (auditorias) => this.auditorias.set(auditorias),
      error: () => this.auditorias.set([]),
    });
  }
}
