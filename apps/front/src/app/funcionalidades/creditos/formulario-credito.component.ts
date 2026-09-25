import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { ClientePerfil, PeriodicidadCredito } from '@creditos/shared-types';
import {
  fechaHoyIso,
  PERIODICIDADES_CREDITO,
} from '../../nucleo/constantes/creditos.constantes';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { ClientesServicio } from '../clientes/clientes.servicio';
import { CreditosServicio } from './creditos.servicio';

@Component({
  selector: 'app-formulario-credito',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header>
        <h2>{{ 'creditos.formulario.titulo' | translate }}</h2>
        <a routerLink="/app/creditos">{{ 'comun.acciones.volver_listado' | translate }}</a>
      </header>

      <form [formGroup]="formulario" (ngSubmit)="enviar()">
        <label>
          {{ 'comun.filtros.cliente' | translate }}
          <select formControlName="clienteId">
            <option value="">{{ 'creditos.formulario.cliente_placeholder' | translate }}</option>
            @for (cliente of clientes(); track cliente.id) {
              <option [value]="cliente.id">{{ cliente.nombre_completo }}</option>
            }
          </select>
        </label>

        <label>
          {{ 'creditos.formulario.monto_principal' | translate }}
          <input type="number" min="0.01" step="0.01" formControlName="montoPrincipal" />
        </label>

        <label>
          {{ 'creditos.formulario.tasa_interes' | translate }}
          <input type="number" min="0" step="0.0001" formControlName="tasaInteres" />
        </label>

        <label class="casilla">
          <input type="checkbox" formControlName="cobraMora" />
          {{ 'creditos.formulario.cobra_mora' | translate }}
        </label>

        @if (formulario.controls.cobraMora.value) {
          <label>
            {{ 'creditos.formulario.valor_mora' | translate }}
            <input type="number" min="0.01" step="0.01" formControlName="valorMora" />
          </label>
        }

        <label>
          {{ 'creditos.formulario.periodicidad' | translate }}
          <select formControlName="periodicidad">
            @for (periodicidad of periodicidades; track periodicidad) {
              <option [value]="periodicidad">{{ periodicidad }}</option>
            }
          </select>
        </label>

        <label>
          {{ 'creditos.formulario.numero_cuotas' | translate }}
          <input type="number" min="1" step="1" formControlName="numeroCuotas" />
        </label>

        <label>
          {{ 'creditos.formulario.fecha_desembolso' | translate }}
          <input type="date" formControlName="fechaDesembolso" />
        </label>

        @if (error(); as claveError) {
          <p class="error">{{ claveError | translate }}</p>
        }

        <button type="submit" [disabled]="cargando() || formulario.invalid">
          {{
            (cargando() ? 'comun.acciones.creando' : 'creditos.formulario.crear_y_cuotas') | translate
          }}
        </button>
      </form>
    </section>
  `,
  styleUrl: './formulario-credito.component.scss',
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
        this.error.set(claveMensajeErrorHttp(error, 'errores.creditos.carga_clientes_filtro'));
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
        this.error.set('creditos.formulario.error_valor_mora');
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
          this.error.set(claveMensajeErrorHttp(error, 'errores.creditos.crear'));
        },
      });
  }
}
