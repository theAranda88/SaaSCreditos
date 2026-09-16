import { TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CobradoresServicio } from './cobradores.servicio';
import { FormularioCobradorComponent } from './formulario-cobrador.component';
import { ListadoCobradoresComponent } from './listado-cobradores.component';

describe('ListadoCobradoresComponent', () => {
  it('debe mostrar estado vacío cuando no hay cobradores', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ListadoCobradoresComponent],
      providers: [
        provideRouter([]),
        {
          provide: CobradoresServicio,
          useValue: { listar: () => of([]), cambiarEstado: vi.fn() },
        },
      ],
    });

    const fixture = TestBed.createComponent(ListadoCobradoresComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay cobradores para mostrar.');
  });
});

describe('FormularioCobradorComponent', () => {
  it('no debe llamar crear si el formulario es inválido', () => {
    const cobradoresServicio = {
      crear: vi.fn(),
      actualizar: vi.fn(),
      obtenerPorId: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [FormularioCobradorComponent],
      providers: [
        { provide: CobradoresServicio, useValue: cobradoresServicio },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    });

    const fixture = TestBed.createComponent(FormularioCobradorComponent);
    fixture.detectChanges();
    fixture.componentInstance.enviar();

    expect(cobradoresServicio.crear).not.toHaveBeenCalled();
  });
});
