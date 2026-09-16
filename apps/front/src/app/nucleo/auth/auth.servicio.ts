import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type { PerfilUsuario, RespuestaLogin } from '@creditos/shared-types';
import { Observable, tap } from 'rxjs';

const CLAVE_TOKEN = 'creditos_token';
const CLAVE_PERFIL = 'creditos_perfil';

@Injectable({ providedIn: 'root' })
export class AuthServicio {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  readonly perfilActual = signal<PerfilUsuario | null>(this.cargarPerfilAlmacenado());

  iniciarSesion(correo: string, contrasena: string): Observable<RespuestaLogin> {
    return this.http
      .post<RespuestaLogin>(`${this.apiUrl}/auth/login`, { correo, contrasena })
      .pipe(tap((respuesta) => this.persistirSesion(respuesta)));
  }

  cerrarSesion(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_PERFIL);
    this.perfilActual.set(null);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  estaAutenticado(): boolean {
    return this.obtenerToken() !== null;
  }

  private persistirSesion(respuesta: RespuestaLogin): void {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    localStorage.setItem(CLAVE_PERFIL, JSON.stringify(respuesta.usuario));
    this.perfilActual.set(respuesta.usuario);
  }

  private cargarPerfilAlmacenado(): PerfilUsuario | null {
    const perfil = localStorage.getItem(CLAVE_PERFIL);

    if (!perfil) {
      return null;
    }

    try {
      return JSON.parse(perfil) as PerfilUsuario;
    } catch {
      return null;
    }
  }
}
