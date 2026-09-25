import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';

@Component({
  selector: 'app-shell-plataforma',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <div class="layout">
      <header class="barra">
        <div>
          <p class="marca">{{ 'comun.marca.nombre_producto' | translate }}</p>
          <h1>{{ 'plataforma.shell.titulo' | translate }}</h1>
        </div>
        @if (perfil(); as usuario) {
          <div class="usuario">
            <p>{{ usuario.nombre }}</p>
            <span class="rol">{{ usuario.rol }}</span>
            <button type="button" (click)="cerrarSesion()">
              {{ 'comun.navegacion.cerrar_sesion' | translate }}
            </button>
          </div>
        }
      </header>

      <nav class="menu">
        <a routerLink="/plataforma/negocios" routerLinkActive="activo">{{
          'comun.navegacion.negocios' | translate
        }}</a>
      </nav>

      <main>
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: '../app/shell-app.component.scss',
})
export class ShellPlataformaComponent {
  private readonly authServicio = inject(AuthServicio);
  private readonly router = inject(Router);

  readonly perfil = this.authServicio.perfilActual;

  cerrarSesion(): void {
    this.authServicio.cerrarSesion();
    void this.router.navigate(['/login']);
  }
}
