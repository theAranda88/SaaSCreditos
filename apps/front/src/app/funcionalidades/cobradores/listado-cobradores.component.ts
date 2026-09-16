import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { CobradorPerfil, EstadoUsuario } from '@creditos/shared-types';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { CobradoresServicio } from './cobradores.servicio';

@Component({
  selector: 'app-listado-cobradores',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="pagina">
      <header class="encabezado">
        <div>
          <h2>Cobradores</h2>
          <p>Usuarios con rol cobrador. Inactivar no borra el histórico.</p>
        </div>
        <a routerLink="/app/cobradores/nuevo" class="boton-primario">Nuevo cobrador</a>
      </header>

      <form class="filtros" [formGroup]="filtros" (ngSubmit)="cargar()">
        <label>
          Nombre
          <input type="search" formControlName="nombre" />
        </label>
        <label>
          Correo
          <input type="search" formControlName="correo" />
        </label>
        <label>
          Estado
          <select formControlName="estado">
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </label>
        <button type="submit" [disabled]="cargando()">Buscar</button>
      </form>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (cargando()) {
        <p>Cargando cobradores…</p>
      } @else if (cobradores().length === 0) {
        <p class="vacio">No hay cobradores para mostrar.</p>
      } @else {
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (cobrador of cobradores(); track cobrador.id) {
                <tr>
                  <td>{{ cobrador.nombre }}</td>
                  <td>{{ cobrador.correo }}</td>
                  <td>{{ cobrador.telefono ?? '—' }}</td>
                  <td>
                    <span class="estado" [class.inactivo]="cobrador.estado === 'inactivo'">
                      {{ cobrador.estado }}
                    </span>
                  </td>
                  <td class="acciones">
                    <a [routerLink]="['/app/cobradores', cobrador.id]">Editar</a>
                    <button type="button" (click)="cambiarEstado(cobrador)">
                      {{ cobrador.estado === 'activo' ? 'Inactivar' : 'Activar' }}
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
  styles: `
    .pagina { display: grid; gap: 1.25rem; }
    .encabezado { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    h2 { margin: 0; }
    .encabezado p, .vacio { margin: 0.35rem 0 0; color: #64748b; }
    .filtros { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; padding: 1rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    label { display: grid; gap: 0.35rem; font-size: 0.85rem; font-weight: 600; }
    input, select, button, .boton-primario { padding: 0.65rem 0.8rem; border-radius: 0.5rem; font-size: 0.95rem; }
    input, select { border: 1px solid #d1d5db; }
    .filtros button, .boton-primario { border: none; background: #1d4ed8; color: #ffffff; font-weight: 600; text-decoration: none; cursor: pointer; }
    .boton-primario { display: inline-flex; align-items: center; }
    .tabla-contenedor { overflow-x: auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .estado { text-transform: capitalize; color: #166534; }
    .estado.inactivo { color: #b45309; }
    .acciones { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .acciones a { color: #1d4ed8; }
    .acciones button { background: #ffffff; color: #1f2937; border: 1px solid #d1d5db; }
    .error { color: #b91c1c; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
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
          this.error.set(mensajeErrorHttp(error, 'No se pudieron cargar los cobradores.'));
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
        this.error.set(mensajeErrorHttp(error, 'No se pudo cambiar el estado del cobrador.'));
      },
    });
  }
}
