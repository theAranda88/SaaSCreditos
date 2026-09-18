import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { NegocioPerfil } from '@creditos/shared-types';
import { Observable } from 'rxjs';

export type ActualizarNegocioPayload = {
  nombreComercial?: string;
  moneda?: string;
  configuracion?: Record<string, unknown>;
};

@Injectable({ providedIn: 'root' })
export class NegociosServicio {
  private readonly http = inject(HttpClient);
  private readonly urlBase = '/api/negocios';

  obtenerMiNegocio(): Observable<NegocioPerfil> {
    return this.http.get<NegocioPerfil>(`${this.urlBase}/mi-negocio`);
  }

  actualizarMiNegocio(payload: ActualizarNegocioPayload): Observable<NegocioPerfil> {
    return this.http.patch<NegocioPerfil>(`${this.urlBase}/mi-negocio`, payload);
  }
}
