import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type {
  CobroDelDia,
  CobrosDelDiaRespuesta,
  MetodoPago,
  PagoPerfil,
  ResumenDiarioPago,
} from '@creditos/shared-types';
import { METODOS_PAGO } from '../../nucleo/constantes/pagos.constantes';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { fechaHoyIsoColombia } from '../../nucleo/utilidades/fecha-colombia';
import {
  infoDiaCalendario,
  vencimientoTrasladado,
} from '../../nucleo/utilidades/dias-habiles-colombia';
import { CobrosServicio } from './cobros.servicio';

type PasoJornada = 'lista' | 'confirmar' | 'exito';

@Component({
  selector: 'app-jornada-cobro',
  imports: [ReactiveFormsModule, DatePipe, RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>{{ 'cobros.jornada.titulo' | translate }}</h2>
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
          {{ 'comun.acciones.actualizar' | translate }}
        </button>
      </header>

      @if (resumen(); as totales) {
        <div class="resumen" [class.inhabil]="!totales.dia_habil">
          <article>
            <span>{{ 'cobros.jornada.resumen_esperado' | translate }}</span>
            <strong>{{ totales.esperado }}</strong>
          </article>
          <article>
            <span>{{ 'cobros.jornada.resumen_cobrado' | translate }}</span>
            <strong>{{ totales.cobrado }}</strong>
          </article>
          <article>
            <span>{{ 'cobros.jornada.resumen_pendiente' | translate }}</span>
            <strong>{{ totales.pendiente }}</strong>
          </article>
        </div>
      }

      @if (respuestaCobros()?.dia_habil === false) {
        <p class="aviso inhabil">
          <span class="etiqueta inhabil">{{ etiquetaDia(infoFechaConsulta()!.fecha) }}</span>
          {{ respuestaCobros()?.mensaje }}
        </p>
      }

      @if (error(); as claveError) {
        <p class="error">{{ claveError | translate }}</p>
      }

      @if (paso() === 'lista') {
        @if (cargando()) {
          <p>{{ 'comun.carga.obligaciones' | translate }}</p>
        } @else if ((respuestaCobros()?.cobros?.length ?? 0) === 0) {
          <p class="vacio">
            @if (respuestaCobros()?.dia_habil) {
              {{ 'cobros.jornada.vacio_con_cartera' | translate }}
              <a routerLink="/app/asignaciones">{{ 'comun.navegacion.mi_cartera' | translate }}</a>.
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
                    {{
                      'cobros.jornada.cuota_linea'
                        | translate: { numero: cobro.numero_cuota, fecha: cobro.fecha_vencimiento }
                    }}
                    @if (esVencimientoInhabil(cobro.fecha_vencimiento)) {
                      <span class="etiqueta inhabil">{{ etiquetaDia(cobro.fecha_vencimiento) }}</span>
                    }
                    @if (esVencimientoTrasladado(cobro)) {
                      <span class="etiqueta trasladado">
                        {{
                          'cobros.jornada.trasladado_cobro'
                            | translate: { fecha: cobro.fecha_cobro_efectiva }
                        }}
                      </span>
                    }
                  </p>
                  <p class="saldo">{{
                    'cobros.jornada.saldo' | translate: { monto: cobro.saldo_pendiente }
                  }}</p>
                  @if (cobro.atrasado) {
                    <span class="etiqueta atraso">{{ 'cobros.jornada.etiqueta_atrasado' | translate }}</span>
                  }
                  @if (cobro.programado) {
                    <span class="etiqueta programado">{{ 'cobros.jornada.etiqueta_proximo' | translate }}</span>
                  }
                  <span class="etiqueta estado">{{ cobro.estado }}</span>
                </div>
                <button type="button" class="boton-cobrar" (click)="seleccionarCobro(cobro)">
                  {{ 'cobros.jornada.revisar_cobro' | translate }}
                </button>
              </article>
            }
          </div>
        }
      }

      @if (paso() === 'confirmar' && cobroSeleccionado(); as cobro) {
        <section class="panel-cobro">
          <h3>{{ 'cobros.jornada.ficha_rapida' | translate }}</h3>
          <dl>
            <div><dt>{{ 'comun.filtros.cliente' | translate }}</dt><dd>{{ cobro.cliente_nombre_completo }}</dd></div>
            <div><dt>{{ 'cobros.jornada.campo_cuota' | translate }}</dt><dd>{{ cobro.numero_cuota }}</dd></div>
            <div>
              <dt>{{ 'cobros.jornada.campo_vencimiento' | translate }}</dt>
              <dd>
                {{ cobro.fecha_vencimiento }}
                @if (esVencimientoInhabil(cobro.fecha_vencimiento)) {
                  <span class="etiqueta inhabil">{{ etiquetaDia(cobro.fecha_vencimiento) }}</span>
                }
              </dd>
            </div>
            <div>
              <dt>{{ 'cobros.jornada.campo_cobro_efectivo' | translate }}</dt>
              <dd>
                {{ cobro.fecha_cobro_efectiva }}
                @if (esVencimientoTrasladado(cobro)) {
                  <span class="etiqueta trasladado">{{
                    'cobros.jornada.trasladado_cobro' | translate: { fecha: cobro.fecha_cobro_efectiva }
                  }}</span>
                }
              </dd>
            </div>
            <div><dt>{{ 'cobros.jornada.campo_saldo_pendiente' | translate }}</dt><dd>{{ cobro.saldo_pendiente }}</dd></div>
          </dl>

          @if (historial().length > 0) {
            <div class="historial">
              <h4>{{ 'cobros.jornada.historial_reciente' | translate }}</h4>
              <ul>
                @for (pago of historial(); track pago.id) {
                  <li>{{ pago.fecha_pago | date: 'short' }} · {{ pago.monto }} · {{ pago.estado }}</li>
                }
              </ul>
            </div>
          }

          <form [formGroup]="formulario" (ngSubmit)="revisar()">
            <label>
              {{ 'cobros.jornada.monto_a_cobrar' | translate }}
              <input type="number" formControlName="monto" min="0.01" step="0.01" inputmode="decimal" />
            </label>
            <label>
              {{ 'cobros.jornada.metodo' | translate }}
              <select formControlName="metodoPago">
                @for (metodo of metodosPago; track metodo) {
                  <option [value]="metodo">{{ claveMetodoPago(metodo) | translate }}</option>
                }
              </select>
            </label>
            <div class="acciones">
              <button type="button" class="boton-secundario" (click)="cancelar()">{{
                'cobros.jornada.volver' | translate
              }}</button>
              <button type="submit" class="boton-primario" [disabled]="formulario.invalid || guardando()">
                {{ 'cobros.jornada.revisar_cobro' | translate }}
              </button>
            </div>
          </form>

          @if (confirmacion(); as datos) {
            <div class="confirmacion">
              <p>
                {{
                  'cobros.jornada.confirmar_pregunta'
                    | translate
                      : {
                          monto: datos.monto,
                          metodo: (claveMetodoPago(datos.metodoPago) | translate),
                        }
                }}
              </p>
              <div class="acciones">
                <button type="button" class="boton-secundario" (click)="cancelarConfirmacion()">
                  {{ 'comun.acciones.corregir' | translate }}
                </button>
                <button type="button" class="boton-primario" (click)="confirmar()" [disabled]="guardando()">
                  {{ 'cobros.jornada.confirmar_cobro' | translate }}
                </button>
              </div>
            </div>
          }
        </section>
      }

      @if (paso() === 'exito' && pagoRegistrado(); as pago) {
        <section class="exito">
          <h3>{{ 'cobros.jornada.exito_titulo' | translate }}</h3>
          <p>{{ 'cobros.jornada.exito_monto' | translate }} <strong>{{ pago.monto }}</strong></p>
          <p>{{ 'cobros.jornada.exito_estado' | translate }} {{ ('comun.estados.' + pago.estado) | translate }}</p>
          <button type="button" class="boton-primario" (click)="volverALista()">{{
            'cobros.jornada.volver_jornada' | translate
          }}</button>
        </section>
      }
    </section>
  `,
  styleUrl: './jornada-cobro.component.scss',
})
export class JornadaCobroComponent implements OnInit {
  private readonly cobrosServicio = inject(CobrosServicio);
  private readonly formBuilder = inject(FormBuilder);
  private readonly ruta = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  readonly metodosPago = METODOS_PAGO;
  claveMetodoPago(metodo: MetodoPago): string {
    return `comun.metodos_pago.${metodo}`;
  }

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
        this.error.set(claveMensajeErrorHttp(error, 'errores.cobros.carga_jornada'));
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
      this.error.set('cobros.jornada.error_monto_saldo');
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
          this.error.set(claveMensajeErrorHttp(error, 'errores.cobros.registrar'));
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
    const info = infoDiaCalendario(fechaIso);
    if (info.motivo === 'domingo') {
      return this.translate.instant('comun.calendario.domingo');
    }
    if (info.motivo === 'festivo') {
      return this.translate.instant('comun.calendario.festivo');
    }
    return this.translate.instant('comun.calendario.dia_inhabil');
  }

  esVencimientoTrasladado(cobro: CobroDelDia): boolean {
    return vencimientoTrasladado(cobro.fecha_vencimiento, cobro.fecha_cobro_efectiva);
  }

  private fechaHoyIso(): string {
    return fechaHoyIsoColombia();
  }
}
