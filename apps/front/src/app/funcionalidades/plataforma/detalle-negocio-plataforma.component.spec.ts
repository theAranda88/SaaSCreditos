import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { NegocioPlataforma, PerfilUsuario } from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { proveedoresTraduccionPrueba } from '../../nucleo/i18n/proveedores-traduccion-prueba';
import { DetalleNegocioPlataformaComponent } from './detalle-negocio-plataforma.component';
import { PlataformaServicio } from './plataforma.servicio';

const negocioActivo: NegocioPlataforma = {
  id: 'negocio-a',
  nombre_comercial: 'Préstamos Alfa (prueba)',
  moneda: 'COP',
  estado: 'activo',
  fecha_creacion: '2026-09-19T00:00:00.000Z',
  suscripcion: {
    id: 'suscripcion-1',
    estado: 'activa',
    plan_codigo: 'emprendedor',
    plan_nombre: 'Emprendedor',
    limite_cobradores: 3,
    fecha_renovacion: '2026-10-19',
  },
};

const admin: PerfilUsuario = {
  id: 'admin-1',
  nombre: 'Admin',
  correo: 'admin@plataforma.local',
  rol: 'admin_plataforma',
  negocio_id: null,
};

describe('DetalleNegocioPlataformaComponent', () => {
  it('debe confirmar antes de disparar un solo PATCH de suspensión', async () => {
    const cambiarEstadoNegocio = vi.fn(() =>
      of({ ...negocioActivo, estado: 'suspendido' as const }),
    );

    TestBed.configureTestingModule({
      imports: [DetalleNegocioPlataformaComponent],
      providers: [
        provideRouter([]),
        proveedoresTraduccionPrueba(),
        { provide: AuthServicio, useValue: { perfilActual: signal(admin) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'negocio-a' } } },
        },
        {
          provide: PlataformaServicio,
          useValue: {
            obtenerNegocio: () => of(negocioActivo),
            listarUsuarios: () => of([]),
            listarAuditorias: () => of([]),
            cambiarEstadoNegocio,
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(DetalleNegocioPlataformaComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.pedirCambioEstado('suspendido');
    expect(cambiarEstadoNegocio).not.toHaveBeenCalled();

    fixture.componentInstance.confirmarCambioEstado();
    expect(cambiarEstadoNegocio).toHaveBeenCalledTimes(1);
    expect(cambiarEstadoNegocio).toHaveBeenCalledWith('negocio-a', 'suspendido');
  });
});
