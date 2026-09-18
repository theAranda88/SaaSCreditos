import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type {
  CobroDelDia,
  CobrosDelDiaRespuesta,
  MetodoPago,
  PagoPerfil,
  ResumenDiarioPago,
} from '@creditos/shared-types';
import {
  ETIQUETAS_METODO_PAGO,
  METODOS_PAGO,
} from '../../nucleo/constantes/pagos.constantes';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { fechaHoyIsoColombia } from '../../nucleo/utilidades/fecha-colombia';
import {
  infoDiaCalendario,
  vencimientoTrasladado,
} from '../../nucleo/utilidades/dias-habiles-colombia';
import { CobrosServicio } from './cobros.servicio';

type PasoJornada = 'lista' | 'confirmar' | 'exito';

@Component({
  selector: 'app-jornada-cobro',
  imports: [ReactiveFormsModule, DatePipe, RouterLink],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>Cobros del día</h2>
          <p class="fecha">
            {{ fechaConsulta() }}
            @if (infoFechaConsulta(); as info) {
              @if (!info.esHabil) {
                <span class="etiqueta inhabil">{{ info.etiqueta }}</span>
              }
            }
          </p>
        </div>
        <button type="button" class="boton-secundario" (click)="cargar()" [disabled]="cargando()">
          Actualizar
        </button>
      </header>

      @if (resumen(); as totales) {
        <div class="resumen" [class.inhabil]="!totales.dia_habil">
          <article>
            <span>Esperado</span>
            <strong>{{ totales.esperado }}</strong>
          </article>
          <article>
            <span>Cobrado</span>
            <strong>{{ totales.cobrado }}</strong>
          </article>
          <article>
            <span>Pendiente</span>
            <strong>{{ totales.pendiente }}</strong>
          </article>
        </div>
      }

      @if (respuestaCobros()?.dia_habil === false) {
        <p class="aviso inhabil">
          <span class="etiqueta inhabil">{{ infoFechaConsulta()?.etiqueta ?? 'Día inhábil' }}</span>
          {{ respuestaCobros()?.mensaje }}
        </p>
      }

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (paso() === 'lista') {
        @if (cargando()) {
          <p>Cargando obligaciones…</p>
        } @else if ((respuestaCobros()?.cobros?.length ?? 0) === 0) {
          <p class="vacio">
            @if (respuestaCobros()?.dia_habil) {
              No hay cuotas pendientes en su cartera. Verifique asignaciones en
              <a routerLink="/app/asignaciones">Mi cartera</a>.
            } @else {
              Hoy no hay jornada de cobro (domingo o festivo).
            }
          </p>
        } @else {
          <div class="lista-cobros">
            @for (cobro of respuestaCobros()?.cobros ?? []; track cobro.cuota_id) {
              <article class="tarjeta-cobro">
                <div class="info">
                  <h3>{{ cobro.cliente_nombre_completo }}</h3>
                  <p>
                    Cuota {{ cobro.numero_cuota }} · Vence {{ cobro.fecha_vencimiento }}
                    @if (esVencimientoInhabil(cobro.fecha_vencimiento)) {
                      <span class="etiqueta inhabil">{{ etiquetaDia(cobro.fecha_vencimiento) }}</span>
                    }
                    @if (esVencimientoTrasladado(cobro)) {
                      <span class="etiqueta trasladado">
                        Trasladado · cobro {{ cobro.fecha_cobro_efectiva }}
                      </span>
                    }
                  </p>
                  <p class="saldo">Saldo {{ cobro.saldo_pendiente }}</p>
                  @if (cobro.atrasado) {
                    <span class="etiqueta atraso">Atrasado</span>
                  }
                  @if (cobro.programado) {
                    <span class="etiqueta programado">Próximo</span>
                  }
                  <span class="etiqueta estado">{{ cobro.estado }}</span>
                </div>
                <button type="button" class="boton-cobrar" (click)="seleccionarCobro(cobro)">
                  Revisar cobro
                </button>
              </article>
            }
          </div>
        }
      }

      @if (paso() === 'confirmar' && cobroSeleccionado(); as cobro) {
        <section class="panel-cobro">
          <h3>Ficha rápida</h3>
          <dl>
            <div><dt>Cliente</dt><dd>{{ cobro.cliente_nombre_completo }}</dd></div>
            <div><dt>Cuota</dt><dd>{{ cobro.numero_cuota }}</dd></div>
            <div>
              <dt>Vencimiento</dt>
              <dd>
                {{ cobro.fecha_vencimiento }}
                @if (esVencimientoInhabil(cobro.fecha_vencimiento)) {
                  <span class="etiqueta inhabil">{{ etiquetaDia(cobro.fecha_vencimiento) }}</span>
                }
              </dd>
            </div>
            <div>
              <dt>Cobro efectivo</dt>
              <dd>
                {{ cobro.fecha_cobro_efectiva }}
                @if (esVencimientoTrasladado(cobro)) {
                  <span class="etiqueta trasladado">Trasladado</span>
                }
              </dd>
            </div>
            <div><dt>Saldo pendiente</dt><dd>{{ cobro.saldo_pendiente }}</dd></div>
          </dl>

          @if (historial().length > 0) {
            <div class="historial">
              <h4>Historial reciente</h4>
              <ul>
                @for (pago of historial(); track pago.id) {
                  <li>{{ pago.fecha_pago | date: 'short' }} · {{ pago.monto }} · {{ pago.estado }}</li>
                }
              </ul>
            </div>
          }

          <form [formGroup]="formulario" (ngSubmit)="revisar()">
            <label>
              Monto a cobrar
              <input type="number" formControlName="monto" min="0.01" step="0.01" inputmode="decimal" />
            </label>
            <label>
              Método
              <select formControlName="metodoPago">
                @for (metodo of metodosPago; track metodo) {
                  <option [value]="metodo">{{ etiquetasMetodo[metodo] }}</option>
                }
              </select>
            </label>
            <div class="acciones">
              <button type="button" class="boton-secundario" (click)="cancelar()">Volver</button>
              <button type="submit" class="boton-primario" [disabled]="formulario.invalid || guardando()">
                Revisar cobro
              </button>
            </div>
          </form>

          @if (confirmacion(); as datos) {
            <div class="confirmacion">
              <p>¿Confirma registrar <strong>{{ datos.monto }}</strong> por <strong>{{ etiquetasMetodo[datos.metodoPago] }}</strong>?</p>
              <div class="acciones">
                <button type="button" class="boton-secundario" (click)="cancelarConfirmacion()">
                  Corregir
                </button>
                <button type="button" class="boton-primario" (click)="confirmar()" [disabled]="guardando()">
                  Confirmar cobro
                </button>
              </div>
            </div>
          }
        </section>
      }

      @if (paso() === 'exito' && pagoRegistrado(); as pago) {
        <section class="exito">
          <h3>Cobro registrado</h3>
          <p>Monto: <strong>{{ pago.monto }}</strong></p>
          <p>Estado: {{ pago.estado }}</p>
          <button type="button" class="boton-primario" (click)="volverALista()">Volver a la jornada</button>
        </section>
      }
    </section>
  `,
  styles: `
    .pagina { display: grid; gap: 1rem; max-width: 720px; margin: 0 auto; }
    .encabezado { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    h2 { margin: 0; font-size: 1.5rem; }
    .fecha { margin: 0.25rem 0 0; color: #64748b; display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; }
    .saldo { margin: 0.15rem 0 0; color: #475569; font-size: 0.9rem; }
    .resumen { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
    .resumen article { padding: 0.9rem; border-radius: 0.75rem; background: #ffffff; border: 1px solid #e5e7eb; text-align: center; }
    .resumen.inhabil { opacity: 0.7; }
    .resumen span { display: block; font-size: 0.8rem; color: #64748b; }
    .resumen strong { font-size: 1.1rem; }
    .lista-cobros { display: grid; gap: 0.75rem; }
    .tarjeta-cobro { display: flex; gap: 0.75rem; align-items: center; justify-content: space-between; padding: 1rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.85rem; }
    .info h3 { margin: 0 0 0.25rem; font-size: 1.05rem; }
    .info p { margin: 0; color: #64748b; font-size: 0.9rem; }
    .etiqueta { display: inline-block; margin-top: 0.35rem; margin-right: 0.35rem; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.75rem; text-transform: capitalize; }
    .atraso { background: #fee2e2; color: #b91c1c; }
    .programado { background: #dbeafe; color: #1d4ed8; }
    .estado { background: #ecfdf5; color: #166534; }
    .inhabil { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
    .trasladado { background: #f5f3ff; color: #5b21b6; }
    .vacio a { color: #1d4ed8; font-weight: 600; }
    .boton-cobrar, .boton-primario { min-height: 3rem; min-width: 6.5rem; padding: 0.75rem 1rem; border: none; border-radius: 0.75rem; background: #1d4ed8; color: #ffffff; font-size: 1rem; font-weight: 700; cursor: pointer; }
    .boton-secundario { min-height: 3rem; padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 0.75rem; background: #ffffff; cursor: pointer; }
    .panel-cobro, .exito { padding: 1rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.85rem; display: grid; gap: 1rem; }
    dl { display: grid; gap: 0.5rem; margin: 0; }
    dl div { display: flex; justify-content: space-between; gap: 1rem; }
    dt { color: #64748b; }
    dd { margin: 0; font-weight: 600; text-align: right; }
    form { display: grid; gap: 0.85rem; }
    label { display: grid; gap: 0.35rem; font-weight: 600; font-size: 0.9rem; }
    input, select { padding: 0.85rem; border: 1px solid #d1d5db; border-radius: 0.65rem; font-size: 1rem; }
    .acciones { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .confirmacion { padding: 1rem; border-radius: 0.75rem; background: #eff6ff; border: 1px solid #bfdbfe; }
    .historial ul { margin: 0; padding-left: 1.1rem; color: #475569; font-size: 0.9rem; }
    .aviso, .vacio { margin: 0; padding: 1rem; border-radius: 0.75rem; background: #fff7ed; color: #9a3412; }
    .error { color: #b91c1c; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    @media (max-width: 540px) {
      .resumen { grid-template-columns: 1fr; }
      .tarjeta-cobro { flex-direction: column; align-items: stretch; }
      .boton-cobrar { width: 100%; }
    }
  `,
})
export class JornadaCobroComponent implements OnInit {
  private readonly cobrosServicio = inject(CobrosServicio);
  private readonly formBuilder = inject(FormBuilder);
  private readonly ruta = inject(ActivatedRoute);

  readonly metodosPago = METODOS_PAGO;
  readonly etiquetasMetodo = ETIQUETAS_METODO_PAGO;

  readonly fechaConsulta = signal(this.fechaHoyIso());
  readonly infoFechaConsulta = signal(infoDiaCalendario(this.fechaHoyIso()));
  readonly respuestaCobros = signal<CobrosDelDiaRespuesta | null>(null);
  readonly resumen = signal<ResumenDiarioPago | null>(null);
  readonly cobroSeleccionado = signal<CobroDelDia | null>(null);
  readonly historial = signal<PagoPerfil[]>([]);
  readonly confirmacion = signal<{ monto: number; metodoPago: MetodoPago } | null>(null);
  readonly pagoRegistrado = signal<PagoPerfil | null>(null);
  readonly paso = signal<PasoJornada>('lista');
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly formulario = this.formBuilder.nonNullable.group({
    monto: [0, [Validators.required, Validators.min(0.01)]],
    metodoPago: ['efectivo', Validators.required],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const fecha = this.fechaConsulta();
    this.cargando.set(true);
    this.error.set(null);

    const creditoId = this.ruta.snapshot.queryParamMap.get('creditoId');

    this.cobrosServicio.listarCobrosDelDia(fecha).subscribe({
      next: (respuesta) => {
        this.respuestaCobros.set(respuesta);
        this.infoFechaConsulta.set(infoDiaCalendario(respuesta.fecha));
        this.cargando.set(false);

        if (creditoId) {
          const cobro = respuesta.cobros.find((item) => item.credito_id === creditoId);
          if (cobro) {
            this.seleccionarCobro(cobro);
          }
        }
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeErrorHttp(error, 'No se pudieron cargar los cobros del día.'));
      },
    });

    this.cobrosServicio.resumenDiario(fecha).subscribe({
      next: (totales) => {
        this.resumen.set(totales);
        this.infoFechaConsulta.set(infoDiaCalendario(totales.fecha));
      },
      error: () => {
        /* El resumen es complementario; el listado ya muestra el error principal. */
      },
    });
  }

  seleccionarCobro(cobro: CobroDelDia): void {
    this.cobroSeleccionado.set(cobro);
    this.paso.set('confirmar');
    this.confirmacion.set(null);
    this.formulario.reset({
      monto: Number(cobro.saldo_pendiente),
      metodoPago: 'efectivo',
    });

    this.cobrosServicio.listarHistorial(cobro.credito_id).subscribe({
      next: (pagos) => this.historial.set(pagos.slice(0, 5)),
      error: () => this.historial.set([]),
    });
  }

  revisar(): void {
    if (this.formulario.invalid || !this.cobroSeleccionado()) {
      return;
    }

    const { monto, metodoPago } = this.formulario.getRawValue();
    const saldo = Number(this.cobroSeleccionado()?.saldo_pendiente ?? 0);

    if (monto > saldo) {
      this.error.set('El monto no puede superar el saldo pendiente.');
      return;
    }

    this.error.set(null);
    this.confirmacion.set({ monto, metodoPago: metodoPago as MetodoPago });
  }

  confirmar(): void {
    const cobro = this.cobroSeleccionado();
    const datos = this.confirmacion();

    if (!cobro || !datos || this.guardando()) {
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.cobrosServicio
      .registrarPago({
        cuotaId: cobro.cuota_id,
        monto: datos.monto,
        metodoPago: datos.metodoPago,
      })
      .subscribe({
        next: (pago) => {
          this.guardando.set(false);
          this.pagoRegistrado.set(pago);
          this.paso.set('exito');
          this.confirmacion.set(null);
        },
        error: (error: unknown) => {
          this.guardando.set(false);
          this.error.set(mensajeErrorHttp(error, 'No se pudo registrar el cobro.'));
        },
      });
  }

  cancelarConfirmacion(): void {
    this.confirmacion.set(null);
  }

  cancelar(): void {
    this.cobroSeleccionado.set(null);
    this.historial.set([]);
    this.confirmacion.set(null);
    this.paso.set('lista');
  }

  volverALista(): void {
    this.pagoRegistrado.set(null);
    this.cobroSeleccionado.set(null);
    this.paso.set('lista');
    this.cargar();
  }

  esVencimientoInhabil(fechaIso: string): boolean {
    return !infoDiaCalendario(fechaIso).esHabil;
  }

  etiquetaDia(fechaIso: string): string {
    return infoDiaCalendario(fechaIso).etiqueta ?? 'Día inhábil';
  }

  esVencimientoTrasladado(cobro: CobroDelDia): boolean {
    return vencimientoTrasladado(cobro.fecha_vencimiento, cobro.fecha_cobro_efectiva);
  }

  private fechaHoyIso(): string {
    return fechaHoyIsoColombia();
  }
}
