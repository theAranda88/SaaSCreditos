import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  CobrosDelDiaRespuesta,
  EstadoPago,
  MetodoPago,
  PagoPerfil,
  ResumenDiarioPago,
} from '@creditos/shared-types';
import { Observable } from 'rxjs';

export type RegistrarPagoPayload = {
  cuotaId: string;
  monto: number;
  metodoPago: MetodoPago;
  fechaPago?: string;
};

@Injectable({ providedIn: 'root' })
export class CobrosServicio {
  private readonly http = inject(HttpClient);
  private readonly urlBase = '/api/pagos';

  listarCobrosDelDia(fecha?: string): Observable<CobrosDelDiaRespuesta> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }

    return this.http.get<CobrosDelDiaRespuesta>(`${this.urlBase}/cobros-del-dia`, { params });
  }

  resumenDiario(fecha?: string): Observable<ResumenDiarioPago> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }

    return this.http.get<ResumenDiarioPago>(`${this.urlBase}/resumen-diario`, { params });
  }

  listarHistorial(creditoId: string, estado?: EstadoPago): Observable<PagoPerfil[]> {
    let params = new HttpParams().set('creditoId', creditoId);
    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<PagoPerfil[]>(this.urlBase, { params });
  }

  registrarPago(payload: RegistrarPagoPayload): Observable<PagoPerfil> {
    return this.http.post<PagoPerfil>(this.urlBase, payload);
  }
}
