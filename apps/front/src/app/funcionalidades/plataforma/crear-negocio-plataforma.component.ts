import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { CodigoPlan } from '@creditos/shared-types';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { PlataformaServicio } from './plataforma.servicio';

const PLANES_INICIALES: { codigo: CodigoPlan; clave: string }[] = [
  { codigo: 'emprendedor', clave: 'plataforma.negocios.crear.plan_emprendedor' },
  { codigo: 'profesional', clave: 'plataforma.negocios.crear.plan_profesional' },
  { codigo: 'empresarial', clave: 'plataforma.negocios.crear.plan_empresarial' },
];

@Component({
  selector: 'app-crear-negocio-plataforma',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header>
        <a routerLink="/plataforma/negocios" class="volver">{{
          'plataforma.negocios.crear.volver' | translate
        }}</a>
        <h2>{{ 'plataforma.negocios.crear.titulo' | translate }}</h2>
        <p>{{ 'plataforma.negocios.crear.subtitulo' | translate }}</p>
      </header>

      <form [formGroup]="formulario" (ngSubmit)="enviar()">
        <fieldset>
          <legend>{{ 'plataforma.negocios.crear.seccion_negocio' | translate }}</legend>
          <label>
            {{ 'app.configuracion.nombre_comercial' | translate }}
            <input type="text" formControlName="nombreComercial" autocomplete="organization" />
          </label>
          <label>
            {{ 'plataforma.negocios.crear.moneda_iso' | translate }}
            <input type="text" formControlName="moneda" maxlength="3" />
          </label>
        </fieldset>

        <fieldset>
          <legend>{{ 'plataforma.negocios.crear.seccion_propietario' | translate }}</legend>
          <label>
            {{ 'comun.filtros.nombre' | translate }}
            <input type="text" formControlName="nombre" autocomplete="name" />
          </label>
          <label>
            {{ 'comun.filtros.correo' | translate }}
            <input type="email" formControlName="correo" autocomplete="email" />
          </label>
          <label>
            {{ 'plataforma.negocios.crear.contrasena_inicial' | translate }}
            <input type="password" formControlName="contrasena" autocomplete="new-password" />
          </label>
          <label>
            {{ 'cobradores.formulario.telefono_opcional' | translate }}
            <input type="tel" formControlName="telefono" />
          </label>
        </fieldset>

        <label>
          {{ 'plataforma.negocios.crear.plan_inicial' | translate }}
          <select formControlName="codigoPlan">
            @for (plan of planes; track plan.codigo) {
              <option [value]="plan.codigo">{{ plan.clave | translate }}</option>
            }
          </select>
        </label>

        @if (error(); as claveError) {
          <p class="error">{{ claveError | translate }}</p>
        }

        <div class="acciones">
          <button type="submit" [disabled]="cargando() || formulario.invalid">
            {{
              (cargando() ? 'comun.acciones.creando' : 'plataforma.negocios.crear.crear_negocio') | translate
            }}
          </button>
        </div>
      </form>
    </section>
  `,
  styleUrl: './crear-negocio-plataforma.component.scss',
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
        this.error.set(claveMensajeErrorHttp(err, 'errores.plataforma.crear'));
      },
    });
  }
}
