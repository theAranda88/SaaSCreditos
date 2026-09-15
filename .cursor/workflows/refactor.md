# Workflow — refactor

Mismo comportamiento, menos deuda.

## Cargar SOLO

El área nombrada + sus `*.spec.ts`.

## Buenas prácticas

- SPEC de qué **no** cambia (contratos HTTP, estados de cuota, UX).
- Suite existente debe seguir verde; si no hay tests, escribir los de caracterización **antes** de mover código.
- Identificadores nuevos en español si se tocan nombres.
- Encadenar `calidad-tests`. Rojo = refactor no cerrado.

## Prompt

```
Necesito: refactor
Módulo / por qué / beneficio
```
