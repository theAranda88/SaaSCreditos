import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario, PlanPerfil, SuscripcionPerfil } from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { proveedoresTraduccionPrueba } from '../../nucleo/i18n/proveedores-traduccion-prueba';
import { ConsultaSuscripcionComponent } from './consulta-suscripcion.component';
import { SuscripcionesServicio } from './suscripciones.servicio';

const suscripcionEmprendedor: SuscripcionPerfil = {
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
    id: 'plan-emp',
    codigo: 'emprendedor',
    nombre: 'Emprendedor',
    limite_cobradores: 3,
    precio_implementacion: '1250000.00',
    precio_mensual: '250000.00',
    caracteristicas: {},
    estado: 'activo',
  },
};

const planProfesional: PlanPerfil = {
  id: 'plan-pro',
  codigo: 'profesional',
  nombre: 'Profesional',
  limite_cobradores: 10,
  precio_implementacion: '2500000.00',
  precio_mensual: '425000.00',
  caracteristicas: {},
  estado: 'activo',
};

const perfilPropietario: PerfilUsuario = {
  id: 'usuario-1',
  nombre: 'Ana',
  correo: 'ana@ejemplo.com',
  rol: 'propietario',
  negocio_id: 'negocio-a',
};

describe('ConsultaSuscripcionComponent', () => {
  it('debe mostrar el plan contratado y el cupo', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ConsultaSuscripcionComponent],
      providers: [
        proveedoresTraduccionPrueba(),
        {
          provide: SuscripcionesServicio,
          useValue: {
            obtenerMia: () => of(suscripcionEmprendedor),
            listarPlanes: () => of([suscripcionEmprendedor.plan, planProfesional]),
            checkoutStub: vi.fn(),
          },
        },
        { provide: AuthServicio, useValue: { perfilActual: signal(perfilPropietario) } },
      ],
    });

    const fixture = TestBed.createComponent(ConsultaSuscripcionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Emprendedor');
    expect(fixture.nativeElement.textContent).toContain('1 / 3');
  });

  it('debe confirmar antes de disparar un solo POST de checkout', async () => {
    const checkoutStub = vi.fn(() => of({ ...suscripcionEmprendedor, plan: planProfesional }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ConsultaSuscripcionComponent],
      providers: [
        proveedoresTraduccionPrueba(),
        {
          provide: SuscripcionesServicio,
          useValue: {
            obtenerMia: () => of(suscripcionEmprendedor),
            listarPlanes: () => of([suscripcionEmprendedor.plan, planProfesional]),
            checkoutStub,
          },
        },
        { provide: AuthServicio, useValue: { perfilActual: signal(perfilPropietario) } },
      ],
    });

    const fixture = TestBed.createComponent(ConsultaSuscripcionComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.pedirCambio(planProfesional);
    expect(checkoutStub).not.toHaveBeenCalled();

    fixture.componentInstance.confirmarCambio();
    expect(checkoutStub).toHaveBeenCalledTimes(1);
    expect(checkoutStub).toHaveBeenCalledWith('plan-pro');
  });

  it('no debe ofrecer cambio de plan al administrador', async () => {
    const listarPlanes = vi.fn(() => of([planProfesional]));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ConsultaSuscripcionComponent],
      providers: [
        proveedoresTraduccionPrueba(),
        {
          provide: SuscripcionesServicio,
          useValue: {
            obtenerMia: () => of(suscripcionEmprendedor),
            listarPlanes,
            checkoutStub: vi.fn(),
          },
        },
        {
          provide: AuthServicio,
          useValue: {
            perfilActual: signal({ ...perfilPropietario, rol: 'administrador' }),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(ConsultaSuscripcionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listarPlanes).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('suscripciones.consulta.cambiar_plan');
  });
});
