import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NegociosServicio } from './negocios.servicio';

describe('NegociosServicio', () => {
  let servicio: NegociosServicio;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NegociosServicio, provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(NegociosServicio);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe consultar mi negocio en GET /api/negocios/mi-negocio', () => {
    servicio.obtenerMiNegocio().subscribe();

    const solicitud = httpMock.expectOne('/api/negocios/mi-negocio');
    expect(solicitud.request.method).toBe('GET');
    solicitud.flush({
      id: 'negocio-1',
      nombre_comercial: 'Mi Préstamos',
      moneda: 'COP',
      configuracion: {},
    });
  });

  it('debe actualizar mi negocio en PATCH /api/negocios/mi-negocio', () => {
    servicio.actualizarMiNegocio({ nombreComercial: 'Nuevo nombre' }).subscribe();

    const solicitud = httpMock.expectOne('/api/negocios/mi-negocio');
    expect(solicitud.request.method).toBe('PATCH');
    expect(solicitud.request.body).toEqual({ nombreComercial: 'Nuevo nombre' });
    solicitud.flush({
      id: 'negocio-1',
      nombre_comercial: 'Nuevo nombre',
      moneda: 'COP',
      configuracion: {},
    });
  });
});
