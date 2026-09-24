import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SuscripcionesServicio } from './suscripciones.servicio';

describe('SuscripcionesServicio', () => {
  let servicio: SuscripcionesServicio;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SuscripcionesServicio, provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(SuscripcionesServicio);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe consultar GET /api/suscripciones/mia', () => {
    servicio.obtenerMia().subscribe();

    const peticion = httpMock.expectOne('/api/suscripciones/mia');
    expect(peticion.request.method).toBe('GET');
    peticion.flush({
      id: 'suscripcion-1',
      negocio_id: 'negocio-a',
      estado: 'activa',
      fecha_inicio: '2026-09-19',
      fecha_renovacion: '2026-10-19',
      fecha_cancelacion: null,
      referencia_pago_externo: null,
      cobradores_activos: 1,
      limite_cobradores: 3,
      plan: {
        id: 'plan-1',
        codigo: 'emprendedor',
        nombre: 'Emprendedor',
        limite_cobradores: 3,
        precio_implementacion: '1250000.00',
        precio_mensual: '250000.00',
        caracteristicas: {},
        estado: 'activo',
      },
    });
  });

  it('debe enviar POST /api/suscripciones/checkout-stub', () => {
    servicio.checkoutStub('plan-2').subscribe();

    const peticion = httpMock.expectOne('/api/suscripciones/checkout-stub');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      planId: 'plan-2',
      referenciaPagoExterno: 'stub-ui',
    });
    peticion.flush({});
  });
});
