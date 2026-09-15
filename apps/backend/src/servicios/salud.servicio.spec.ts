import { describe, expect, it } from 'vitest';
import { SaludServicio } from './salud.servicio';

describe('SaludServicio', () => {
  it('debe responder estado operativo de la API', () => {
    const servicio = new SaludServicio();

    expect(servicio.obtenerSalud()).toEqual({
      estado: 'ok',
      servicio: 'api',
      version: '0.1.0',
    });
  });
});
