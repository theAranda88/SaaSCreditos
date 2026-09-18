import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DashboardServicio } from './dashboard.servicio';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  it('debe mostrar aviso cuando el día no es hábil', async () => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: DashboardServicio,
          useValue: {
            obtener: () =>
              of({
                fecha: '2026-09-20',
                recaudo_dia: '0.00',
                cartera_activa: '0.00',
                cartera_mora: '0.00',
                cobradores_activos: 0,
                creditos_activos: 0,
                creditos_en_mora: 0,
              }),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Domingo');
    expect(fixture.nativeElement.textContent).toContain('no hay jornada de cobro');
  });
});
