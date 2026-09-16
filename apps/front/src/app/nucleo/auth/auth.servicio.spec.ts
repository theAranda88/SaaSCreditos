import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthServicio } from './auth.servicio';

describe('AuthServicio', () => {
  let servicio: AuthServicio;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthServicio, provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(AuthServicio);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debe llamar POST /api/auth/login con credenciales', () => {
    servicio.iniciarSesion('ana@ejemplo.com', 'ClaveSegura123').subscribe();

    const solicitud = httpMock.expectOne('/api/auth/login');
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual({
      correo: 'ana@ejemplo.com',
      contrasena: 'ClaveSegura123',
    });

    solicitud.flush({
      token: 'token-prueba',
      usuario: {
        id: 'usuario-1',
        nombre: 'Ana',
        correo: 'ana@ejemplo.com',
        rol: 'propietario',
        negocio_id: 'negocio-1',
      },
    });
  });

  it('debe persistir token tras login exitoso', () => {
    servicio
      .iniciarSesion('ana@ejemplo.com', 'ClaveSegura123')
      .subscribe((respuesta) => {
        expect(respuesta.token).toBe('token-prueba');
      });

    httpMock.expectOne('/api/auth/login').flush({
      token: 'token-prueba',
      usuario: {
        id: 'usuario-1',
        nombre: 'Ana',
        correo: 'ana@ejemplo.com',
        rol: 'propietario',
        negocio_id: 'negocio-1',
      },
    });

    expect(servicio.obtenerToken()).toBe('token-prueba');
    expect(servicio.estaAutenticado()).toBe(true);
  });
});
