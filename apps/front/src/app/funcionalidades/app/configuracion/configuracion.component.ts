import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthServicio } from '../../../nucleo/auth/auth.servicio';
import { claveMensajeErrorHttp } from '../../../nucleo/http/mensaje-error-http';
import { NegociosServicio } from '../../negocios/negocios.servicio';

@Component({
  selector: 'app-configuracion',
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <section class="pagina">
      <header>
        <h2>{{ 'app.configuracion.titulo' | translate }}</h2>
        <p>{{ 'app.configuracion.subtitulo' | translate }}</p>
      </header>

      @if (cargando()) {
        <p>{{ 'comun.carga.configuracion' | translate }}</p>
      } @else {
        <form [formGroup]="formulario" (ngSubmit)="guardar()">
          <label>
            {{ 'app.configuracion.nombre_comercial' | translate }}
            <input type="text" formControlName="nombreComercial" maxlength="180" />
          </label>

          <label>
            {{ 'app.configuracion.moneda' | translate }}
            <input type="text" formControlName="moneda" maxlength="3" class="moneda" />
          </label>

          @if (mensajeExito(); as claveExito) {
            <p class="exito">{{ claveExito | translate }}</p>
          }

          @if (error(); as claveError) {
            <p class="error">{{ claveError | translate }}</p>
          }

          @if (!esPropietario()) {
            <p class="aviso">{{ 'app.configuracion.solo_propietario' | translate }}</p>
          }

          <button type="submit" [disabled]="guardando() || formulario.invalid || !esPropietario()">
            {{
              (guardando() ? 'comun.acciones.guardando' : 'app.configuracion.guardar_cambios') | translate
            }}
          </button>
        </form>
      }
    </section>
  `,
  styleUrl: './configuracion.component.scss',
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
        this.error.set(claveMensajeErrorHttp(error, 'errores.configuracion.carga'));
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
          this.mensajeExito.set('app.configuracion.exito_guardado');
        },
        error: (error: unknown) => {
          this.guardando.set(false);
          this.error.set(claveMensajeErrorHttp(error, 'errores.configuracion.guardar'));
        },
      });
  }
}
