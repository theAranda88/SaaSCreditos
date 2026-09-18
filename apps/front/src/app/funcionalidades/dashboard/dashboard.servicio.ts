import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { DashboardNegocio } from '@creditos/shared-types';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardServicio {
  private readonly http = inject(HttpClient);
  private readonly urlBase = '/api/dashboard';

  obtener(): Observable<DashboardNegocio> {
    return this.http.get<DashboardNegocio>(this.urlBase);
  }
}
