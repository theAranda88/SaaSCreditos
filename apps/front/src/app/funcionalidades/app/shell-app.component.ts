import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { ROLES_ADMINISTRACION_NEGOCIO } from '../../nucleo/auth/roles-negocio';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell-app.component.html',
  styleUrl: './shell-app.component.scss',
})
export class ShellAppComponent {
  private readonly authServicio = inject(AuthServicio);
  private readonly router = inject(Router);

  readonly perfil = this.authServicio.perfilActual;

  readonly puedeAdministrar = computed(() => {
    const rol = this.perfil()?.rol;
    return rol !== undefined && ROLES_ADMINISTRACION_NEGOCIO.includes(rol);
  });

  readonly esCobrador = computed(() => this.perfil()?.rol === 'cobrador');

  readonly tituloPanel = computed(() => {
    const rol = this.perfil()?.rol;

    switch (rol) {
      case 'propietario':
        return 'Panel del propietario';
      case 'administrador':
        return 'Panel del administrador';
      case 'cobrador':
        return 'Panel del cobrador';
      default:
        return 'Panel operativo';
    }
  });

  cerrarSesion(): void {
    this.authServicio.cerrarSesion();
    void this.router.navigate(['/login']);
  }
}
