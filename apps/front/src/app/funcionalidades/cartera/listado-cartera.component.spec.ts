import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { AuthServicio } from '../../nucleo/auth/auth.servicio';
import { CobradoresServicio } from '../cobradores/cobradores.servicio';
import { CarteraServicio } from './cartera.servicio';
import { ListadoCarteraComponent } from './listado-cartera.component';

describe('ListadoCarteraComponent', () => {
  it('debe listar cartera vigente para administración', async () => {
    TestBed.configureTestingModule({
      imports: [ListadoCarteraComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthServicio,
          useValue: {
            perfilActual: () => ({
              id: 'usuario-1',
              nombre: 'Ana',
              correo: 'ana@ejemplo.com',
              rol: 'propietario',
              negocio_id: 'negocio-a',
            }),
          },
        },
        {
          provide: CobradoresServicio,
          useValue: { listar: () => of([]) },
        },
        {
          provide: CarteraServicio,
          useValue: {
            listar: () =>
              of([
                {
                  credito_id: 'credito-1',
                  cliente_id: 'cliente-1',
                  cliente_nombre_completo: 'María Pérez',
                  cobrador_id: 'cobrador-1',
                  cobrador_nombre: 'Luis',
                  estado_credito: 'activo',
                  monto_principal: '100000.00',
                  saldo_pendiente: '12000.00',
                  cuotas_pendientes: 1,
                  cuotas_en_mora: 0,
                },
              ]),
            aplicarMora: () =>
              of({
                cuotas_actualizadas: 1,
                creditos_actualizados: 1,
                fecha_referencia: '2026-09-21',
              }),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(ListadoCarteraComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('María Pérez');
    expect(fixture.nativeElement.textContent).toContain('Aplicar mora');
  });
});
