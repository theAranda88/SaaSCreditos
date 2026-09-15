---
name: frontend-crud
description: UI Angular standalone (listado + formulario + rutas lazy + tests) para un CRUD backend ya verde. Identificadores en español.
---

# Skill: Frontend CRUD (Angular)

## Cuándo

Backend existe y su `calidad-tests` pasó. Listado + form.

## Buenas prácticas

- `funcionalidades/clientes/`, `ClientesServicio`, `ListadoClientesComponent`.
- Standalone, Signals, `@if`/`@for`, reactive forms, sin `any`.
- Lazy loading + `guardRol`.
- Errores del API en español en UI.
- Sin lógica de saldo.

## Implementación

1. Interfaz `Cliente` en `nucleo/modelos` o `packages/shared-types`.
2. Servicio HttpClient tipado.
3. Listado + form.
4. **calidad-tests**: form inválido no llama POST; listado vacío; servicio usa `/api/clientes`.
