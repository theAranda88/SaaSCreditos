import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { CobradoresServicio } from './cobradores.servicio';

@Component({
  selector: 'app-formulario-cobrador',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="pagina">
      <header>
        <h2>{{ cobradorId() ? 'Editar cobrador' : 'Nuevo cobrador' }}</h2>
        <a routerLink="/app/cobradores">Volver al listado</a>
      </header>

      <form [formGroup]="formulario" (ngSubmit)="enviar()">
        <label>
          Nombre
          <input type="text" formControlName="nombre" />
        </label>

        <label>
          Correo
          <input type="email" formControlName="correo" autocomplete="username" />
        </label>

        <label>
          {{ cobradorId() ? 'Nueva contraseña (opcional)' : 'Contraseña' }}
          <input type="password" formControlName="contrasena" autocomplete="new-password" />
        </label>

        <label>
          Teléfono (opcional)
          <input type="tel" formControlName="telefono" />
        </label>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button type="submit" [disabled]="cargando() || formulario.invalid">
          {{ cargando() ? 'Guardando…' : 'Guardar' }}
        </button>
      </form>
    </section>
  `,
  styles: `
    .pagina { max-width: 560px; display: grid; gap: 1.25rem; }
    header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; align-items: baseline; }
    h2 { margin: 0; }
    a { color: #1d4ed8; }
    form { display: grid; gap: 1rem; padding: 1.25rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    label { display: grid; gap: 0.35rem; font-size: 0.9rem; font-weight: 600; }
    input, select, button { padding: 0.75rem 0.9rem; border-radius: 0.5rem; font-size: 1rem; }
    input, select { border: 1px solid #d1d5db; }
    button { border: none; background: #1d4ed8; color: #ffffff; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { color: #b91c1c; font-size: 0.9rem; }
  `,
})
export class FormularioCobradorComponent implements OnInit {
  private readonly cobradoresServicio = inject(CobradoresServicio);
  private readonly formBuilder = inject(FormBuilder);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly cobradorId = signal<string | null>(this.ruta.snapshot.paramMap.get('id'));
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly formulario = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
    contrasena: [''],
    telefono: [''],
  });

  ngOnInit(): void {
    if (!this.cobradorId()) {
      this.formulario.controls.contrasena.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
      ]);
      this.formulario.controls.contrasena.updateValueAndValidity();
      return;
    }

    this.cargando.set(true);
    this.cobradoresServicio.obtenerPorId(this.cobradorId()!).subscribe({
      next: (cobrador) => {
        this.formulario.patchValue({
          nombre: cobrador.nombre,
          correo: cobrador.correo,
          telefono: cobrador.telefono ?? '',
        });
        this.formulario.controls.contrasena.setValidators([
          Validators.minLength(8),
          Validators.maxLength(72),
        ]);
        this.formulario.controls.contrasena.updateValueAndValidity();
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeErrorHttp(error, 'No se pudo cargar el cobrador.'));
      },
    });
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const valores = this.formulario.getRawValue();
    const id = this.cobradorId();

    if (id) {
      this.cobradoresServicio
        .actualizar(id, {
          nombre: valores.nombre.trim(),
          correo: valores.correo.trim().toLowerCase(),
          ...(valores.contrasena && { contrasena: valores.contrasena }),
          telefono: valores.telefono.trim() || null,
        })
        .subscribe({
          next: () => this.irAlListado(),
          error: (error: unknown) => this.fallar(error),
        });
      return;
    }

    this.cobradoresServicio
      .crear({
        nombre: valores.nombre.trim(),
        correo: valores.correo.trim().toLowerCase(),
        contrasena: valores.contrasena,
        ...(valores.telefono.trim() && { telefono: valores.telefono.trim() }),
      })
      .subscribe({
        next: () => this.irAlListado(),
        error: (error: unknown) => this.fallar(error),
      });
  }

  private irAlListado(): void {
    this.cargando.set(false);
    void this.router.navigate(['/app/cobradores']);
  }

  private fallar(error: unknown): void {
    this.cargando.set(false);
    this.error.set(mensajeErrorHttp(error, 'No se pudo guardar el cobrador.'));
  }
}
