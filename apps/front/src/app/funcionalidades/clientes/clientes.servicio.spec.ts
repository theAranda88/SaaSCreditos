import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ClientesServicio } from './clientes.servicio';

describe('ClientesServicio', () => {
  let servicio: ClientesServicio;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClientesServicio, provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(ClientesServicio);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe listar clientes en GET /api/clientes', () => {
    servicio.listar().subscribe();

    const solicitud = httpMock.expectOne('/api/clientes');
    expect(solicitud.request.method).toBe('GET');
    solicitud.flush([]);
  });

  it('debe crear cliente en POST /api/clientes', () => {
    servicio
      .crear({
        nombreCompleto: 'María Pérez',
        tipoDocumento: 'CC',
        numeroDocumento: '1234567890',
        telefono: '3001234567',
        direccion: 'Calle 10 # 5-20',
        barrio: 'Centro',
      })
      .subscribe();

    const solicitud = httpMock.expectOne('/api/clientes');
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toMatchObject({
      nombreCompleto: 'María Pérez',
      tipoDocumento: 'CC',
    });
    solicitud.flush({
      id: 'cliente-1',
      negocio_id: 'negocio-1',
      nombre_completo: 'María Pérez',
      tipo_documento: 'CC',
      numero_documento: '1234567890',
      telefono: '3001234567',
      direccion: 'Calle 10 # 5-20',
      barrio: 'Centro',
      referencia_ubicacion: null,
      estado: 'activo',
      fecha_creacion: '2026-09-15T00:00:00.000Z',
      fecha_actualizacion: '2026-09-15T00:00:00.000Z',
      creado_por: 'usuario-1',
    });
  });
});
