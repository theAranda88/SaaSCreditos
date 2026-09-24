import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  AuditoriaPlataforma,
  EstadoNegocio,
  NegocioPlataforma,
  UsuarioPlataforma,
} from '@creditos/shared-types';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlataformaServicio {
  private readonly http = inject(HttpClient);
  private readonly urlBase = '/api/plataforma';

  listarNegocios(): Observable<NegocioPlataforma[]> {
    return this.http.get<NegocioPlataforma[]>(`${this.urlBase}/negocios`);
  }

  obtenerNegocio(id: string): Observable<NegocioPlataforma> {
    return this.http.get<NegocioPlataforma>(`${this.urlBase}/negocios/${id}`);
  }

  cambiarEstadoNegocio(id: string, estado: EstadoNegocio): Observable<NegocioPlataforma> {
    return this.http.patch<NegocioPlataforma>(`${this.urlBase}/negocios/${id}/estado`, { estado });
  }

  listarUsuarios(negocioId: string): Observable<UsuarioPlataforma[]> {
    return this.http.get<UsuarioPlataforma[]>(`${this.urlBase}/negocios/${negocioId}/usuarios`);
  }

  listarAuditorias(negocioId: string): Observable<AuditoriaPlataforma[]> {
    const params = new HttpParams().set('negocioId', negocioId);
    return this.http.get<AuditoriaPlataforma[]>(`${this.urlBase}/auditorias`, { params });
  }
}
