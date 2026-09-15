# Workflow — debug-fix

Síntoma reproducible. Diagnóstico antes que parche.

## Cargar SOLO

Zona del error + el spec si existe.

## Buenas prácticas

1. Reproducir (test que falla o pasos).
2. Causa raíz en una frase.
3. Fix mínimo.
4. Dejar **test de regresión** y encadenar `calidad-tests`. Sin ese test, el bug puede volver y se daría por “entregado” en falso.

## Prompt

```
Necesito: debug-fix
Síntoma / pasos / capa / mensaje exacto
```
