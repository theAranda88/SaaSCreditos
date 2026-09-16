import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { TipoDocumento } from '@creditos/shared-types';
import { TIPOS_DOCUMENTO } from '../../nucleo/constantes/documentos.constantes';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { ClientesServicio } from './clientes.servicio';

@Component({
  selector: 'app-formulario-cliente',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="pagina">
      <header>
        <h2>{{ clienteId() ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
        <a routerLink="/app/clientes">Volver al listado</a>
      </header>

      <form [formGroup]="formulario" (ngSubmit)="enviar()">
        <label>
          Nombre completo
          <input type="text" formControlName="nombreCompleto" />
        </label>

        <label>
          Tipo de documento
          <select formControlName="tipoDocumento">
            @for (tipo of tiposDocumento; track tipo) {
              <option [value]="tipo">{{ tipo }}</option>
            }
          </select>
        </label>

        <label>
          Número de documento
          <input type="text" formControlName="numeroDocumento" />
        </label>

        <label>
          Teléfono
          <input type="tel" formControlName="telefono" />
        </label>

        <label>
          Dirección (opcional)
          <input type="text" formControlName="direccion" />
        </label>

        <label>
          Referencia de ubicación (opcional)
          <input type="text" formControlName="referenciaUbicacion" />
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
    direccion: [''],
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
          referenciaUbicacion: cliente.referencia_ubicacion ?? '',
        });
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeErrorHttp(error, 'No se pudo cargar el cliente.'));
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
      ...(valores.direccion.trim() && { direccion: valores.direccion.trim() }),
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
        this.error.set(mensajeErrorHttp(error, 'No se pudo guardar el cliente.'));
      },
    });
  }
}
