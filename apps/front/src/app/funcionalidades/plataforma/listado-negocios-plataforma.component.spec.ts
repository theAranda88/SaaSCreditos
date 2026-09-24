import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PlataformaServicio } from './plataforma.servicio';
import { ListadoNegociosPlataformaComponent } from './listado-negocios-plataforma.component';

describe('ListadoNegociosPlataformaComponent', () => {
  it('debe mostrar estado vacío cuando no hay negocios', async () => {
    TestBed.configureTestingModule({
      imports: [ListadoNegociosPlataformaComponent],
      providers: [
        provideRouter([]),
        { provide: PlataformaServicio, useValue: { listarNegocios: () => of([]) } },
      ],
    });

    const fixture = TestBed.createComponent(ListadoNegociosPlataformaComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay negocios para mostrar.');
  });

  it('debe listar negocios de la plataforma', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ListadoNegociosPlataformaComponent],
      providers: [
        provideRouter([]),
        {
          provide: PlataformaServicio,
          useValue: {
            listarNegocios: vi.fn(() =>
              of([
                {
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
                },
              ]),
            ),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(ListadoNegociosPlataformaComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Préstamos Alfa (prueba)');
    expect(fixture.nativeElement.textContent).toContain('Emprendedor');
  });
});
