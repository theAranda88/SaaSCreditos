import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { AsignacionPerfil, EstadoAsignacion } from '@creditos/shared-types';
import { Observable } from 'rxjs';

export type FiltrosAsignacion = {
  cobradorId?: string;
  creditoId?: string;
  estado?: EstadoAsignacion;
};

export type CrearAsignacionPayload = {
  creditoId: string;
  cobradorId: string;
};

@Injectable({ providedIn: 'root' })
export class AsignacionesServicio {
  private readonly http = inject(HttpClient);
  private readonly urlBase = '/api/asignaciones';

  listar(filtros: FiltrosAsignacion = {}): Observable<AsignacionPerfil[]> {
    let params = new HttpParams();

    if (filtros.cobradorId) {
      params = params.set('cobradorId', filtros.cobradorId);
    }
    if (filtros.creditoId) {
      params = params.set('creditoId', filtros.creditoId);
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }

    return this.http.get<AsignacionPerfil[]>(this.urlBase, { params });
  }

  obtenerPorId(id: string): Observable<AsignacionPerfil> {
    return this.http.get<AsignacionPerfil>(`${this.urlBase}/${id}`);
  }

  asignar(payload: CrearAsignacionPayload): Observable<AsignacionPerfil> {
    return this.http.post<AsignacionPerfil>(this.urlBase, payload);
  }
}
