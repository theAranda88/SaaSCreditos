import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { CobroDelDia, CobrosDelDiaRespuesta, PerfilUsuario } from '@creditos/shared-types';
import { proveedoresTraduccionPrueba } from '../../nucleo/i18n/proveedores-traduccion-prueba';
import { CobrosServicio } from './cobros.servicio';
import { JornadaCobroComponent } from './jornada-cobro.component';

const perfilCobrador: PerfilUsuario = {
  id: 'cobrador-1',
  nombre: 'Carlos',
  correo: 'carlos@ejemplo.com',
  rol: 'cobrador',
  negocio_id: 'negocio-a',
};

const cobroPendiente: CobroDelDia = {
  cuota_id: 'cuota-1',
  credito_id: 'credito-1',
  numero_cuota: 1,
  fecha_vencimiento: '2026-09-21',
  fecha_cobro_efectiva: '2026-09-21',
  monto_esperado: '12000.00',
  saldo_pendiente: '12000.00',
  estado: 'pendiente',
  cliente_id: 'cliente-1',
  cliente_nombre_completo: 'Luis Gómez',
  atrasado: false,
  programado: false,
};

const respuestaDiaHabil: CobrosDelDiaRespuesta = {
  fecha: '2026-09-21',
  dia_habil: true,
  mensaje: null,
  cobros: [cobroPendiente],
};

describe('JornadaCobroComponent', () => {
  it('debe mostrar aviso cuando el día no es hábil', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [JornadaCobroComponent],
      providers: [
        provideRouter([]),
        proveedoresTraduccionPrueba(),
        {
          provide: CobrosServicio,
          useValue: {
            listarCobrosDelDia: () =>
              of({
                fecha: '2026-09-20',
                dia_habil: false,
                mensaje: 'No hay cobro en domingos ni festivos.',
                cobros: [],
              }),
            resumenDiario: () =>
              of({
                fecha: '2026-09-20',
                dia_habil: false,
                cobrador_id: 'cobrador-1',
                esperado: '0.00',
                cobrado: '0.00',
                pendiente: '0.00',
              }),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(JornadaCobroComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay cobro en domingos');
    expect(fixture.nativeElement.textContent).toContain('comun.calendario.domingo');
  });

  it('debe marcar vencimiento trasladado cuando cae en domingo', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [JornadaCobroComponent],
      providers: [
        provideRouter([]),
        proveedoresTraduccionPrueba(),
        {
          provide: CobrosServicio,
          useValue: {
            listarCobrosDelDia: () =>
              of({
                fecha: '2026-09-21',
                dia_habil: true,
                mensaje: null,
                cobros: [
                  {
                    ...cobroPendiente,
                    fecha_vencimiento: '2026-09-20',
                    fecha_cobro_efectiva: '2026-09-21',
                  },
                ],
              }),
            resumenDiario: () =>
              of({
                fecha: '2026-09-21',
                dia_habil: true,
                cobrador_id: 'cobrador-1',
                esperado: '12000.00',
                cobrado: '0.00',
                pendiente: '12000.00',
              }),
            listarHistorial: () => of([]),
            registrarPago: () => of({} as never),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(JornadaCobroComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('comun.calendario.domingo');
    expect(fixture.nativeElement.textContent).toContain('cobros.jornada.trasladado_cobro');
  });

  it('debe confirmar antes de disparar un solo POST de cobro', () => {
    const cobrosServicio = {
      listarCobrosDelDia: vi.fn(() => of(respuestaDiaHabil)),
      resumenDiario: vi.fn(() =>
        of({
          fecha: '2026-09-21',
          dia_habil: true,
          cobrador_id: perfilCobrador.id,
          esperado: '12000.00',
          cobrado: '0.00',
          pendiente: '12000.00',
        }),
      ),
      listarHistorial: vi.fn(() => of([])),
      registrarPago: vi.fn(() => of({ id: 'pago-1', monto: '6000.00', estado: 'valido' })),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [JornadaCobroComponent],
      providers: [
        provideRouter([]),
        proveedoresTraduccionPrueba(),
        { provide: CobrosServicio, useValue: cobrosServicio },
      ],
    });

    const fixture = TestBed.createComponent(JornadaCobroComponent);
    fixture.detectChanges();
    fixture.componentInstance.seleccionarCobro(cobroPendiente);
    fixture.componentInstance.formulario.setValue({ monto: 6000, metodoPago: 'efectivo' });
    fixture.componentInstance.revisar();

    expect(cobrosServicio.registrarPago).not.toHaveBeenCalled();
    expect(fixture.componentInstance.confirmacion()).toEqual({ monto: 6000, metodoPago: 'efectivo' });

    fixture.componentInstance.confirmar();

    expect(cobrosServicio.registrarPago).toHaveBeenCalledTimes(1);
    expect(cobrosServicio.registrarPago).toHaveBeenCalledWith({
      cuotaId: 'cuota-1',
      monto: 6000,
      metodoPago: 'efectivo',
    });
  });

  it('no debe registrar cobro si el formulario es inválido', () => {
    const cobrosServicio = {
      listarCobrosDelDia: vi.fn(() => of(respuestaDiaHabil)),
      resumenDiario: vi.fn(() => of(null)),
      listarHistorial: vi.fn(() => of([])),
      registrarPago: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [JornadaCobroComponent],
      providers: [
        provideRouter([]),
        proveedoresTraduccionPrueba(),
        { provide: CobrosServicio, useValue: cobrosServicio },
      ],
    });

    const fixture = TestBed.createComponent(JornadaCobroComponent);
    fixture.detectChanges();
    fixture.componentInstance.seleccionarCobro(cobroPendiente);
    fixture.componentInstance.formulario.setValue({ monto: 0, metodoPago: 'efectivo' });
    fixture.componentInstance.revisar();
    fixture.componentInstance.confirmar();

    expect(cobrosServicio.registrarPago).not.toHaveBeenCalled();
  });
});
