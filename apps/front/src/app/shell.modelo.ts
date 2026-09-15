export interface EstadoShell {
  titulo: string;
  mensaje: string;
  estadoFront: 'ok';
}

export function obtenerEstadoShellInicial(): EstadoShell {
  return {
    titulo: 'Creditos SaaS',
    mensaje: 'Shell mínimo de la Fase 0 — infraestructura reproducible.',
    estadoFront: 'ok',
  };
}
