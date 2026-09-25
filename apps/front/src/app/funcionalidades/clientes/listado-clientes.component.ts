import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { ClientePerfil, EstadoCliente } from '@creditos/shared-types';
import { claveMensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { ClientesServicio } from './clientes.servicio';

@Component({
  selector: 'app-listado-clientes',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>{{ 'clientes.listado.titulo' | translate }}</h2>
          <p>{{ 'clientes.listado.subtitulo' | translate }}</p>
        </div>
        <a routerLink="/app/clientes/nuevo" class="boton-primario">{{ 'clientes.listado.nuevo' | translate }}</a>
      </header>

      <form class="filtros" [formGroup]="filtros" (ngSubmit)="cargar()">
        <label>
          {{ 'comun.filtros.nombre' | translate }}
          <input type="search" formControlName="nombre" />
        </label>
        <label>
          {{ 'comun.filtros.documento' | translate }}
          <input type="search" formControlName="numeroDocumento" />
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
        <p>{{ 'comun.carga.clientes' | translate }}</p>
      } @else if (clientes().length === 0) {
        <p class="vacio">{{ 'clientes.listado.vacio' | translate }}</p>
      } @else {
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>{{ 'clientes.listado.columna_nombre' | translate }}</th>
                <th>{{ 'clientes.listado.columna_documento' | translate }}</th>
                <th>{{ 'clientes.listado.columna_telefono' | translate }}</th>
                <th>{{ 'comun.filtros.estado' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (cliente of clientes(); track cliente.id) {
                <tr>
                  <td>{{ cliente.nombre_completo }}</td>
                  <td>{{ cliente.tipo_documento }} {{ cliente.numero_documento }}</td>
                  <td>{{ cliente.telefono }}</td>
                  <td>
                    <span class="estado" [class.inactivo]="cliente.estado === 'inactivo'">
                      {{ ('comun.estados.' + cliente.estado) | translate }}
                    </span>
                  </td>
                  <td class="acciones">
                    <a [routerLink]="['/app/clientes', cliente.id]">{{ 'comun.acciones.editar' | translate }}</a>
                    <button type="button" (click)="cambiarEstado(cliente)">
                      {{
                        (cliente.estado === 'activo' ? 'comun.acciones.inactivar' : 'comun.acciones.activar')
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
export class ListadoClientesComponent implements OnInit {
  private readonly clientesServicio = inject(ClientesServicio);
  private readonly formBuilder = inject(FormBuilder);

  readonly clientes = signal<ClientePerfil[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly filtros = this.formBuilder.nonNullable.group({
    nombre: [''],
    numeroDocumento: [''],
    estado: [''],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const { nombre, numeroDocumento, estado } = this.filtros.getRawValue();

    this.clientesServicio
      .listar({
        ...(nombre.trim() && { nombre: nombre.trim() }),
        ...(numeroDocumento.trim() && { numeroDocumento: numeroDocumento.trim() }),
        ...(estado && { estado: estado as EstadoCliente }),
      })
      .subscribe({
        next: (clientes) => {
          this.clientes.set(clientes);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.cargando.set(false);
          this.error.set(claveMensajeErrorHttp(error, 'errores.clientes.carga_listado'));
        },
      });
  }

  cambiarEstado(cliente: ClientePerfil): void {
    const estado: EstadoCliente = cliente.estado === 'activo' ? 'inactivo' : 'activo';

    this.clientesServicio.cambiarEstado(cliente.id, estado).subscribe({
      next: (actualizado) => {
        this.clientes.update((lista) =>
          lista.map((item) => (item.id === actualizado.id ? actualizado : item)),
        );
      },
      error: (error: unknown) => {
        this.error.set(claveMensajeErrorHttp(error, 'errores.clientes.cambio_estado'));
      },
    });
  }
}
