import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@creditos/shared-types';
import { AuthServicio } from '../../../nucleo/auth/auth.servicio';
import { DashboardServicio } from '../../dashboard/dashboard.servicio';
import { NegociosServicio } from '../../negocios/negocios.servicio';
import { InicioComponent } from './inicio.component';

describe('InicioComponent', () => {
  it('debe mostrar panel de indicadores para propietario', () => {
    const perfil = signal<PerfilUsuario | null>({
      id: 'u1',
      nombre: 'Ana',
      correo: 'ana@ejemplo.com',
      rol: 'propietario',
      negocio_id: 'n1',
    });

    TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [
        provideRouter([]),
        { provide: AuthServicio, useValue: { perfilActual: perfil } },
        {
          provide: NegociosServicio,
          useValue: {
            obtenerMiNegocio: () =>
              of({ nombre_comercial: 'Mi créditos' }),
          },
        },
        {
          provide: DashboardServicio,
          useValue: {
            obtener: () =>
              of({
                fecha: '2026-09-25',
                recaudo_dia: '10.00',
                cartera_activa: '100.00',
                cartera_mora: '0.00',
                cobradores_activos: 1,
                creditos_activos: 2,
                creditos_en_mora: 0,
              }),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-panel-indicadores-negocio')).toBeTruthy();
  });

  it('no debe mostrar panel de indicadores para cobrador', () => {
    const perfil = signal<PerfilUsuario | null>({
      id: 'u2',
      nombre: 'Luis',
      correo: 'luis@ejemplo.com',
      rol: 'cobrador',
      negocio_id: 'n1',
    });

    TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [
        provideRouter([]),
        { provide: AuthServicio, useValue: { perfilActual: perfil } },
        { provide: NegociosServicio, useValue: { obtenerMiNegocio: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-panel-indicadores-negocio')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Ir a cobros del día');
  });
});
