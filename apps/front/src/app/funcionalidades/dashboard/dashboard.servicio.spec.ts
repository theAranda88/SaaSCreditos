import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DashboardServicio } from './dashboard.servicio';

describe('DashboardServicio', () => {
  let servicio: DashboardServicio;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardServicio, provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(DashboardServicio);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe consultar KPIs del dashboard', () => {
    servicio.obtener().subscribe((datos) => {
      expect(datos.recaudo_dia).toBe('18000.00');
      expect(datos.creditos_en_mora).toBe(1);
    });

    const peticion = httpMock.expectOne('/api/dashboard');
    expect(peticion.request.method).toBe('GET');
    peticion.flush({
      fecha: '2026-09-21',
      recaudo_dia: '18000.00',
      cartera_activa: '50000.00',
      cartera_mora: '12000.00',
      cobradores_activos: 2,
      creditos_activos: 4,
      creditos_en_mora: 1,
    });
  });
});
