import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PlataformaServicio } from './plataforma.servicio';

describe('PlataformaServicio', () => {
  let servicio: PlataformaServicio;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlataformaServicio, provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(PlataformaServicio);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe listar negocios en GET /api/plataforma/negocios', () => {
    servicio.listarNegocios().subscribe();

    const peticion = httpMock.expectOne('/api/plataforma/negocios');
    expect(peticion.request.method).toBe('GET');
    peticion.flush([]);
  });

  it('debe crear negocio en POST /api/plataforma/negocios', () => {
    servicio
      .crearNegocio({
        nombreComercial: 'Nuevo',
        nombre: 'Dueño',
        correo: 'n@t.com',
        contrasena: 'ClaveSegura123',
      })
      .subscribe();

    const peticion = httpMock.expectOne('/api/plataforma/negocios');
    expect(peticion.request.method).toBe('POST');
    peticion.flush({ id: 'n1' });
  });

  it('debe suspender con PATCH /api/plataforma/negocios/:id/estado', () => {
    servicio.cambiarEstadoNegocio('negocio-a', 'suspendido').subscribe();

    const peticion = httpMock.expectOne('/api/plataforma/negocios/negocio-a/estado');
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ estado: 'suspendido' });
    peticion.flush({ id: 'negocio-a', estado: 'suspendido' });
  });
});
