import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { CobradorPerfil, EstadoUsuario } from '@creditos/shared-types';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { CobradoresServicio } from './cobradores.servicio';

@Component({
  selector: 'app-listado-cobradores',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>{{ 'cobradores.listado.titulo' | translate }}</h2>
          <p>{{ 'cobradores.listado.subtitulo' | translate }}</p>
        </div>
        <a routerLink="/app/cobradores/nuevo" class="boton-primario">{{ 'cobradores.listado.nuevo' | translate }}</a>
      </header>

      <form class="filtros" [formGroup]="filtros" (ngSubmit)="cargar()">
        <label>
          {{ 'comun.filtros.nombre' | translate }}
          <input type="search" formControlName="nombre" />
        </label>
        <label>
          {{ 'comun.filtros.correo' | translate }}
          <input type="search" formControlName="correo" />
        </label>
        <label>
          {{ 'comun.filtros.estado' | translate }}
          <select formControlName="estado">
            <option value="">{{ 'comun.filtros.todos' | translate }}</option>
            <option value="activo">{{ 'comun.estados.activo' | translate }}</option>
            <option value="inactivo">{{ 'comun.estados.inactivo' | translate }}</option>
          </select>
        </label>
        <button type="submit" [disabled]="cargando()">{{ 'comun.acciones.buscar' | translate }}</button>
      </form>

      @if (error(); as claveError) {
        <p class="error">{{ claveError | translate }}</p>
      }

      @if (cargando()) {
        <p>{{ 'comun.carga.cobradores' | translate }}</p>
      } @else if (cobradores().length === 0) {
        <p class="vacio">{{ 'cobradores.listado.vacio' | translate }}</p>
      } @else {
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>{{ 'comun.filtros.nombre' | translate }}</th>
                <th>{{ 'comun.filtros.correo' | translate }}</th>
                <th>{{ 'comun.filtros.telefono' | translate }}</th>
                <th>{{ 'comun.filtros.estado' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (cobrador of cobradores(); track cobrador.id) {
                <tr>
                  <td>{{ cobrador.nombre }}</td>
                  <td>{{ cobrador.correo }}</td>
                  <td>{{ cobrador.telefono ?? ('comun.vacio.guion' | translate) }}</td>
                  <td>
                    <span class="estado" [class.inactivo]="cobrador.estado === 'inactivo'">
                      {{ ('comun.estados.' + cobrador.estado) | translate }}
                    </span>
                  </td>
                  <td class="acciones">
                    <a [routerLink]="['/app/cobradores', cobrador.id]">{{ 'comun.acciones.editar' | translate }}</a>
                    <button type="button" (click)="cambiarEstado(cobrador)">
                      {{
                        (cobrador.estado === 'activo' ? 'comun.acciones.inactivar' : 'comun.acciones.activar')
                          | translate
                      }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class ListadoCobradoresComponent implements OnInit {
  private readonly cobradoresServicio = inject(CobradoresServicio);
  private readonly formBuilder = inject(FormBuilder);

  readonly cobradores = signal<CobradorPerfil[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly filtros = this.formBuilder.nonNullable.group({
    nombre: [''],
    correo: [''],
    estado: [''],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const { nombre, correo, estado } = this.filtros.getRawValue();

    this.cobradoresServicio
      .listar({
        ...(nombre.trim() && { nombre: nombre.trim() }),
        ...(correo.trim() && { correo: correo.trim() }),
        ...(estado && { estado: estado as EstadoUsuario }),
      })
      .subscribe({
        next: (cobradores) => {
          this.cobradores.set(cobradores);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.cargando.set(false);
          this.error.set(claveMensajeErrorHttp(error, 'errores.cobradores.carga_listado'));
        },
      });
  }

  cambiarEstado(cobrador: CobradorPerfil): void {
    const estado: EstadoUsuario = cobrador.estado === 'activo' ? 'inactivo' : 'activo';

    this.cobradoresServicio.cambiarEstado(cobrador.id, estado).subscribe({
      next: (actualizado) => {
        this.cobradores.update((lista) =>
          lista.map((item) => (item.id === actualizado.id ? actualizado : item)),
        );
      },
      error: (error: unknown) => {
        this.error.set(claveMensajeErrorHttp(error, 'errores.cobradores.cambio_estado'));
      },
    });
  }
}
