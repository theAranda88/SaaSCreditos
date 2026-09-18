import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type {
  AsignacionPerfil,
  ClientePerfil,
  CobradorPerfil,
  CreditoPerfil,
} from '@creditos/shared-types';
import { forkJoin } from 'rxjs';
import { ESTADOS_CREDITO_ASIGNABLES } from '../../nucleo/constantes/asignaciones.constantes';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { ClientesServicio } from '../clientes/clientes.servicio';
import { CobradoresServicio } from '../cobradores/cobradores.servicio';
import { CreditosServicio } from '../creditos/creditos.servicio';
import { AsignacionesServicio } from './asignaciones.servicio';

type ConfirmacionAsignacion = {
  creditoId: string;
  cobradorId: string;
  clienteNombre: string;
  cobradorNombre: string;
  cobradorActual: string | null;
};

@Component({
  selector: 'app-formulario-asignacion',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="pagina">
      <header>
        <h2>Asignar cartera</h2>
        <a routerLink="/app/asignaciones">Volver al listado</a>
      </header>

      <form [formGroup]="formulario" (ngSubmit)="revisar()">
        <label>
          Crédito
          <select formControlName="creditoId">
            <option value="">Seleccione un crédito activo o en mora</option>
            @for (credito of creditosAsignables(); track credito.id) {
              <option [value]="credito.id">
                {{ etiquetaCredito(credito) }}
              </option>
            }
          </select>
        </label>

        <label>
          Cobrador
          <select formControlName="cobradorId">
            <option value="">Seleccione un cobrador activo</option>
            @for (cobrador of cobradores(); track cobrador.id) {
              <option [value]="cobrador.id">{{ cobrador.nombre }}</option>
            }
          </select>
        </label>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        @if (confirmacion(); as pendiente) {
          <article class="confirmacion">
            <p>
              ¿Asignar el crédito de <strong>{{ pendiente.clienteNombre }}</strong>
              a <strong>{{ pendiente.cobradorNombre }}</strong>?
            </p>
            @if (pendiente.cobradorActual) {
              <p class="aviso">
                Hoy lo tiene {{ pendiente.cobradorActual }}. Se cerrará esa asignación y quedará
                una sola activa.
              </p>
            }
            <div class="acciones">
              <button type="button" class="secundario" (click)="cancelarConfirmacion()" [disabled]="cargando()">
                Cancelar
              </button>
              <button type="button" (click)="confirmar()" [disabled]="cargando()">
                {{ cargando() ? 'Asignando…' : 'Confirmar asignación' }}
              </button>
            </div>
          </article>
        } @else {
          <button type="submit" [disabled]="cargando() || formulario.invalid">
            Revisar asignación
          </button>
        }
      </form>
    </section>
  `,
  styles: `
    .pagina { display: grid; gap: 1.25rem; max-width: 560px; }
    header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; align-items: baseline; }
    h2 { margin: 0; }
    a { color: #1d4ed8; }
    form { display: grid; gap: 0.9rem; padding: 1.25rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    label { display: grid; gap: 0.35rem; font-size: 0.9rem; font-weight: 600; }
    select, button { padding: 0.7rem 0.85rem; border-radius: 0.5rem; font-size: 1rem; }
    select { border: 1px solid #d1d5db; }
    button { border: none; background: #1d4ed8; color: #ffffff; font-weight: 600; cursor: pointer; }
    button.secundario { background: #ffffff; color: #334155; border: 1px solid #d1d5db; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { color: #b91c1c; margin: 0; }
    .confirmacion { display: grid; gap: 0.6rem; padding: 0.9rem; background: #eff6ff; border-radius: 0.5rem; }
    .confirmacion p { margin: 0; }
    .aviso { color: #1e40af; }
    .acciones { display: flex; flex-wrap: wrap; gap: 0.75rem; }
  `,
})
export class FormularioAsignacionComponent implements OnInit {
  private readonly asignacionesServicio = inject(AsignacionesServicio);
  private readonly creditosServicio = inject(CreditosServicio);
  private readonly cobradoresServicio = inject(CobradoresServicio);
  private readonly clientesServicio = inject(ClientesServicio);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  readonly creditos = signal<CreditoPerfil[]>([]);
  readonly clientes = signal<ClientePerfil[]>([]);
  readonly cobradores = signal<CobradorPerfil[]>([]);
  readonly asignacionesActivas = signal<AsignacionPerfil[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly confirmacion = signal<ConfirmacionAsignacion | null>(null);

  readonly formulario = this.formBuilder.nonNullable.group({
    creditoId: ['', Validators.required],
    cobradorId: ['', Validators.required],
  });

  ngOnInit(): void {
    const creditoId = this.ruta.snapshot.queryParamMap.get('creditoId') ?? '';

    forkJoin({
      creditos: this.creditosServicio.listar(),
      clientes: this.clientesServicio.listar(),
      cobradores: this.cobradoresServicio.listar({ estado: 'activo' }),
      asignaciones: this.asignacionesServicio.listar({ estado: 'activa' }),
    }).subscribe({
      next: ({ creditos, clientes, cobradores, asignaciones }) => {
        this.creditos.set(creditos);
        this.clientes.set(clientes);
        this.cobradores.set(cobradores);
        this.asignacionesActivas.set(asignaciones);
        if (creditoId) {
          this.formulario.patchValue({ creditoId });
        }
      },
      error: (error: unknown) => {
        this.error.set(mensajeErrorHttp(error, 'No se pudieron cargar créditos y cobradores.'));
      },
    });
  }

  creditosAsignables(): CreditoPerfil[] {
    return this.creditos().filter((credito) =>
      (ESTADOS_CREDITO_ASIGNABLES as readonly string[]).includes(credito.estado),
    );
  }

  etiquetaCredito(credito: CreditoPerfil): string {
    const activa = this.asignacionActiva(credito.id);
    const cobrador = activa ? this.nombreCobrador(activa.cobrador_id) : 'sin cobrador';
    return `${this.nombreCliente(credito)} · ${credito.monto_principal} · ${credito.estado} · ${cobrador}`;
  }

  revisar(): void {
    this.error.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { creditoId, cobradorId } = this.formulario.getRawValue();
    const credito = this.creditos().find((item) => item.id === creditoId);
    const cobrador = this.cobradores().find((item) => item.id === cobradorId);
    const activa = this.asignacionActiva(creditoId);

    if (!credito || !cobrador) {
      this.error.set('Seleccione un crédito y un cobrador válidos.');
      return;
    }

    this.confirmacion.set({
      creditoId,
      cobradorId,
      clienteNombre: this.nombreCliente(credito),
      cobradorNombre: cobrador.nombre,
      cobradorActual: activa ? this.nombreCobrador(activa.cobrador_id) : null,
    });
  }

  cancelarConfirmacion(): void {
    this.confirmacion.set(null);
  }

  confirmar(): void {
    const pendiente = this.confirmacion();
    if (!pendiente || this.cargando()) {
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.asignacionesServicio
      .asignar({ creditoId: pendiente.creditoId, cobradorId: pendiente.cobradorId })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          void this.router.navigate(['/app/asignaciones']);
        },
        error: (error: unknown) => {
          this.cargando.set(false);
          this.error.set(mensajeErrorHttp(error, 'No se pudo asignar la cartera.'));
        },
      });
  }

  private asignacionActiva(creditoId: string): AsignacionPerfil | undefined {
    return this.asignacionesActivas().find((asignacion) => asignacion.credito_id === creditoId);
  }

  private nombreCobrador(cobradorId: string): string {
    return this.cobradores().find((cobrador) => cobrador.id === cobradorId)?.nombre ?? cobradorId;
  }

  private nombreCliente(credito: CreditoPerfil): string {
    return (
      this.clientes().find((cliente) => cliente.id === credito.cliente_id)?.nombre_completo ??
      this.asignacionActiva(credito.id)?.credito.cliente_nombre_completo ??
      `crédito ${credito.id.slice(0, 8)}`
    );
  }
}
