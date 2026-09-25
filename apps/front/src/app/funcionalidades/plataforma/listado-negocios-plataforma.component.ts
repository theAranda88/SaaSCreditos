import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { NegocioPlataforma } from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { PlataformaServicio } from './plataforma.servicio';

@Component({
  selector: 'app-listado-negocios-plataforma',
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>{{ 'plataforma.negocios.listado.titulo' | translate }}</h2>
          <p>{{ 'plataforma.negocios.listado.subtitulo' | translate }}</p>
        </div>
        @if (esAdminPlataforma()) {
          <a routerLink="/plataforma/negocios/nuevo" class="boton-primario">{{
            'plataforma.negocios.listado.nuevo' | translate
          }}</a>
        }
      </header>

      @if (error(); as claveError) {
        <p class="error">{{ claveError | translate }}</p>
      }

      @if (cargando()) {
        <p>{{ 'comun.carga.negocios' | translate }}</p>
      } @else if (negocios().length === 0) {
        <p class="vacio">{{ 'plataforma.negocios.listado.vacio' | translate }}</p>
      } @else {
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>{{ 'plataforma.negocios.listado.columna_negocio' | translate }}</th>
                <th>{{ 'plataforma.negocios.listado.columna_plan' | translate }}</th>
                <th>{{ 'comun.filtros.estado' | translate }}</th>
                <th>{{ 'plataforma.negocios.listado.columna_renovacion' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (negocio of negocios(); track negocio.id) {
                <tr>
                  <td>{{ negocio.nombre_comercial }}</td>
                  <td>{{ negocio.suscripcion?.plan_nombre ?? ('comun.vacio.guion' | translate) }}</td>
                  <td>
                    <span class="estado" [class.inactivo]="negocio.estado !== 'activo'">
                      {{ negocio.estado }}
                    </span>
                  </td>
                  <td>{{ negocio.suscripcion?.fecha_renovacion ?? ('comun.vacio.guion' | translate) }}</td>
                  <td class="acciones">
                    <a [routerLink]="['/plataforma/negocios', negocio.id]">{{ 'comun.acciones.ver' | translate }}</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
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
        this.error.set(claveMensajeErrorHttp(error, 'errores.plataforma.carga_listado'));
      },
    });
  }
}
