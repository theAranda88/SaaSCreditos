import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  CreditoCreado,
  CreditoPerfil,
  CuotaPerfil,
  EstadoCredito,
  PeriodicidadCredito,
} from '@creditos/shared-types';
import { Observable } from 'rxjs';

export type FiltrosCredito = {
  clienteId?: string;
  estado?: EstadoCredito;
};

export type CrearCreditoPayload = {
  clienteId: string;
  montoPrincipal: number;
  tasaInteres: number;
  valorMora?: number | null;
  periodicidad: PeriodicidadCredito;
  numeroCuotas: number;
  fechaDesembolso: string;
};

@Injectable({ providedIn: 'root' })
export class CreditosServicio {
  private readonly http = inject(HttpClient);
  private readonly urlBase = '/api/creditos';

  listar(filtros: FiltrosCredito = {}): Observable<CreditoPerfil[]> {
    let params = new HttpParams();

    if (filtros.clienteId) {
      params = params.set('clienteId', filtros.clienteId);
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }

    return this.http.get<CreditoPerfil[]>(this.urlBase, { params });
  }

  obtenerPorId(id: string): Observable<CreditoPerfil> {
    return this.http.get<CreditoPerfil>(`${this.urlBase}/${id}`);
  }

  listarCuotas(creditoId: string): Observable<CuotaPerfil[]> {
    return this.http.get<CuotaPerfil[]>(`${this.urlBase}/${creditoId}/cuotas`);
  }

  crear(payload: CrearCreditoPayload): Observable<CreditoCreado> {
    return this.http.post<CreditoCreado>(this.urlBase, payload);
  }
}
