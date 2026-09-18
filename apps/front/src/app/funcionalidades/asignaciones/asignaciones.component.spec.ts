import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { ClientePerfil, CobradorPerfil, CreditoPerfil, PerfilUsuario } from '@creditos/shared-types';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { ClientesServicio } from '../clientes/clientes.servicio';
import { CobradoresServicio } from '../cobradores/cobradores.servicio';
import { CreditosServicio } from '../creditos/creditos.servicio';
import { AsignacionesServicio } from './asignaciones.servicio';
import { FormularioAsignacionComponent } from './formulario-asignacion.component';
import { ListadoAsignacionesComponent } from './listado-asignaciones.component';

const perfilAdmin: PerfilUsuario = {
  id: 'usuario-1',
  nombre: 'Ana',
  correo: 'ana@ejemplo.com',
  rol: 'propietario',
  negocio_id: 'negocio-a',
};

const perfilCobrador: PerfilUsuario = {
  id: 'cobrador-1',
  nombre: 'Carlos',
  correo: 'carlos@ejemplo.com',
  rol: 'cobrador',
  negocio_id: 'negocio-a',
};

const creditoActivo = {
  id: 'credito-1',
  cliente_id: 'cliente-1',
  monto_principal: '100000.00',
  estado: 'activo',
} as CreditoPerfil;

const clienteActivo = {
  id: 'cliente-1',
  nombre_completo: 'María Pérez',
} as ClientePerfil;

const cobradorActivo = {
  id: 'cobrador-1',
  nombre: 'Carlos Cobrador',
  estado: 'activo',
} as CobradorPerfil;

describe('ListadoAsignacionesComponent', () => {
  it('debe mostrar estado vacío cuando no hay asignaciones', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ListadoAsignacionesComponent],
      providers: [
        provideRouter([]),
        { provide: AsignacionesServicio, useValue: { listar: () => of([]) } },
        { provide: CobradoresServicio, useValue: { listar: () => of([]) } },
        { provide: AuthServicio, useValue: { perfilActual: signal(perfilAdmin) } },
      ],
    });

    const fixture = TestBed.createComponent(ListadoAsignacionesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay asignaciones para mostrar.');
  });

  it('no debe mostrar el botón de asignar al cobrador ni pedir cobradores', async () => {
    const cobradoresServicio = { listar: vi.fn(() => of([])) };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ListadoAsignacionesComponent],
      providers: [
        provideRouter([]),
        { provide: AsignacionesServicio, useValue: { listar: () => of([]) } },
        { provide: CobradoresServicio, useValue: cobradoresServicio },
        { provide: AuthServicio, useValue: { perfilActual: signal(perfilCobrador) } },
      ],
    });

    const fixture = TestBed.createComponent(ListadoAsignacionesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mi cartera');
    expect(fixture.nativeElement.textContent).not.toContain('Asignar cartera');
    expect(cobradoresServicio.listar).not.toHaveBeenCalled();
  });
});

describe('FormularioAsignacionComponent', () => {
  it('no debe llamar asignar si el formulario es inválido', () => {
    const asignacionesServicio = { listar: () => of([]), asignar: vi.fn() };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [FormularioAsignacionComponent],
      providers: [
        provideRouter([]),
        { provide: AsignacionesServicio, useValue: asignacionesServicio },
        { provide: CreditosServicio, useValue: { listar: () => of([]) } },
        { provide: ClientesServicio, useValue: { listar: () => of([]) } },
        { provide: CobradoresServicio, useValue: { listar: () => of([]) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    });

    const fixture = TestBed.createComponent(FormularioAsignacionComponent);
    fixture.detectChanges();
    fixture.componentInstance.revisar();
    fixture.componentInstance.confirmar();

    expect(asignacionesServicio.asignar).not.toHaveBeenCalled();
  });

  it('debe confirmar antes de disparar un solo POST de asignación', () => {
    const asignacionesServicio = {
      listar: () => of([]),
      asignar: vi.fn(() => of({ id: 'asignacion-1' })),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [FormularioAsignacionComponent],
      providers: [
        provideRouter([{ path: 'app/asignaciones', children: [] }]),
        { provide: AsignacionesServicio, useValue: asignacionesServicio },
        { provide: CreditosServicio, useValue: { listar: () => of([creditoActivo]) } },
        { provide: ClientesServicio, useValue: { listar: () => of([clienteActivo]) } },
        { provide: CobradoresServicio, useValue: { listar: () => of([cobradorActivo]) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    });

    const fixture = TestBed.createComponent(FormularioAsignacionComponent);
    fixture.detectChanges();
    fixture.componentInstance.formulario.setValue({
      creditoId: 'credito-1',
      cobradorId: 'cobrador-1',
    });
    fixture.componentInstance.revisar();

    expect(asignacionesServicio.asignar).not.toHaveBeenCalled();
    expect(fixture.componentInstance.confirmacion()).not.toBeNull();

    fixture.componentInstance.confirmar();

    expect(asignacionesServicio.asignar).toHaveBeenCalledTimes(1);
    expect(asignacionesServicio.asignar).toHaveBeenCalledWith({
      creditoId: 'credito-1',
      cobradorId: 'cobrador-1',
    });
  });
});
