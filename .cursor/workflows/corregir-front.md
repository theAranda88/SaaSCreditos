# Workflow — corregir-front

La API está bien; la pantalla Angular no (layout, móvil, bug visual, copy).

## Cargar SOLO

- `.cursor/skills/frontend-arquitectura/SKILL.md` (+ `reference.md` para i18n/SCSS)
- componente / scss / template del síntoma
- `rules/30-frontend.mdc`

## Buenas prácticas

- Antes del SPEC: skill `control-versiones` (ej. `fix/creditos_ui_<pantalla>` desde `creditos-prepro`).
- Cambio mínimo. Si el dato viene mal → `debug-fix` backend.
- Al tocar textos: mover a `public/i18n/es.json`, no dejar literales nuevos.
- Al tocar colores/espaciado: token en `nucleo/ui/_tokens.scss`, no parche local con hex.
- Si el archivo mezcla HTTP + tabla grande → considerar split contenedor/presentación solo en el alcance del fix.
- Nombres de clase CSS de dominio en español si son propias (`tarjeta-cobro`).
- Si cambia comportamiento (no solo estilo): spec del componente + `calidad-tests`.

## Prompt

```
Necesito: corregir-front
Pantalla / síntoma / viewport
```
