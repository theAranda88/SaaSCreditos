import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  ItemCartera,
  ResultadoAplicarMora,
  SegmentoCartera,
} from '@creditos/shared-types';
import { Observable } from 'rxjs';

export type FiltrosCartera = {
  segmento: SegmentoCartera;
  cobradorId?: string;
};

@Injectable({ providedIn: 'root' })
export class CarteraServicio {
  private readonly http = inject(HttpClient);
  private readonly urlBase = '/api/cartera';

  listar(filtros: FiltrosCartera): Observable<ItemCartera[]> {
    let params = new HttpParams().set('segmento', filtros.segmento);

    if (filtros.cobradorId) {
      params = params.set('cobradorId', filtros.cobradorId);
    }

    return this.http.get<ItemCartera[]>(this.urlBase, { params });
  }

  aplicarMora(): Observable<ResultadoAplicarMora> {
    return this.http.post<ResultadoAplicarMora>(`${this.urlBase}/aplicar-mora`, {});
  }
}
