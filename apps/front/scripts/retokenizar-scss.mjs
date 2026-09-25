import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..', 'src');

const reemplazos = [
  [/linear-gradient\(180deg,\s*#f8fafc\s+0%,\s*#eef2ff\s+100%\)/gi, 'var(--degradado-pantalla)'],
  [/linear-gradient\(135deg,\s*#eff6ff\s+0%,\s*#dbeafe\s+100%\)/gi, 'var(--degradado-kpi-destacado)'],
  [/#f8fafc\b/gi, 'var(--color-fondo-app)'],
  [/#ffffff\b/gi, 'var(--color-fondo-superficie)'],
  [/#f1f5f9\b/gi, 'var(--color-fondo-elevado)'],
  [/#0f172a\b/gi, 'var(--color-texto-intenso)'],
  [/#1f2937\b/gi, 'var(--color-texto-principal)'],
  [/#334155\b/gi, 'var(--color-texto-nav)'],
  [/#475569\b/gi, 'var(--color-texto-muted)'],
  [/#64748b\b/gi, 'var(--color-texto-secundario)'],
  [/#94a3b8\b/gi, 'var(--color-texto-tenue)'],
  [/#1e3a8a\b/gi, 'var(--color-primario-oscuro)'],
  [/#1e40af\b/gi, 'var(--color-primario-medio)'],
  [/#2563eb\b/gi, 'var(--color-primario-enfasis)'],
  [/#1d4ed8\b/gi, 'var(--color-primario)'],
  [/#eef2ff\b/gi, 'var(--color-primario-suave)'],
  [/#dbeafe\b/gi, 'var(--color-primario-rol)'],
  [/#eff6ff\b/gi, 'var(--color-primario-fondo-suave)'],
  [/#bfdbfe\b/gi, 'var(--color-primario-borde-suave)'],
  [/#e5e7eb\b/gi, 'var(--color-borde)'],
  [/#d1d5db\b/gi, 'var(--color-borde-input)'],
  [/#166534\b/gi, 'var(--color-exito)'],
  [/#ecfdf5\b/gi, 'var(--color-exito-fondo)'],
  [/#047857\b/gi, 'var(--color-exito-texto-alt)'],
  [/#b45309\b/gi, 'var(--color-advertencia)'],
  [/#92400e\b/gi, 'var(--color-advertencia-texto-alt)'],
  [/#fffbeb\b/gi, 'var(--color-advertencia-fondo-claro)'],
  [/#b91c1c\b/gi, 'var(--color-error)'],
  [/#fef2f2\b/gi, 'var(--color-error-fondo)'],
  [/#fee2e2\b/gi, 'var(--color-error-fondo-suave)'],
  [/#fff1f2\b/gi, 'var(--color-error-fondo-rosado)'],
  [/#fecaca\b/gi, 'var(--color-error-borde)'],
  [/#e11d48\b/gi, 'var(--color-mora-grafico)'],
  [/#fff7ed\b/gi, 'var(--color-alerta-fondo)'],
  [/#9a3412\b/gi, 'var(--color-alerta-texto)'],
  [/#fed7aa\b/gi, 'var(--color-alerta-borde)'],
  [/#f5f3ff\b/gi, 'var(--color-trasladado-fondo)'],
  [/#5b21b6\b/gi, 'var(--color-trasladado-texto)'],
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, acc);
    else if (name.name.endsWith('.scss') && name.name !== '_tokens.scss') acc.push(p);
  }
  return acc;
}

for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8');
  let next = content;
  for (const [pattern, replacement] of reemplazos) {
    next = next.replace(pattern, replacement);
  }
  next = next.replace(
    /var\(--color-advertencia-fondo,\s*var\(--color-alerta-fondo\)\)/g,
    'var(--color-alerta-fondo)',
  );
  const espaciado = [
    [/box-shadow:\s*0 10px 30px rgba\(15,\s*23,\s*42,\s*0\.08\)/g, 'box-shadow: var(--sombra-tarjeta-elevada)'],
    [/border-radius:\s*999px/g, 'border-radius: var(--radio-pill)'],
    [/border-radius:\s*1rem/g, 'border-radius: var(--espaciado-l)'],
    [/border-radius:\s*0\.85rem/g, 'border-radius: var(--radio-borde-tarjeta)'],
    [/border-radius:\s*0\.75rem/g, 'border-radius: var(--radio-borde-grande)'],
    [/border-radius:\s*0\.65rem/g, 'border-radius: var(--radio-borde-medio)'],
    [/border-radius:\s*0\.35rem/g, 'border-radius: var(--radio-borde-barra)'],
    [/border-radius:\s*0\.5rem/g, 'border-radius: var(--radio-borde)'],
    [/min-height:\s*3rem/g, 'min-height: var(--altura-boton-cobrador)'],
    [/min-width:\s*6\.5rem/g, 'min-width: var(--ancho-boton-cobrador-min)'],
    [/opacity:\s*0\.7\b/g, 'opacity: var(--opacidad-resumen-inhabil)'],
    [/opacity:\s*0\.6\b/g, 'opacity: var(--opacidad-deshabilitado)'],
    [/font-size:\s*2rem/g, 'font-size: var(--fuente-display)'],
    [/font-size:\s*1\.75rem/g, 'font-size: var(--fuente-kpi)'],
    [/font-size:\s*1\.5rem/g, 'font-size: var(--fuente-titulo-lg)'],
    [/font-size:\s*1\.15rem/g, 'font-size: var(--fuente-titulo)'],
    [/font-size:\s*1\.05rem/g, 'font-size: var(--fuente-titulo-sm)'],
    [/font-size:\s*1\.1rem/g, 'font-size: var(--fuente-titulo-sm)'],
    [/font-size:\s*1rem\b/g, 'font-size: var(--fuente-md)'],
    [/font-size:\s*0\.9rem/g, 'font-size: var(--fuente-base)'],
    [/font-size:\s*0\.875rem/g, 'font-size: var(--fuente-sm)'],
    [/font-size:\s*0\.85rem/g, 'font-size: var(--fuente-xs)'],
    [/font-size:\s*0\.8rem/g, 'font-size: var(--fuente-xs)'],
    [/font-size:\s*0\.75rem/g, 'font-size: var(--fuente-xxs)'],
    [/gap:\s*1\.5rem/g, 'gap: var(--espaciado-xl)'],
    [/gap:\s*1rem\b/g, 'gap: var(--espaciado-l)'],
    [/gap:\s*0\.75rem/g, 'gap: var(--espaciado-m)'],
    [/gap:\s*0\.5rem/g, 'gap: var(--espaciado-s)'],
    [/padding:\s*1\.5rem/g, 'padding: var(--espaciado-xl)'],
    [/padding:\s*1rem\b/g, 'padding: var(--espaciado-l)'],
    [/padding:\s*0\.75rem/g, 'padding: var(--espaciado-m)'],
    [/margin:\s*0\.25rem/g, 'margin: var(--espaciado-xs)'],
  ];

  for (const [pattern, replacement] of espaciado) {
    next = next.replace(pattern, replacement);
  }

  if (next !== content) {
    fs.writeFileSync(file, next);
    console.log('updated', path.relative(root, file));
  }
}
