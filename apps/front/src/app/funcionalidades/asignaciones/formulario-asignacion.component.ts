import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type {
  AsignacionPerfil,
  ClientePerfil,
  CobradorPerfil,
  CreditoPerfil,
} from '@creditos/shared-types';
import { forkJoin } from 'rxjs';
import { ESTADOS_CREDITO_ASIGNABLES } from '../../nucleo/constantes/asignaciones.constantes';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
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
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header>
        <h2>{{ 'asignaciones.formulario.titulo' | translate }}</h2>
        <a routerLink="/app/asignaciones">{{ 'comun.acciones.volver_listado' | translate }}</a>
      </header>

      <form [formGroup]="formulario" (ngSubmit)="revisar()">
        <label>
          {{ 'creditos.listado.titulo' | translate }}
          <select formControlName="creditoId">
            <option value="">{{ 'asignaciones.formulario.credito_placeholder' | translate }}</option>
            @for (credito of creditosAsignables(); track credito.id) {
              <option [value]="credito.id">
                {{ etiquetaCredito(credito) }}
              </option>
            }
          </select>
        </label>

        <label>
          {{ 'comun.filtros.cobrador' | translate }}
          <select formControlName="cobradorId">
            <option value="">{{ 'asignaciones.formulario.cobrador_placeholder' | translate }}</option>
            @for (cobrador of cobradores(); track cobrador.id) {
              <option [value]="cobrador.id">{{ cobrador.nombre }}</option>
            }
          </select>
        </label>

        @if (error(); as claveError) {
          <p class="error">{{ claveError | translate }}</p>
        }

        @if (confirmacion(); as pendiente) {
          <article class="confirmacion">
            <p>
              {{
                'asignaciones.formulario.confirmar_pregunta'
                  | translate: { cliente: pendiente.clienteNombre, cobrador: pendiente.cobradorNombre }
              }}
            </p>
            @if (pendiente.cobradorActual) {
              <p class="aviso">
                {{
                  'asignaciones.formulario.aviso_reasignacion'
                    | translate: { cobradorActual: pendiente.cobradorActual }
                }}
              </p>
            }
            <div class="acciones">
              <button type="button" class="secundario" (click)="cancelarConfirmacion()" [disabled]="cargando()">
                {{ 'comun.acciones.cancelar' | translate }}
              </button>
              <button type="button" (click)="confirmar()" [disabled]="cargando()">
                {{
                  (cargando() ? 'comun.acciones.asignando' : 'asignaciones.formulario.confirmar_asignacion')
                    | translate
                }}
              </button>
            </div>
          </article>
        } @else {
          <button type="submit" [disabled]="cargando() || formulario.invalid">
            {{ 'asignaciones.formulario.revisar' | translate }}
          </button>
        }
      </form>
    </section>
  `,
  styleUrl: './formulario-asignacion.component.scss',
})
export class FormularioAsignacionComponent implements OnInit {
  private readonly asignacionesServicio = inject(AsignacionesServicio);
  private readonly creditosServicio = inject(CreditosServicio);
  private readonly cobradoresServicio = inject(CobradoresServicio);
  private readonly clientesServicio = inject(ClientesServicio);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

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
        this.error.set(claveMensajeErrorHttp(error, 'errores.asignaciones.carga_formulario'));
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
    const cobrador = activa
      ? this.nombreCobrador(activa.cobrador_id)
      : this.translate.instant('asignaciones.formulario.sin_cobrador');
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
      this.error.set('asignaciones.formulario.error_seleccion');
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
          this.error.set(claveMensajeErrorHttp(error, 'errores.asignaciones.asignar'));
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
