import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { PlanPerfil, SuscripcionPerfil } from '@creditos/shared-types';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SuscripcionesServicio {
  private readonly http = inject(HttpClient);

  obtenerMia(): Observable<SuscripcionPerfil> {
    return this.http.get<SuscripcionPerfil>('/api/suscripciones/mia');
  }

  listarPlanes(): Observable<PlanPerfil[]> {
    return this.http.get<PlanPerfil[]>('/api/planes');
  }

  checkoutStub(planId: string): Observable<SuscripcionPerfil> {
    return this.http.post<SuscripcionPerfil>('/api/suscripciones/checkout-stub', {
      planId,
      referenciaPagoExterno: 'stub-ui',
    });
  }
}
