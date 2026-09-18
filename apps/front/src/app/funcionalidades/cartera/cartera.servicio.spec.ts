import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CarteraServicio } from './cartera.servicio';

describe('CarteraServicio', () => {
  let servicio: CarteraServicio;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CarteraServicio, provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(CarteraServicio);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe consultar cartera por segmento', () => {
    servicio.listar({ segmento: 'vigente' }).subscribe((items) => {
      expect(items).toHaveLength(1);
      expect(items[0].credito_id).toBe('credito-1');
    });

    const peticion = httpMock.expectOne('/api/cartera?segmento=vigente');
    expect(peticion.request.method).toBe('GET');
    peticion.flush([
      {
        credito_id: 'credito-1',
        cliente_id: 'cliente-1',
        cliente_nombre_completo: 'María',
        cobrador_id: null,
        cobrador_nombre: null,
        estado_credito: 'activo',
        monto_principal: '100000.00',
        saldo_pendiente: '12000.00',
        cuotas_pendientes: 1,
        cuotas_en_mora: 0,
      },
    ]);
  });

  it('debe aplicar mora por POST', () => {
    servicio.aplicarMora().subscribe((resultado) => {
      expect(resultado.cuotas_actualizadas).toBe(2);
    });

    const peticion = httpMock.expectOne('/api/cartera/aplicar-mora');
    expect(peticion.request.method).toBe('POST');
    peticion.flush({
      cuotas_actualizadas: 2,
      creditos_actualizados: 1,
      fecha_referencia: '2026-09-21',
    });
  });
});
