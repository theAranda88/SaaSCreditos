import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { CreditoPerfil, CuotaPerfil } from '@creditos/shared-types';
import { forkJoin } from 'rxjs';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import {
  fechaCobroEfectiva,
  infoDiaCalendario,
  vencimientoTrasladado,
} from '../../nucleo/utilidades/dias-habiles-colombia';
import { CreditosServicio } from './creditos.servicio';

@Component({
  selector: 'app-detalle-credito',
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header>
        <h2>{{ 'creditos.detalle.titulo' | translate }}</h2>
        <a routerLink="/app/creditos">{{ 'comun.acciones.volver_listado' | translate }}</a>
      </header>

      @if (error(); as claveError) {
        <p class="error">{{ claveError | translate }}</p>
      }

      @if (cargando()) {
        <p>{{ 'comun.carga.credito' | translate }}</p>
      } @else {
        @if (credito(); as actual) {
          <article class="tarjeta">
            <p>
              <strong>{{ 'creditos.detalle.etiqueta_estado' | translate }}</strong>
              {{ ('comun.estados.' + actual.estado) | translate }}
            </p>
            <p>
              <strong>{{ 'creditos.detalle.etiqueta_principal' | translate }}</strong>
              {{ actual.monto_principal }}
            </p>
            <p>
              <strong>{{ 'creditos.detalle.etiqueta_tasa' | translate }}</strong>
              {{ actual.tasa_interes }}%
            </p>
            <p>
              <strong>{{ 'creditos.detalle.etiqueta_mora' | translate }}</strong>
              {{ actual.valor_mora ?? ('creditos.detalle.mora_no_cobra' | translate) }}
            </p>
            <p>
              <strong>{{ 'creditos.detalle.etiqueta_plan' | translate }}</strong>
              {{
                'creditos.detalle.plan_texto'
                  | translate
                    : {
                        cuotas: actual.numero_cuotas,
                        periodicidad: actual.periodicidad,
                        fecha: actual.fecha_desembolso,
                      }
              }}
            </p>
            <p>
              <strong>{{ 'creditos.detalle.etiqueta_total' | translate }}</strong>
              {{ actual.condiciones_originales.total_a_pagar }}
            </p>
            <p class="aviso">{{ 'creditos.detalle.aviso_inmutable' | translate }}</p>
            <a [routerLink]="['/app/asignaciones/nueva']" [queryParams]="{ creditoId: actual.id }">
              {{ 'creditos.detalle.asignar_cartera' | translate }}
            </a>
          </article>

          @if (cuotas().length === 0) {
            <p class="vacio">{{ 'creditos.detalle.sin_cuotas' | translate }}</p>
          } @else {
            <div class="tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{{ 'creditos.detalle.columna_vencimiento' | translate }}</th>
                    <th>{{ 'creditos.detalle.columna_cobro_efectivo' | translate }}</th>
                    <th>{{ 'creditos.detalle.columna_esperado' | translate }}</th>
                    <th>{{ 'creditos.detalle.columna_saldo' | translate }}</th>
                    <th>{{ 'comun.filtros.estado' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cuota of cuotas(); track cuota.id) {
                    <tr [class.fila-inhabil]="!infoDiaCalendario(cuota.fecha_vencimiento).esHabil">
                      <td>{{ cuota.numero_cuota }}</td>
                      <td>
                        {{ cuota.fecha_vencimiento }}
                        @if (!infoDiaCalendario(cuota.fecha_vencimiento).esHabil) {
                          <span class="etiqueta inhabil">
                            {{ infoDiaCalendario(cuota.fecha_vencimiento).etiqueta }}
                          </span>
                        }
                      </td>
                      <td>
                        {{ fechaCobroEfectiva(cuota.fecha_vencimiento) }}
                        @if (
                          vencimientoTrasladado(
                            cuota.fecha_vencimiento,
                            fechaCobroEfectiva(cuota.fecha_vencimiento)
                          )
                        ) {
                          <span class="etiqueta trasladado">{{
                            'cobros.jornada.trasladado_cobro'
                              | translate: { fecha: fechaCobroEfectiva(cuota.fecha_vencimiento) }
                          }}</span>
                        }
                      </td>
                      <td>{{ cuota.monto_esperado }}</td>
                      <td>{{ cuota.saldo_pendiente }}</td>
                      <td>{{ ('comun.estados.' + cuota.estado) | translate }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      }
    </section>
  `,
  styleUrl: './detalle-credito.component.scss',
})
export class DetalleCreditoComponent implements OnInit {
  readonly infoDiaCalendario = infoDiaCalendario;
  readonly fechaCobroEfectiva = fechaCobroEfectiva;
  readonly vencimientoTrasladado = vencimientoTrasladado;
  private readonly creditosServicio = inject(CreditosServicio);
  private readonly ruta = inject(ActivatedRoute);

  readonly credito = signal<CreditoPerfil | null>(null);
  readonly cuotas = signal<CuotaPerfil[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.ruta.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('creditos.detalle.no_encontrado');
      return;
    }

    this.cargando.set(true);
    forkJoin({
      credito: this.creditosServicio.obtenerPorId(id),
      cuotas: this.creditosServicio.listarCuotas(id),
    }).subscribe({
      next: ({ credito, cuotas }) => {
        this.credito.set(credito);
        this.cuotas.set(cuotas);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(claveMensajeErrorHttp(error, 'errores.creditos.carga_detalle'));
      },
    });
  }
}
