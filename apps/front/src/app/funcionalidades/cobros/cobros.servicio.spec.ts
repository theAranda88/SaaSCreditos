import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CobrosServicio } from './cobros.servicio';

describe('CobrosServicio', () => {
  let servicio: CobrosServicio;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CobrosServicio, provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(CobrosServicio);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe consultar cobros del día en GET /api/pagos/cobros-del-dia', () => {
    servicio.listarCobrosDelDia('2026-09-21').subscribe();

    const solicitud = httpMock.expectOne('/api/pagos/cobros-del-dia?fecha=2026-09-21');
    expect(solicitud.request.method).toBe('GET');
    solicitud.flush({ fecha: '2026-09-21', dia_habil: true, mensaje: null, cobros: [] });
  });

  it('debe consultar resumen diario en GET /api/pagos/resumen-diario', () => {
    servicio.resumenDiario('2026-09-21').subscribe();

    const solicitud = httpMock.expectOne('/api/pagos/resumen-diario?fecha=2026-09-21');
    expect(solicitud.request.method).toBe('GET');
    solicitud.flush({
      fecha: '2026-09-21',
      dia_habil: true,
      cobrador_id: 'cobrador-1',
      esperado: '0.00',
      cobrado: '0.00',
      pendiente: '0.00',
    });
  });

  it('debe registrar pago en POST /api/pagos', () => {
    servicio
      .registrarPago({
        cuotaId: 'cuota-1',
        monto: 6000,
        metodoPago: 'efectivo',
      })
      .subscribe();

    const solicitud = httpMock.expectOne('/api/pagos');
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toMatchObject({
      cuotaId: 'cuota-1',
      monto: 6000,
      metodoPago: 'efectivo',
    });
    solicitud.flush({ id: 'pago-1', estado: 'valido' });
  });

  it('debe listar historial por crédito', () => {
    servicio.listarHistorial('credito-1').subscribe();

    const solicitud = httpMock.expectOne('/api/pagos?creditoId=credito-1');
    expect(solicitud.request.method).toBe('GET');
    solicitud.flush([]);
  });
});
