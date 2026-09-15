# Workflow — corregir-front

La API está bien; la pantalla Angular no.

## Cargar SOLO

- componente / scss / template del síntoma
- `rules/30-frontend.mdc`

## Buenas prácticas

- Cambio mínimo. Si el dato viene mal → `debug-fix` backend.
- Nombres de clase CSS de dominio en español si son propias (`tarjeta-cobro`), no inventar un design system paralelo.
- Si cambia comportamiento (no solo color): spec del componente + `calidad-tests`.

## Prompt

```
Necesito: corregir-front
Pantalla / síntoma / viewport
```
