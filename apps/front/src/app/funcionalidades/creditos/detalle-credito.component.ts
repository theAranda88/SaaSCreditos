import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { CreditoPerfil, CuotaPerfil } from '@creditos/shared-types';
import { forkJoin } from 'rxjs';
import { mensajeErrorHttp } from '../../nucleo/http/mensaje-error-http';
import { CreditosServicio } from './creditos.servicio';

@Component({
  selector: 'app-detalle-credito',
  imports: [RouterLink],
  template: `
    <section class="pagina">
      <header>
        <h2>Plan de cuotas</h2>
        <a routerLink="/app/creditos">Volver al listado</a>
      </header>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (cargando()) {
        <p>Cargando crédito…</p>
      } @else {
        @if (credito(); as actual) {
        <article class="tarjeta">
          <p><strong>Estado:</strong> {{ actual.estado }}</p>
          <p><strong>Principal:</strong> {{ actual.monto_principal }}</p>
          <p><strong>Tasa:</strong> {{ actual.tasa_interes }}%</p>
          <p><strong>Mora:</strong> {{ actual.valor_mora ?? 'No cobra' }}</p>
          <p>
            <strong>Plan:</strong> {{ actual.numero_cuotas }} cuotas {{ actual.periodicidad }}
            desde {{ actual.fecha_desembolso }}
          </p>
          <p>
            <strong>Total a pagar (snapshot):</strong>
            {{ actual.condiciones_originales.total_a_pagar }}
          </p>
          <p class="aviso">Las condiciones originales no se modifican después del alta.</p>
        </article>

        @if (cuotas().length === 0) {
          <p class="vacio">Este crédito no tiene cuotas.</p>
        } @else {
          <div class="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vencimiento</th>
                  <th>Esperado</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (cuota of cuotas(); track cuota.id) {
                  <tr>
                    <td>{{ cuota.numero_cuota }}</td>
                    <td>{{ cuota.fecha_vencimiento }}</td>
                    <td>{{ cuota.monto_esperado }}</td>
                    <td>{{ cuota.saldo_pendiente }}</td>
                    <td>{{ cuota.estado }}</td>
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
  styles: `
    .pagina { display: grid; gap: 1.25rem; }
    header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; align-items: baseline; }
    h2 { margin: 0; }
    a { color: #1d4ed8; }
    .tarjeta, .tabla-contenedor { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
    .tarjeta { padding: 1.25rem; display: grid; gap: 0.35rem; }
    .tarjeta p { margin: 0; }
    .aviso, .vacio { color: #64748b; }
    .tabla-contenedor { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .error { color: #b91c1c; }
  `,
})
export class DetalleCreditoComponent implements OnInit {
  private readonly creditosServicio = inject(CreditosServicio);
  private readonly ruta = inject(ActivatedRoute);

  readonly credito = signal<CreditoPerfil | null>(null);
  readonly cuotas = signal<CuotaPerfil[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.ruta.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('Crédito no encontrado.');
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
        this.error.set(mensajeErrorHttp(error, 'No se pudo cargar el crédito.'));
      },
    });
  }
}
