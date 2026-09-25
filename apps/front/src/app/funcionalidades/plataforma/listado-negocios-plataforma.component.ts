import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { NegocioPlataforma } from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { PlataformaServicio } from './plataforma.servicio';

@Component({
  selector: 'app-listado-negocios-plataforma',
  imports: [RouterLink],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>Negocios</h2>
          <p>Cuentas de la plataforma, su plan y estado de servicio.</p>
        </div>
        @if (esAdminPlataforma()) {
          <a routerLink="/plataforma/negocios/nuevo" class="btn-nuevo">Nuevo negocio</a>
        }
      </header>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (cargando()) {
        <p>Cargando negocios…</p>
      } @else if (negocios().length === 0) {
        <p class="vacio">No hay negocios para mostrar.</p>
      } @else {
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Renovación</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (negocio of negocios(); track negocio.id) {
                <tr>
                  <td>{{ negocio.nombre_comercial }}</td>
                  <td>{{ negocio.suscripcion?.plan_nombre ?? '—' }}</td>
                  <td>
                    <span class="estado" [class.alerta]="negocio.estado !== 'activo'">
                      {{ negocio.estado }}
                    </span>
                  </td>
                  <td>{{ negocio.suscripcion?.fecha_renovacion ?? '—' }}</td>
                  <td>
                    <a [routerLink]="['/plataforma/negocios', negocio.id]">Ver</a>
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
    .pagina { display: grid; gap: 1.25rem; }
    .encabezado { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .btn-nuevo {
      padding: 0.65rem 1rem;
      border-radius: 0.5rem;
      background: #1d4ed8;
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      white-space: nowrap;
    }
    h2 { margin: 0; }
    header p, .vacio { margin: 0.35rem 0 0; color: #64748b; }
    .tabla-contenedor { overflow-x: auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .estado { text-transform: capitalize; color: #166534; }
    .estado.alerta { color: #b45309; }
    a { color: #1d4ed8; }
    .error { color: #b91c1c; }
  `,
})
export class ListadoNegociosPlataformaComponent implements OnInit {
  private readonly plataformaServicio = inject(PlataformaServicio);
  private readonly authServicio = inject(AuthServicio);

  readonly negocios = signal<NegocioPlataforma[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly esAdminPlataforma = () => this.authServicio.perfilActual()?.rol === 'admin_plataforma';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.plataformaServicio.listarNegocios().subscribe({
      next: (negocios) => {
        this.negocios.set(negocios);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeErrorHttp(error, 'No se pudieron cargar los negocios.'));
      },
    });
  }
}
