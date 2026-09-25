import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { CobradoresServicio } from './cobradores.servicio';

@Component({
  selector: 'app-formulario-cobrador',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header>
        <h2>
          {{
            (cobradorId() ? 'cobradores.formulario.titulo_editar' : 'cobradores.formulario.titulo_nuevo')
              | translate
          }}
        </h2>
        <a routerLink="/app/cobradores">{{ 'comun.acciones.volver_listado' | translate }}</a>
      </header>

      <form [formGroup]="formulario" (ngSubmit)="enviar()">
        <label>
          {{ 'comun.filtros.nombre' | translate }}
          <input type="text" formControlName="nombre" />
        </label>

        <label>
          {{ 'comun.filtros.correo' | translate }}
          <input type="email" formControlName="correo" autocomplete="username" />
        </label>

        <label>
          {{
            (cobradorId() ? 'cobradores.formulario.contrasena_opcional' : 'cobradores.formulario.contrasena')
              | translate
          }}
          <input type="password" formControlName="contrasena" autocomplete="new-password" />
        </label>

        <label>
          {{ 'cobradores.formulario.telefono_opcional' | translate }}
          <input type="tel" formControlName="telefono" />
        </label>

        @if (error(); as claveError) {
          <p class="error">{{ claveError | translate }}</p>
        }

        <button type="submit" [disabled]="cargando() || formulario.invalid">
          {{ (cargando() ? 'comun.acciones.guardando' : 'comun.acciones.guardar') | translate }}
        </button>
      </form>
    </section>
  `,
  styleUrl: './formulario-cobrador.component.scss',
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
        this.error.set(claveMensajeErrorHttp(error, 'errores.cobradores.carga_formulario'));
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
    this.error.set(claveMensajeErrorHttp(error, 'errores.cobradores.guardar'));
  }
}
