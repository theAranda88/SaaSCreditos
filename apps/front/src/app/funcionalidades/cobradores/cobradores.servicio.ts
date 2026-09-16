import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { CobradorPerfil, EstadoUsuario } from '@creditos/shared-types';
import { Observable } from 'rxjs';

export type FiltrosCobrador = {
  nombre?: string;
  correo?: string;
  telefono?: string;
  estado?: EstadoUsuario;
};

export type CrearCobradorPayload = {
  nombre: string;
  correo: string;
  contrasena: string;
  telefono?: string;
};

export type ActualizarCobradorPayload = {
  nombre?: string;
  correo?: string;
  contrasena?: string;
  telefono?: string | null;
};

@Injectable({ providedIn: 'root' })
export class CobradoresServicio {
  private readonly http = inject(HttpClient);
  private readonly urlBase = '/api/cobradores';

  listar(filtros: FiltrosCobrador = {}): Observable<CobradorPerfil[]> {
    let params = new HttpParams();

    if (filtros.nombre) {
      params = params.set('nombre', filtros.nombre);
    }
    if (filtros.correo) {
      params = params.set('correo', filtros.correo);
    }
    if (filtros.telefono) {
      params = params.set('telefono', filtros.telefono);
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }

    return this.http.get<CobradorPerfil[]>(this.urlBase, { params });
  }

  obtenerPorId(id: string): Observable<CobradorPerfil> {
    return this.http.get<CobradorPerfil>(`${this.urlBase}/${id}`);
  }

  crear(payload: CrearCobradorPayload): Observable<CobradorPerfil> {
    return this.http.post<CobradorPerfil>(this.urlBase, payload);
  }

  actualizar(id: string, payload: ActualizarCobradorPayload): Observable<CobradorPerfil> {
    return this.http.patch<CobradorPerfil>(`${this.urlBase}/${id}`, payload);
  }

  cambiarEstado(id: string, estado: EstadoUsuario): Observable<CobradorPerfil> {
    return this.http.patch<CobradorPerfil>(`${this.urlBase}/${id}/estado`, { estado });
  }
}
