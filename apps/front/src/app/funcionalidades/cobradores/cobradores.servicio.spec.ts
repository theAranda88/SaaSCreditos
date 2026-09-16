import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CobradoresServicio } from './cobradores.servicio';

describe('CobradoresServicio', () => {
  let servicio: CobradoresServicio;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CobradoresServicio, provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(CobradoresServicio);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe listar cobradores en GET /api/cobradores', () => {
    servicio.listar().subscribe();

    const solicitud = httpMock.expectOne('/api/cobradores');
    expect(solicitud.request.method).toBe('GET');
    solicitud.flush([]);
  });
});
