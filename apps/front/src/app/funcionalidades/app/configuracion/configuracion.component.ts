import { Component } from '@angular/core';

@Component({
  selector: 'app-configuracion',
  template: `
    <section class="tarjeta">
      <h2>Configuración del negocio</h2>
      <p>RF-002 completo en backend. La UI de edición llegará en la Fase 2.</p>
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
export class ConfiguracionComponent {}
