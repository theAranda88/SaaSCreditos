import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AuthServicio } from './auth.servicio';
import { crearGuardRol } from './guard-rol';
import { guardAutenticacion } from './guard-autenticacion';

describe('guardAutenticacion', () => {
  it('debe redirigir a login si no hay sesión', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthServicio, useValue: { estaAutenticado: () => false } },
      ],
    });

    const resultado = TestBed.runInInjectionContext(() =>
      guardAutenticacion({} as never, {} as never),
    );

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toBe('/login');
  });
});

describe('crearGuardRol', () => {
  it('debe redirigir al cobrador fuera de una ruta de administración', () => {
    const guard = crearGuardRol(['propietario', 'administrador']);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthServicio,
          useValue: {
            perfilActual: () => ({
              id: 'cobrador-1',
              nombre: 'Carlos',
              correo: 'carlos@ejemplo.com',
              rol: 'cobrador',
              negocio_id: 'negocio-a',
            }),
          },
        },
      ],
    });

    const resultado = TestBed.runInInjectionContext(() => guard({} as never, {} as never));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toBe('/app');
  });
});
