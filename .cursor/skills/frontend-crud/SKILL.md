---
name: frontend-crud
description: UI Angular standalone (listado + formulario + rutas lazy + tests) para un CRUD backend ya verde. Capas, tokens SCSS, i18n. Identificadores en español.
---

# Skill: Frontend CRUD (Angular)

## Cuándo

Backend existe y su `calidad-tests` pasó. Listado + formulario (crear/editar/inactivar según API).

## Antes de codificar

1. Cargar **`frontend-arquitectura`** (+ `reference.md` si hay duda de carpetas o i18n).
2. Copiar el patrón del feature más cercano (`clientes`, `creditos`, …).

## Estructura mínima del módulo

```
funcionalidades/<entidad>/
  <entidad>.servicio.ts
  contenedores/listado-<entidad>.contenedor.ts
  contenedores/formulario-<entidad>.contenedor.ts
  presentacion/   # tablas, filas, campos repetibles (si aplica)
  *.scss          # solo var(--*) desde nucleo/ui/tokens
```

Rutas lazy en `app.routes.ts` o `<entidad>.rutas.ts` con `guardRol`.

## Implementación

1. Modelo / interfaz alineada a OpenAPI (`nucleo/modelos` o `@creditos/shared-types`).
2. `*Servicio` con HttpClient; URLs `/api/<recurso>`; sin lógica de saldo ni reglas que pertenecen al API.
3. Contenedores: signals, reactive forms, estados cargando/vacío/error/403.
4. Añadir **todas** las cadenas nuevas a `public/i18n/es.json` bajo `<entidad>.listado.*`, `<entidad>.formulario.*`, reutilizar `comun.*` cuando exista.
5. SCSS: `@use` de tokens; sin hex/rgb locales.
6. Permisos: ocultar acciones prohibidas; el API sigue devolviendo 403.

## Buenas prácticas

- Standalone, `@if`/`@for`, sin `any`.
- Errores de red y validación: claves i18n (`errores.*`, `<entidad>.validacion.*`).
- Listados: reutilizar patrones de `nucleo/ui/densidad-listados.scss` si aplica.
- No recalcular totales de negocio en el cliente.

## calidad-tests (obligatorio)

- Form inválido **no** dispara POST.
- Listado vacío muestra clave i18n de vacío (test con loader fake de traducción).
- Servicio usa la URL correcta (`HttpTestingController`).
- Si se añade botón de crear: sin rol, no visible o guard bloquea (según SPEC).
