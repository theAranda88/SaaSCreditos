import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { CobradorPerfil, ItemCartera, SegmentoCartera } from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { ROLES_ADMINISTRACION_NEGOCIO } from '../../nucleo/auth/roles-negocio';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { CobradoresServicio } from '../cobradores/cobradores.servicio';
import { CarteraServicio } from './cartera.servicio';

const SEGMENTOS: SegmentoCartera[] = ['vigente', 'mora', 'pagada'];

@Component({
  selector: 'app-listado-cartera',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>{{ 'cartera.listado.titulo' | translate }}</h2>
          <p>{{ 'cartera.listado.subtitulo' | translate }}</p>
        </div>
        @if (puedeAdministrar()) {
          <button
            type="button"
            class="boton-primario"
            (click)="aplicarMora()"
            [disabled]="aplicandoMora()"
          >
            {{ 'cartera.listado.aplicar_mora' | translate }}
          </button>
        }
      </header>

      <form class="filtros" [formGroup]="filtros" (ngSubmit)="cargar()">
        <label>
          {{ 'comun.filtros.segmento' | translate }}
          <select formControlName="segmento">
            @for (segmento of segmentos; track segmento) {
              <option [value]="segmento">{{ claveSegmento(segmento) | translate }}</option>
            }
          </select>
        </label>
        @if (puedeAdministrar()) {
          <label>
            {{ 'comun.filtros.cobrador' | translate }}
            <select formControlName="cobradorId">
              <option value="">{{ 'comun.filtros.todos' | translate }}</option>
              @for (cobrador of cobradores(); track cobrador.id) {
                <option [value]="cobrador.id">{{ cobrador.nombre }}</option>
              }
            </select>
          </label>
        }
        <button type="submit" [disabled]="cargando()">{{ 'comun.acciones.buscar' | translate }}</button>
      </form>

      @if (mensajeMora(); as resumen) {
        <p class="aviso">{{ 'cartera.listado.mora_aplicada' | translate: resumen }}</p>
      }

      @if (error(); as claveError) {
        <p class="error">{{ claveError | translate }}</p>
      }

      @if (cargando()) {
        <p>{{ 'comun.carga.cartera' | translate }}</p>
      } @else if (items().length === 0) {
        <p class="vacio">{{ 'cartera.listado.vacio' | translate }}</p>
      } @else {
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>{{ 'comun.filtros.cliente' | translate }}</th>
                <th>{{ 'comun.filtros.estado' | translate }}</th>
                <th>{{ 'cartera.listado.columna_saldo_pendiente' | translate }}</th>
                <th>{{ 'cartera.listado.columna_cuotas_mora' | translate }}</th>
                @if (puedeAdministrar()) {
                  <th>{{ 'comun.filtros.cobrador' | translate }}</th>
                }
                <th>{{ 'cartera.listado.columna_acciones' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.credito_id) {
                <tr [class.fila-mora]="item.cuotas_en_mora > 0">
                  <td>{{ item.cliente_nombre_completo }}</td>
                  <td>
                    <span class="etiqueta estado-{{ item.estado_credito }}">{{
                      ('comun.estados.' + item.estado_credito) | translate
                    }}</span>
                  </td>
                  <td>{{ item.saldo_pendiente }}</td>
                  <td>{{ item.cuotas_en_mora }}</td>
                  @if (puedeAdministrar()) {
                    <td>{{ item.cobrador_nombre ?? ('cartera.listado.sin_asignar' | translate) }}</td>
                  }
                  <td class="acciones">
                    <a [routerLink]="['/app/creditos', item.credito_id]">{{
                      'cartera.listado.ver_credito' | translate
                    }}</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styleUrl: './listado-cartera.component.scss',
})
export class ListadoCarteraComponent implements OnInit {
  private readonly carteraServicio = inject(CarteraServicio);
  private readonly cobradoresServicio = inject(CobradoresServicio);
  private readonly authServicio = inject(AuthServicio);
  private readonly formBuilder = inject(FormBuilder);

  readonly segmentos = SEGMENTOS;
  readonly items = signal<ItemCartera[]>([]);
  readonly cobradores = signal<CobradorPerfil[]>([]);
  readonly cargando = signal(false);
  readonly aplicandoMora = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensajeMora = signal<{ cuotas: number; creditos: number } | null>(null);

  readonly filtros = this.formBuilder.nonNullable.group({
    segmento: ['vigente' as SegmentoCartera],
    cobradorId: [''],
  });

  readonly puedeAdministrar = computed(() => {
    const rol = this.authServicio.perfilActual()?.rol;
    return rol !== undefined && ROLES_ADMINISTRACION_NEGOCIO.includes(rol);
  });

  ngOnInit(): void {
    if (this.puedeAdministrar()) {
      this.cobradoresServicio.listar({ estado: 'activo' }).subscribe({
        next: (cobradores) => this.cobradores.set(cobradores),
        error: () => this.cobradores.set([]),
      });
    }

    this.cargar();
  }

  cargar(): void {
    const { segmento, cobradorId } = this.filtros.getRawValue();
    this.cargando.set(true);
    this.error.set(null);

    this.carteraServicio
      .listar({
        segmento,
        cobradorId: cobradorId || undefined,
      })
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.cargando.set(false);
          this.error.set(claveMensajeErrorHttp(error, 'errores.cartera.carga'));
        },
      });
  }

  aplicarMora(): void {
    this.aplicandoMora.set(true);
    this.mensajeMora.set(null);
    this.error.set(null);

    this.carteraServicio.aplicarMora().subscribe({
      next: (resultado) => {
        this.aplicandoMora.set(false);
        this.mensajeMora.set({
          cuotas: resultado.cuotas_actualizadas,
          creditos: resultado.creditos_actualizados,
        });
        this.filtros.patchValue({ segmento: 'mora' });
        this.cargar();
      },
      error: (error: unknown) => {
        this.aplicandoMora.set(false);
        this.error.set(claveMensajeErrorHttp(error, 'errores.cartera.aplicar_mora'));
      },
    });
  }

  claveSegmento(segmento: SegmentoCartera): string {
    switch (segmento) {
      case 'vigente':
        return 'cartera.listado.segmento_vigente';
      case 'mora':
        return 'cartera.listado.segmento_mora';
      case 'pagada':
        return 'cartera.listado.segmento_pagada';
    }
  }
}
