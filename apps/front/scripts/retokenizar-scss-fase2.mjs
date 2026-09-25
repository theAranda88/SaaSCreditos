import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..', 'src');

/** Orden: patrones más específicos primero */
const reemplazos = [
  [
    /background:\s*var\(--color-primario\);\s*color:\s*var\(--color-fondo-superficie\)/g,
    'background: var(--color-primario); color: var(--color-texto-on-primario)',
  ],
  [/\.boton-primario,\s*\n\s*\.filtros button,\s*\n\s*\.boton-tabla/g, '.boton-primario,\n.filtros button,\n.boton-tabla'],
  [
    /color:\s*var\(--color-fondo-superficie\);\s*\n\s*text-decoration:\s*none/g,
    'color: var(--color-texto-on-primario);\n  text-decoration: none',
  ],
  [/border:\s*1px solid/g, 'border: var(--grosor-borde) solid'],
  [/transition:\s*height 0\.2s ease/g, 'transition: height var(--duracion-transicion-corta) ease'],
  [/max-width:\s*960px/g, 'max-width: var(--ancho-contenido-inicio)'],
  [/max-width:\s*720px/g, 'max-width: var(--ancho-contenido-shell)'],
  [/max-width:\s*640px/g, 'max-width: var(--ancho-formulario-plataforma)'],
  [/max-width:\s*560px/g, 'max-width: var(--ancho-formulario)'],
  [/max-width:\s*420px/g, 'max-width: var(--ancho-login-tarjeta)'],
  [/minmax\(160px/g, 'minmax(var(--ancho-grid-min-columna)'],
  [/min-width:\s*5\.5rem/g, 'min-width: var(--ancho-boton-tabla-min)'],
  [/min-height:\s*4px/g, 'min-height: var(--altura-barra-grafico-min)'],
  [/min-height:\s*8rem/g, 'min-height: var(--altura-grafico-barras)'],
  [/height:\s*1\.25rem/g, 'height: var(--altura-barra-apilada)'],
  [/width:\s*2\.5rem/g, 'width: var(--ancho-barra-grafico)'],
  [/width:\s*0\.65rem;\s*height:\s*0\.65rem/g, 'width: var(--ancho-muestra-grafico); height: var(--ancho-muestra-grafico)'],
  [/padding:\s*3rem var\(--espaciado-xl\)/g, 'padding: var(--espaciado-3xl) var(--espaciado-xl)'],
  [/padding:\s*2rem var\(--espaciado-xl\)/g, 'padding: var(--espaciado-2xl) var(--espaciado-xl)'],
  [/padding:\s*var\(--espaciado-l\) 1\.25rem/g, 'padding: var(--espaciado-l) var(--padding-shell-estado-x)'],
  [/padding:\s*var\(--espaciado-l\) 1\.1rem/g, 'padding: var(--espaciado-l) var(--padding-tarjeta-kpi-x)'],
  [/padding:\s*var\(--espaciado-m\) 1rem/g, 'padding: var(--espaciado-m) var(--espaciado-l)'],
  [/padding:\s*var\(--espaciado-m\) 1\.25rem/g, 'padding: var(--espaciado-m) var(--padding-boton-primario-x)'],
  [/padding:\s*var\(--espaciado-m\) 0\.9rem/g, 'padding: var(--espaciado-m) var(--padding-boton-secundario-x)'],
  [/padding:\s*0\.85rem 1rem/g, 'padding: var(--padding-input-lg) var(--espaciado-l)'],
  [/padding:\s*0\.85rem\b/g, 'padding: var(--padding-input-lg)'],
  [/padding:\s*0\.9rem\b/g, 'padding: var(--padding-input-xl)'],
  [/padding:\s*1\.25rem/g, 'padding: var(--espaciado-lg)'],
  [/padding:\s*0\.45rem 0\.85rem/g, 'padding: var(--padding-campo-y) var(--padding-campo-x-ancho)'],
  [/padding:\s*0\.45rem 0\.65rem/g, 'padding: var(--padding-campo-y) var(--padding-campo-x)'],
  [/padding:\s*0\.55rem 0\.75rem/g, 'padding: var(--padding-campo-y) var(--espaciado-m)'],
  [/padding:\s*0\.5rem 0\.75rem/g, 'padding: var(--espaciado-s) var(--espaciado-m)'],
  [/padding:\s*0\.25rem 0\.75rem/g, 'padding: var(--espaciado-xs) var(--espaciado-m)'],
  [/padding:\s*0\.2rem 0\.6rem/g, 'padding: var(--padding-badge-y) var(--padding-badge-x)'],
  [/padding:\s*0\.15rem 0\.5rem/g, 'padding: var(--padding-etiqueta-y) var(--padding-etiqueta-x)'],
  [/padding:\s*0\.1rem 0\.45rem/g, 'padding: var(--padding-etiqueta-micro-y) var(--padding-etiqueta-micro-x)'],
  [/padding:\s*0\.65rem 0\.9rem/g, 'padding: var(--radio-borde-medio) var(--padding-boton-secundario-x)'],
  [/padding-left:\s*1\.1rem/g, 'padding-left: var(--padding-lista-indent)'],
  [/padding:\s*var\(--espaciado-s\) 0\.9rem/g, 'padding: var(--espaciado-s) var(--padding-boton-secundario-x)'],
  [/padding:\s*var\(--espaciado-s\) 0\.85rem/g, 'padding: var(--espaciado-s) var(--padding-campo-x-ancho)'],
  [/padding:\s*0\.7rem 0\.85rem/g, 'padding: var(--padding-input-y) var(--padding-campo-x-ancho)'],
  [/margin:\s*1rem 0 0\.5rem/g, 'margin: var(--espaciado-l) 0 var(--espaciado-s)'],
  [/margin:\s*0\.5rem 0/g, 'margin: var(--espaciado-s) 0'],
  [/margin-top:\s*1\.5rem/g, 'margin-top: var(--espaciado-xl)'],
  [/margin-top:\s*0\.5rem/g, 'margin-top: var(--espaciado-s)'],
  [/margin:\s*0\.35rem 0 0/g, 'margin: var(--espaciado-gap-etiqueta) 0 0'],
  [/margin:\s*0\.5rem 0 0/g, 'margin: var(--espaciado-s) 0 0'],
  [/margin:\s*0\.15rem 0 0/g, 'margin: var(--espaciado-xxs) 0 0'],
  [/margin:\s*0 0 0\.25rem/g, 'margin: 0 0 var(--espaciado-xs)'],
  [/margin-top:\s*0\.35rem/g, 'margin-top: var(--espaciado-gap-etiqueta)'],
  [/margin-right:\s*0\.35rem/g, 'margin-right: var(--espaciado-gap-etiqueta)'],
  [/margin-right:\s*0\.25rem/g, 'margin-right: var(--espaciado-xs)'],
  [/margin-left:\s*0\.35rem/g, 'margin-left: var(--espaciado-gap-etiqueta)'],
  [/gap:\s*1\.25rem/g, 'gap: var(--espaciado-lg)'],
  [/gap:\s*0\.9rem/g, 'gap: var(--espaciado-gap-seccion)'],
  [/gap:\s*0\.85rem/g, 'gap: var(--espaciado-gap-formulario)'],
  [/gap:\s*0\.65rem/g, 'gap: var(--espaciado-gap-rejilla)'],
  [/gap:\s*0\.6rem/g, 'gap: var(--espaciado-gap-confirmacion)'],
  [/gap:\s*0\.35rem/g, 'gap: var(--espaciado-gap-etiqueta)'],
  [/gap:\s*0\.25rem/g, 'gap: var(--espaciado-xs)'],
  [/gap:\s*0\.2rem/g, 'gap: var(--espaciado-gap-auditoria)'],
  [/font-size:\s*0\.95rem/g, 'font-size: var(--fuente-subtitulo)'],
  [/font-size:\s*0\.72rem/g, 'font-size: var(--fuente-micro)'],
  [
    /border-radius:\s*var\(--radio-borde-barra\)\s+0\.35rem 0 0/g,
    'border-radius: var(--radio-borde-barra) var(--radio-borde-barra) 0 0',
  ],
  [/border-radius:\s*var\(--espaciado-l\)/g, 'border-radius: var(--radio-borde)'],
  [/min-height:\s*2\.25rem/g, 'min-height: var(--altura-boton-compacto)'],
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
  if (next !== content) {
    fs.writeFileSync(file, next);
    console.log('updated', path.relative(root, file));
  }
}
