import { describe, expect, it } from 'vitest';
import { CONTRASENA_USUARIOS_PRUEBA } from './seed';

describe('Semilla de desarrollo', () => {
  it('debe definir contraseña de prueba con longitud mínima de seguridad', () => {
    expect(CONTRASENA_USUARIOS_PRUEBA.length).toBeGreaterThanOrEqual(8);
  });
});
