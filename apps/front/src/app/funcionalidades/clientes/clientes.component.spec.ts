import { TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ClientesServicio } from './clientes.servicio';
import { FormularioClienteComponent } from './formulario-cliente.component';
import { ListadoClientesComponent } from './listado-clientes.component';

describe('ListadoClientesComponent', () => {
  it('debe mostrar estado vacío cuando no hay clientes', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ListadoClientesComponent],
      providers: [
        provideRouter([]),
        {
          provide: ClientesServicio,
          useValue: { listar: () => of([]), cambiarEstado: vi.fn() },
        },
      ],
    });

    const fixture = TestBed.createComponent(ListadoClientesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay clientes para mostrar.');
  });
});

describe('FormularioClienteComponent', () => {
  it('no debe llamar crear si el formulario es inválido', () => {
    const clientesServicio = {
      crear: vi.fn(),
      actualizar: vi.fn(),
      obtenerPorId: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [FormularioClienteComponent],
      providers: [
        { provide: ClientesServicio, useValue: clientesServicio },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    });

    const fixture = TestBed.createComponent(FormularioClienteComponent);
    fixture.detectChanges();
    fixture.componentInstance.enviar();

    expect(clientesServicio.crear).not.toHaveBeenCalled();
  });
});
