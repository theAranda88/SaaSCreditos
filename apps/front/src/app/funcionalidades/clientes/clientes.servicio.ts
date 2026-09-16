import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { ClientePerfil, EstadoCliente, TipoDocumento } from '@creditos/shared-types';
import { Observable } from 'rxjs';

export type FiltrosCliente = {
  nombre?: string;
  numeroDocumento?: string;
  telefono?: string;
  estado?: EstadoCliente;
};

export type CrearClientePayload = {
  nombreCompleto: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  telefono: string;
  direccion?: string;
  referenciaUbicacion?: string;
};

export type ActualizarClientePayload = Partial<CrearClientePayload>;

@Injectable({ providedIn: 'root' })
export class ClientesServicio {
  private readonly http = inject(HttpClient);
  private readonly urlBase = '/api/clientes';

  listar(filtros: FiltrosCliente = {}): Observable<ClientePerfil[]> {
    let params = new HttpParams();

    if (filtros.nombre) {
      params = params.set('nombre', filtros.nombre);
    }
    if (filtros.numeroDocumento) {
      params = params.set('numeroDocumento', filtros.numeroDocumento);
    }
    if (filtros.telefono) {
      params = params.set('telefono', filtros.telefono);
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }

    return this.http.get<ClientePerfil[]>(this.urlBase, { params });
  }

  obtenerPorId(id: string): Observable<ClientePerfil> {
    return this.http.get<ClientePerfil>(`${this.urlBase}/${id}`);
  }

  crear(payload: CrearClientePayload): Observable<ClientePerfil> {
    return this.http.post<ClientePerfil>(this.urlBase, payload);
  }

  actualizar(id: string, payload: ActualizarClientePayload): Observable<ClientePerfil> {
    return this.http.patch<ClientePerfil>(`${this.urlBase}/${id}`, payload);
  }

  cambiarEstado(id: string, estado: EstadoCliente): Observable<ClientePerfil> {
    return this.http.patch<ClientePerfil>(`${this.urlBase}/${id}/estado`, { estado });
  }
}
