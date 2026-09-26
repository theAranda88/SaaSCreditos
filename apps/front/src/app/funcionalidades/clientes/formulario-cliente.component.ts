import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { TipoDocumento } from '@creditos/shared-types';
import { TIPOS_DOCUMENTO } from '../../nucleo/constantes/documentos.constantes';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { ClientesServicio } from './clientes.servicio';

@Component({
  selector: 'app-formulario-cliente',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header>
        <h2>
          {{
            (clienteId() ? 'clientes.formulario.titulo_editar' : 'clientes.formulario.titulo_nuevo')
              | translate
          }}
        </h2>
        <a routerLink="/app/clientes">{{ 'comun.acciones.volver_listado' | translate }}</a>
      </header>

      <form [formGroup]="formulario" (ngSubmit)="enviar()">
        <label>
          {{ 'clientes.formulario.nombre_completo' | translate }}
          <input type="text" formControlName="nombreCompleto" />
        </label>

        <label>
          {{ 'clientes.formulario.tipo_documento' | translate }}
          <select formControlName="tipoDocumento">
            @for (tipo of tiposDocumento; track tipo) {
              <option [value]="tipo">{{ tipo }}</option>
            }
          </select>
        </label>

        <label>
          {{ 'clientes.formulario.numero_documento' | translate }}
          <input type="text" formControlName="numeroDocumento" />
        </label>

        <label>
          {{ 'comun.filtros.telefono' | translate }}
          <input type="tel" formControlName="telefono" />
        </label>

        <label>
          {{ 'clientes.formulario.direccion' | translate }}
          <input type="text" formControlName="direccion" />
        </label>

        <label>
          {{ 'clientes.formulario.barrio' | translate }}
          <input type="text" formControlName="barrio" />
        </label>

        <label>
          {{ 'clientes.formulario.referencia_opcional' | translate }}
          <input type="text" formControlName="referenciaUbicacion" />
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
  styleUrl: './formulario-cliente.component.scss',
})
export class FormularioClienteComponent implements OnInit {
  private readonly clientesServicio = inject(ClientesServicio);
  private readonly formBuilder = inject(FormBuilder);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly clienteId = signal<string | null>(this.ruta.snapshot.paramMap.get('id'));
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly formulario = this.formBuilder.nonNullable.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]],
    tipoDocumento: this.formBuilder.nonNullable.control<TipoDocumento>('CC', {
      validators: [Validators.required],
    }),
    numeroDocumento: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40)]],
    telefono: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(30)]],
    direccion: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(220)]],
    barrio: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(120)]],
    referenciaUbicacion: [''],
  });

  ngOnInit(): void {
    const id = this.clienteId();

    if (!id) {
      return;
    }

    this.cargando.set(true);
    this.clientesServicio.obtenerPorId(id).subscribe({
      next: (cliente) => {
        this.formulario.patchValue({
          nombreCompleto: cliente.nombre_completo,
          tipoDocumento: cliente.tipo_documento,
          numeroDocumento: cliente.numero_documento,
          telefono: cliente.telefono,
          direccion: cliente.direccion ?? '',
          barrio: cliente.barrio ?? '',
          referenciaUbicacion: cliente.referencia_ubicacion ?? '',
        });
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(claveMensajeErrorHttp(error, 'errores.clientes.carga_formulario'));
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
    const payload = {
      nombreCompleto: valores.nombreCompleto.trim(),
      tipoDocumento: valores.tipoDocumento,
      numeroDocumento: valores.numeroDocumento.trim(),
      telefono: valores.telefono.trim(),
      direccion: valores.direccion.trim(),
      barrio: valores.barrio.trim(),
      ...(valores.referenciaUbicacion.trim() && {
        referenciaUbicacion: valores.referenciaUbicacion.trim(),
      }),
    };

    const id = this.clienteId();
    const peticion = id
      ? this.clientesServicio.actualizar(id, payload)
      : this.clientesServicio.crear(payload);

    peticion.subscribe({
      next: () => {
        this.cargando.set(false);
        void this.router.navigate(['/app/clientes']);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(claveMensajeErrorHttp(error, 'errores.clientes.guardar'));
      },
    });
  }
}
