import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { ClientePerfil, PeriodicidadCredito } from '@creditos/shared-types';
import {
  fechaHoyIso,
  PERIODICIDADES_CREDITO,
} from '../../nucleo/constantes/creditos.constantes';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { ClientesServicio } from '../clientes/clientes.servicio';
import { CreditosServicio } from './creditos.servicio';

@Component({
  selector: 'app-formulario-credito',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="pagina">
      <header>
        <h2>Nuevo crédito</h2>
        <a routerLink="/app/creditos">Volver al listado</a>
      </header>

      <form [formGroup]="formulario" (ngSubmit)="enviar()">
        <label>
          Cliente
          <select formControlName="clienteId">
            <option value="">Seleccione un cliente activo</option>
            @for (cliente of clientes(); track cliente.id) {
              <option [value]="cliente.id">{{ cliente.nombre_completo }}</option>
            }
          </select>
        </label>

        <label>
          Monto principal (COP)
          <input type="number" min="0.01" step="0.01" formControlName="montoPrincipal" />
        </label>

        <label>
          Tasa de interés (%)
          <input type="number" min="0" step="0.0001" formControlName="tasaInteres" />
        </label>

        <label class="casilla">
          <input type="checkbox" formControlName="cobraMora" />
          Cobrar mora en este crédito
        </label>

        @if (formulario.controls.cobraMora.value) {
          <label>
            Valor de mora (COP, una vez por cuota vencida)
            <input type="number" min="0.01" step="0.01" formControlName="valorMora" />
          </label>
        }

        <label>
          Periodicidad
          <select formControlName="periodicidad">
            @for (periodicidad of periodicidades; track periodicidad) {
              <option [value]="periodicidad">{{ periodicidad }}</option>
            }
          </select>
        </label>

        <label>
          Número de cuotas
          <input type="number" min="1" step="1" formControlName="numeroCuotas" />
        </label>

        <label>
          Fecha de desembolso
          <input type="date" formControlName="fechaDesembolso" />
        </label>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button type="submit" [disabled]="cargando() || formulario.invalid">
          {{ cargando() ? 'Creando…' : 'Crear crédito y generar cuotas' }}
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
    .casilla { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; }
    .casilla input { width: auto; }
    input, select, button { padding: 0.75rem 0.9rem; border-radius: 0.5rem; font-size: 1rem; }
    input, select { border: 1px solid #d1d5db; }
    button { border: none; background: #1d4ed8; color: #ffffff; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { color: #b91c1c; font-size: 0.9rem; }
  `,
})
export class FormularioCreditoComponent implements OnInit {
  private readonly creditosServicio = inject(CreditosServicio);
  private readonly clientesServicio = inject(ClientesServicio);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly periodicidades = PERIODICIDADES_CREDITO;
  readonly clientes = signal<ClientePerfil[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly formulario = this.formBuilder.nonNullable.group({
    clienteId: ['', Validators.required],
    montoPrincipal: this.formBuilder.nonNullable.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
    tasaInteres: this.formBuilder.nonNullable.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    cobraMora: [false],
    valorMora: this.formBuilder.control<number | null>(null),
    periodicidad: this.formBuilder.nonNullable.control<PeriodicidadCredito>('diaria', {
      validators: [Validators.required],
    }),
    numeroCuotas: this.formBuilder.nonNullable.control<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    fechaDesembolso: [fechaHoyIso(), Validators.required],
  });

  ngOnInit(): void {
    this.clientesServicio.listar({ estado: 'activo' }).subscribe({
      next: (clientes) => this.clientes.set(clientes),
      error: (error: unknown) => {
        this.error.set(mensajeErrorHttp(error, 'No se pudieron cargar los clientes.'));
      },
    });
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const montoPrincipal = Number(valores.montoPrincipal);
    const tasaInteres = Number(valores.tasaInteres);
    const numeroCuotas = Number(valores.numeroCuotas);

    if (
      !valores.clienteId ||
      !Number.isFinite(montoPrincipal) ||
      montoPrincipal <= 0 ||
      !Number.isFinite(tasaInteres) ||
      tasaInteres < 0 ||
      !Number.isInteger(numeroCuotas) ||
      numeroCuotas < 1
    ) {
      this.formulario.markAllAsTouched();
      return;
    }

    let valorMora: number | undefined;
    if (valores.cobraMora) {
      const mora = Number(valores.valorMora);
      if (!Number.isFinite(mora) || mora <= 0) {
        this.error.set('Indique un valor de mora mayor a 0 o desactive el cobro de mora.');
        return;
      }
      valorMora = mora;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.creditosServicio
      .crear({
        clienteId: valores.clienteId,
        montoPrincipal,
        tasaInteres,
        ...(valorMora !== undefined && { valorMora }),
        periodicidad: valores.periodicidad,
        numeroCuotas,
        fechaDesembolso: valores.fechaDesembolso,
      })
      .subscribe({
        next: (creado) => {
          this.cargando.set(false);
          void this.router.navigate(['/app/creditos', creado.credito.id]);
        },
        error: (error: unknown) => {
          this.cargando.set(false);
          this.error.set(mensajeErrorHttp(error, 'No se pudo crear el crédito.'));
        },
      });
  }
}
