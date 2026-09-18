import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CreditosServicio } from './creditos.servicio';

describe('CreditosServicio', () => {
  let servicio: CreditosServicio;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CreditosServicio, provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(CreditosServicio);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe listar créditos en GET /api/creditos', () => {
    servicio.listar().subscribe();

    const solicitud = httpMock.expectOne('/api/creditos');
    expect(solicitud.request.method).toBe('GET');
    solicitud.flush([]);
  });

  it('debe crear crédito en POST /api/creditos', () => {
    servicio
      .crear({
        clienteId: 'cliente-1',
        montoPrincipal: 100000,
        tasaInteres: 20,
        periodicidad: 'diaria',
        numeroCuotas: 20,
        fechaDesembolso: '2026-09-16',
      })
      .subscribe();

    const solicitud = httpMock.expectOne('/api/creditos');
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toMatchObject({
      clienteId: 'cliente-1',
      montoPrincipal: 100000,
      numeroCuotas: 20,
    });
    solicitud.flush({ credito: { id: 'credito-1' }, cuotas: [] });
  });

  it('debe consultar el plan en GET /api/creditos/:id/cuotas', () => {
    servicio.listarCuotas('credito-1').subscribe();

    const solicitud = httpMock.expectOne('/api/creditos/credito-1/cuotas');
    expect(solicitud.request.method).toBe('GET');
    solicitud.flush([]);
  });
});
