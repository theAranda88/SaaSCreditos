import { describe, expect, it } from 'vitest';
import { obtenerEstadoShellInicial } from './shell.modelo';

describe('Shell (Fase 0)', () => {
  it('debe definir el shell mínimo del frontend', () => {
    const shell = obtenerEstadoShellInicial();

    expect(shell.titulo).toBe('Creditos SaaS');
    expect(shell.estadoFront).toBe('ok');
    expect(shell.mensaje).toContain('infraestructura');
  });

  it('debe exponer estado operativo del frontend', () => {
    const shell = obtenerEstadoShellInicial();

    expect(shell.estadoFront).toBe('ok');
  });
});
