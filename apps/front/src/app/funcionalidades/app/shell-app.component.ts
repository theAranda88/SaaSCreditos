import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { SuscripcionPerfil } from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { ROLES_ADMINISTRACION_NEGOCIO } from '../../nucleo/auth/roles-negocio';
import { SuscripcionesServicio } from '../suscripciones/suscripciones.servicio';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell-app.component.html',
  styleUrl: './shell-app.component.scss',
})
export class ShellAppComponent implements OnInit {
  private readonly authServicio = inject(AuthServicio);
  private readonly router = inject(Router);
  private readonly suscripcionesServicio = inject(SuscripcionesServicio);

  readonly perfil = this.authServicio.perfilActual;
  readonly suscripcion = signal<SuscripcionPerfil | null>(null);

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

  readonly servicioNoOperativo = computed(() => {
    const estado = this.suscripcion()?.estado;
    return estado !== undefined && estado !== 'activa';
  });

  ngOnInit(): void {
    if (!this.puedeAdministrar()) {
      return;
    }

    this.suscripcionesServicio.obtenerMia().subscribe({
      next: (suscripcion) => this.suscripcion.set(suscripcion),
      error: () => this.suscripcion.set(null),
    });
  }

  cerrarSesion(): void {
    this.authServicio.cerrarSesion();
    void this.router.navigate(['/login']);
  }
}
