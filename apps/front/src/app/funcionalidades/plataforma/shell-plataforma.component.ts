import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';

@Component({
  selector: 'app-shell-plataforma',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <header class="barra">
        <div>
          <p class="marca">Creditos SaaS</p>
          <h1>Panel de plataforma</h1>
        </div>
        @if (perfil(); as usuario) {
          <div class="usuario">
            <p>{{ usuario.nombre }}</p>
            <span class="rol">{{ usuario.rol }}</span>
            <button type="button" (click)="cerrarSesion()">Cerrar sesión</button>
          </div>
        }
      </header>

      <nav class="menu">
        <a routerLink="/plataforma/negocios" routerLinkActive="activo">Negocios</a>
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
