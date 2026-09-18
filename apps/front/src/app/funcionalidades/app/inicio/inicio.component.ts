import { Component, inject } from '@angular/core';
import { AuthServicio } from '../../../nucleo/auth/auth.servicio';

@Component({
  selector: 'app-inicio',
  template: `
    <section class="tarjeta">
      <h2>Bienvenido, {{ authServicio.perfilActual()?.nombre }}</h2>
      <p>Sesión activa para el negocio {{ authServicio.perfilActual()?.negocio_id }}.</p>
      <p>Gestione clientes, créditos y cobradores desde el menú.</p>
    </section>
  `,
  styles: `
    .tarjeta {
      max-width: 720px;
      padding: 1.25rem;
      border-radius: 0.75rem;
      background: #ffffff;
      border: 1px solid #e5e7eb;
    }
  `,
})
export class InicioComponent {
  readonly authServicio = inject(AuthServicio);
}
