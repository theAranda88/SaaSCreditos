import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type {
  AuditoriaPlataforma,
  EstadoNegocio,
  NegocioPlataforma,
  UsuarioPlataforma,
} from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { PlataformaServicio } from './plataforma.servicio';

@Component({
  selector: 'app-detalle-negocio-plataforma',
  imports: [RouterLink],
  template: `
    <section class="pagina">
      <a routerLink="/plataforma/negocios" class="volver">← Negocios</a>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (cargando()) {
        <p>Cargando negocio…</p>
      } @else {
        @if (negocio(); as actual) {
        <header>
          <h2>{{ actual.nombre_comercial }}</h2>
          <p>
            Estado <strong>{{ actual.estado }}</strong>
            @if (actual.suscripcion) {
              · Plan {{ actual.suscripcion.plan_nombre }} (hasta {{ actual.suscripcion.limite_cobradores }} cobradores)
            }
          </p>
        </header>

        @if (esAdminPlataforma()) {
          <div class="acciones">
            @if (actual.estado !== 'suspendido') {
              <button type="button" (click)="pedirCambioEstado('suspendido')">Suspender</button>
            }
            @if (actual.estado !== 'activo') {
              <button type="button" class="primario" (click)="pedirCambioEstado('activo')">Activar</button>
            }
            @if (actual.estado !== 'cancelado') {
              <button type="button" class="peligro" (click)="pedirCambioEstado('cancelado')">Cancelar cuenta</button>
            }
          </div>
        }

        @if (estadoPendiente(); as estado) {
          <div class="confirmacion">
            <p>Confirme el cambio de estado a <strong>{{ estado }}</strong>.</p>
            <div class="acciones">
              <button type="button" class="primario" (click)="confirmarCambioEstado()" [disabled]="guardando()">
                {{ guardando() ? 'Aplicando…' : 'Confirmar' }}
              </button>
              <button type="button" (click)="cancelarCambioEstado()" [disabled]="guardando()">Cancelar</button>
            </div>
          </div>
        }

        <h3>Usuarios</h3>
        @if (usuarios().length === 0) {
          <p class="vacio">No hay usuarios en este negocio.</p>
        } @else {
          <div class="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
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

        <h3>Auditoría reciente</h3>
        @if (auditorias().length === 0) {
          <p class="vacio">Sin eventos administrativos.</p>
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
  styles: `
    .pagina { display: grid; gap: 1rem; max-width: 860px; }
    h2, h3 { margin: 0; }
    header p, .vacio { margin: 0.35rem 0 0; color: #64748b; }
    .volver { color: #1d4ed8; width: fit-content; text-decoration: none; }
    .acciones { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    button { padding: 0.65rem 0.9rem; border-radius: 0.5rem; border: 1px solid #d1d5db; background: #ffffff; cursor: pointer; }
    .primario { border: none; background: #1d4ed8; color: #ffffff; font-weight: 600; }
    .peligro { border-color: #fecaca; color: #b91c1c; }
    .confirmacion { padding: 1rem; border-radius: 0.75rem; background: #eff6ff; border: 1px solid #bfdbfe; display: grid; gap: 0.75rem; }
    .tabla-contenedor { overflow-x: auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .auditorias { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
    .auditorias li { padding: 0.75rem 1rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.65rem; display: grid; gap: 0.2rem; }
    .auditorias span { color: #64748b; font-size: 0.85rem; }
    .error { color: #b91c1c; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `,
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
      this.error.set('Negocio no encontrado.');
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
        this.error.set(mensajeErrorHttp(error, 'No se pudo cambiar el estado del negocio.'));
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
        this.error.set(mensajeErrorHttp(error, 'No se pudo cargar el negocio.'));
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
