import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AsignacionesServicio } from './asignaciones.servicio';

describe('AsignacionesServicio', () => {
  let servicio: AsignacionesServicio;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AsignacionesServicio, provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(AsignacionesServicio);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe listar asignaciones en GET /api/asignaciones', () => {
    servicio.listar({ estado: 'activa', cobradorId: 'cobrador-1' }).subscribe();

    const solicitud = httpMock.expectOne(
      (req) => req.url === '/api/asignaciones' && req.method === 'GET',
    );
    expect(solicitud.request.params.get('estado')).toBe('activa');
    expect(solicitud.request.params.get('cobradorId')).toBe('cobrador-1');
    solicitud.flush([]);
  });

  it('debe asignar cartera en POST /api/asignaciones', () => {
    servicio.asignar({ creditoId: 'credito-1', cobradorId: 'cobrador-1' }).subscribe();

    const solicitud = httpMock.expectOne('/api/asignaciones');
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual({
      creditoId: 'credito-1',
      cobradorId: 'cobrador-1',
    });
    solicitud.flush({ id: 'asignacion-1' });
  });
});
