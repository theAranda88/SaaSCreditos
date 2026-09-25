import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { proveedoresTraduccionPrueba } from '../../nucleo/i18n/proveedores-traduccion-prueba';
import { DashboardServicio } from './dashboard.servicio';
import { PanelIndicadoresNegocioComponent } from './panel-indicadores-negocio.component';

describe('PanelIndicadoresNegocioComponent', () => {
  it('debe mostrar aviso cuando el día no es hábil', async () => {
    TestBed.configureTestingModule({
      imports: [PanelIndicadoresNegocioComponent],
      providers: [
        provideRouter([]),
        proveedoresTraduccionPrueba(),
        {
          provide: DashboardServicio,
          useValue: {
            obtener: () =>
              of({
                fecha: '2026-09-20',
                recaudo_dia: '0.00',
                cartera_activa: '100.00',
                cartera_mora: '25.00',
                cobradores_activos: 1,
                creditos_activos: 4,
                creditos_en_mora: 1,
              }),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(PanelIndicadoresNegocioComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('comun.calendario.aviso_dia_inhabil');
    expect(fixture.nativeElement.textContent).toContain('dashboard.indicadores.composicion_cartera');
  });
});
