import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { CodigoPlan } from '@creditos/shared-types';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { PlataformaServicio } from './plataforma.servicio';

const PLANES_INICIALES: { codigo: CodigoPlan; etiqueta: string }[] = [
  { codigo: 'emprendedor', etiqueta: 'Emprendedor (hasta 3 cobradores)' },
  { codigo: 'profesional', etiqueta: 'Profesional (hasta 10)' },
  { codigo: 'empresarial', etiqueta: 'Empresarial (hasta 15)' },
];

@Component({
  selector: 'app-crear-negocio-plataforma',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="pagina">
      <header>
        <a routerLink="/plataforma/negocios" class="volver">← Negocios</a>
        <h2>Nuevo negocio</h2>
        <p>
          Alta asistida: se crea el negocio, el usuario propietario y la suscripción activa. El
          propietario inicia sesión por su cuenta (no comparte su sesión).
        </p>
      </header>

      <form [formGroup]="formulario" (ngSubmit)="enviar()">
        <fieldset>
          <legend>Negocio</legend>
          <label>
            Nombre comercial
            <input type="text" formControlName="nombreComercial" autocomplete="organization" />
          </label>
          <label>
            Moneda (ISO)
            <input type="text" formControlName="moneda" maxlength="3" />
          </label>
        </fieldset>

        <fieldset>
          <legend>Propietario inicial</legend>
          <label>
            Nombre
            <input type="text" formControlName="nombre" autocomplete="name" />
          </label>
          <label>
            Correo
            <input type="email" formControlName="correo" autocomplete="email" />
          </label>
          <label>
            Contraseña inicial
            <input type="password" formControlName="contrasena" autocomplete="new-password" />
          </label>
          <label>
            Teléfono (opcional)
            <input type="tel" formControlName="telefono" />
          </label>
        </fieldset>

        <label>
          Plan inicial
          <select formControlName="codigoPlan">
            @for (plan of planes; track plan.codigo) {
              <option [value]="plan.codigo">{{ plan.etiqueta }}</option>
            }
          </select>
        </label>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <div class="acciones">
          <button type="submit" [disabled]="cargando() || formulario.invalid">
            {{ cargando() ? 'Creando…' : 'Crear negocio' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: `
    .pagina { display: grid; gap: 1.25rem; max-width: 640px; }
    h2 { margin: 0.5rem 0 0; }
    header p, .volver { margin: 0; color: #64748b; font-size: 0.95rem; }
    .volver { display: inline-block; margin-bottom: 0.5rem; color: #1d4ed8; text-decoration: none; }
    form { display: grid; gap: 1.25rem; padding: 1.25rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    fieldset { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin: 0; display: grid; gap: 0.75rem; }
    legend { font-weight: 600; padding: 0 0.35rem; }
    label { display: grid; gap: 0.35rem; font-size: 0.9rem; font-weight: 600; }
    input, select { padding: 0.65rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; }
    .acciones { display: flex; justify-content: flex-end; }
    button { padding: 0.75rem 1.25rem; border: none; border-radius: 0.5rem; background: #1d4ed8; color: #fff; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { color: #b91c1c; margin: 0; }
  `,
})
export class CrearNegocioPlataformaComponent {
  private readonly plataformaServicio = inject(PlataformaServicio);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly planes = PLANES_INICIALES;
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly formulario = this.formBuilder.nonNullable.group({
    nombreComercial: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]],
    moneda: ['COP', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
    telefono: [''],
    codigoPlan: ['emprendedor' as CodigoPlan, Validators.required],
  });

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const datos = this.formulario.getRawValue();
    const payload = {
      nombreComercial: datos.nombreComercial,
      nombre: datos.nombre,
      correo: datos.correo,
      contrasena: datos.contrasena,
      moneda: datos.moneda,
      codigoPlan: datos.codigoPlan,
      ...(datos.telefono.trim() ? { telefono: datos.telefono.trim() } : {}),
    };

    this.plataformaServicio.crearNegocio(payload).subscribe({
      next: (negocio) => {
        this.cargando.set(false);
        void this.router.navigate(['/plataforma/negocios', negocio.id]);
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeErrorHttp(err, 'No se pudo crear el negocio.'));
      },
    });
  }
}
