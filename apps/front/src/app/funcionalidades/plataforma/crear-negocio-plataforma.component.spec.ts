import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CrearNegocioPlataformaComponent } from './crear-negocio-plataforma.component';

describe('CrearNegocioPlataformaComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearNegocioPlataformaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: 'plataforma/negocios/:id', redirectTo: '' }])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe enviar POST al crear negocio con datos válidos', () => {
    const fixture = TestBed.createComponent(CrearNegocioPlataformaComponent);
    fixture.detectChanges();
    const componente = fixture.componentInstance;

    componente.formulario.patchValue({
      nombreComercial: 'Préstamos Nuevo',
      nombre: 'Dueño',
      correo: 'nuevo@ejemplo.com',
      contrasena: 'ClaveSegura123',
      moneda: 'COP',
      codigoPlan: 'emprendedor',
    });

    componente.enviar();

    const peticion = httpMock.expectOne('/api/plataforma/negocios');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toMatchObject({
      nombreComercial: 'Préstamos Nuevo',
      correo: 'nuevo@ejemplo.com',
      codigoPlan: 'emprendedor',
    });
    peticion.flush({ id: 'negocio-nuevo', nombre_comercial: 'Préstamos Nuevo', estado: 'activo' });
  });
});
