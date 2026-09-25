import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@creditos/shared-types';
import { AuthServicio } from '../../../nucleo/auth/auth.servicio';
import { NegociosServicio } from '../../negocios/negocios.servicio';
import { proveedoresTraduccionPrueba } from '../../../nucleo/i18n/proveedores-traduccion-prueba';
import { ConfiguracionComponent } from './configuracion.component';

const perfilPropietario: PerfilUsuario = {
  id: 'usuario-1',
  nombre: 'Ana',
  correo: 'ana@ejemplo.com',
  rol: 'propietario',
  negocio_id: 'negocio-1',
};

describe('ConfiguracionComponent', () => {
  it('debe cargar el nombre comercial del negocio', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ConfiguracionComponent],
      providers: [
        proveedoresTraduccionPrueba(),
        {
          provide: NegociosServicio,
          useValue: {
            obtenerMiNegocio: () =>
              of({
                id: 'negocio-1',
                nombre_comercial: 'Mi Préstamos Alfa',
                moneda: 'COP',
                configuracion: {},
              }),
            actualizarMiNegocio: vi.fn(),
          },
        },
        { provide: AuthServicio, useValue: { perfilActual: signal(perfilPropietario) } },
      ],
    });

    const fixture = TestBed.createComponent(ConfiguracionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.formulario.getRawValue().nombreComercial).toBe(
      'Mi Préstamos Alfa',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Fase 2');
  });
});
