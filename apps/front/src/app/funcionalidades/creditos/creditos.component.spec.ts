import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { proveedoresTraduccionPrueba } from '../../nucleo/i18n/proveedores-traduccion-prueba';
import { ClientesServicio } from '../clientes/clientes.servicio';
import { CreditosServicio } from './creditos.servicio';
import { FormularioCreditoComponent } from './formulario-credito.component';
import { ListadoCreditosComponent } from './listado-creditos.component';

describe('ListadoCreditosComponent', () => {
  it('debe mostrar estado vacío cuando no hay créditos', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ListadoCreditosComponent],
      providers: [
        provideRouter([]),
        proveedoresTraduccionPrueba(),
        {
          provide: CreditosServicio,
          useValue: { listar: () => of([]) },
        },
        {
          provide: ClientesServicio,
          useValue: { listar: () => of([]) },
        },
      ],
    });

    const fixture = TestBed.createComponent(ListadoCreditosComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('creditos.listado.vacio');
  });
});

describe('FormularioCreditoComponent', () => {
  it('no debe llamar crear si el formulario es inválido', () => {
    const creditosServicio = { crear: vi.fn() };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [FormularioCreditoComponent],
      providers: [
        proveedoresTraduccionPrueba(),
        { provide: CreditosServicio, useValue: creditosServicio },
        {
          provide: ClientesServicio,
          useValue: { listar: () => of([]) },
        },
        provideRouter([]),
      ],
    });

    const fixture = TestBed.createComponent(FormularioCreditoComponent);
    fixture.detectChanges();
    fixture.componentInstance.enviar();

    expect(creditosServicio.crear).not.toHaveBeenCalled();
  });
});
