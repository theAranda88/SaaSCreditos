import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthServicio } from '../../../nucleo/auth/auth.servicio';
import { mensajeErrorHttp } from '../../../nucleo/http/mensaje-error-http';
import { NegociosServicio } from '../../negocios/negocios.servicio';

@Component({
  selector: 'app-configuracion',
  imports: [ReactiveFormsModule],
  template: `
    <section class="pagina">
      <header>
        <h2>Configuración del negocio</h2>
        <p>Datos básicos de su empresa en el sistema.</p>
      </header>

      @if (cargando()) {
        <p>Cargando configuración…</p>
      } @else {
        <form [formGroup]="formulario" (ngSubmit)="guardar()">
          <label>
            Nombre comercial
            <input type="text" formControlName="nombreComercial" maxlength="180" />
          </label>

          <label>
            Moneda
            <input type="text" formControlName="moneda" maxlength="3" class="moneda" />
          </label>

          @if (mensajeExito()) {
            <p class="exito">{{ mensajeExito() }}</p>
          }

          @if (error()) {
            <p class="error">{{ error() }}</p>
          }

          @if (!esPropietario()) {
            <p class="aviso">Solo el propietario puede guardar cambios.</p>
          }

          <button type="submit" [disabled]="guardando() || formulario.invalid || !esPropietario()">
            {{ guardando() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </form>
      }
    </section>
  `,
  styles: `
    .pagina { max-width: 560px; display: grid; gap: 1rem; }
    header h2 { margin: 0; }
    header p { margin: 0.35rem 0 0; color: #64748b; }
    form { display: grid; gap: 1rem; padding: 1.25rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    label { display: grid; gap: 0.35rem; font-size: 0.9rem; font-weight: 600; }
    input, button { padding: 0.75rem 0.9rem; border-radius: 0.5rem; font-size: 1rem; }
    input { border: 1px solid #d1d5db; }
    .moneda { text-transform: uppercase; }
    button { border: none; background: #1d4ed8; color: #ffffff; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { color: #b91c1c; margin: 0; }
    .exito { color: #166534; margin: 0; }
    .aviso { margin: 0; color: #9a3412; font-size: 0.9rem; }
  `,
})
export class ConfiguracionComponent implements OnInit {
  private readonly negociosServicio = inject(NegociosServicio);
  private readonly authServicio = inject(AuthServicio);
  private readonly formBuilder = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly esPropietario = computed(
    () => this.authServicio.perfilActual()?.rol === 'propietario',
  );

  readonly formulario = this.formBuilder.nonNullable.group({
    nombreComercial: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]],
    moneda: ['COP', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
  });

  ngOnInit(): void {
    this.negociosServicio.obtenerMiNegocio().subscribe({
      next: (negocio) => {
        this.formulario.reset({
          nombreComercial: negocio.nombre_comercial,
          moneda: negocio.moneda,
        });
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeErrorHttp(error, 'No se pudo cargar la configuración del negocio.'));
      },
    });
  }

  guardar(): void {
    if (this.formulario.invalid || !this.esPropietario() || this.guardando()) {
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    this.mensajeExito.set(null);

    const { nombreComercial, moneda } = this.formulario.getRawValue();

    this.negociosServicio
      .actualizarMiNegocio({
        nombreComercial: nombreComercial.trim(),
        moneda: moneda.trim().toUpperCase(),
      })
      .subscribe({
        next: (negocio) => {
          this.formulario.reset({
            nombreComercial: negocio.nombre_comercial,
            moneda: negocio.moneda,
          });
          this.guardando.set(false);
          this.mensajeExito.set('Configuración guardada correctamente.');
        },
        error: (error: unknown) => {
          this.guardando.set(false);
          this.error.set(mensajeErrorHttp(error, 'No se pudo guardar la configuración.'));
        },
      });
  }
}
