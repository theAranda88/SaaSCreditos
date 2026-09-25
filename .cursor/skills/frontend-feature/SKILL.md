---
name: frontend-feature
description: UI Angular compleja (jornada del cobrador, dashboard) con capas, i18n, tokens SCSS y tests del flujo. No recalcular cartera en el cliente.
---

# Skill: Frontend Feature (Angular)

## Cuándo

Flujos multi-paso, dashboards o jornadas (cobro, alta de crédito, panel de indicadores). No usar para un CRUD simple → `frontend-crud`.

## Antes de codificar

1. **`frontend-arquitectura`** + `reference.md`.
2. Mapear cada paso de UI a un endpoint real en OpenAPI. Si falta contrato → parar y rutar a backend.

## Estructura

- Un **contenedor por paso o pantalla** (`jornada-cobro.contenedor.ts`, `panel-indicadores.contenedor.ts`).
- Sub-vistas en `presentacion/` (tarjetas, filas de cuota, modales de confirmación).
- Servicio(s) por agregado HTTP (`CobrosServicio`, `IndicadoresServicio`); coordinación entre pasos en el contenedor o un `*.facade.ts` **solo** si hay estado compartido entre varios contenedores del mismo flujo.
- Claves i18n por flujo: `cobros.jornada.*`, `dashboard.indicadores.*`, más `comun.*`.

## Buenas prácticas

- Un paso UI = un endpoint (o lectura ya acordada). Loading / vacío / error / 403 en cada paso.
- Cobrador: botones grandes (tokens), viewport móvil; RC-006 confirmación i18n antes de `registrarPago`.
- Totales del día (RC-009) y cartera: **solo** datos del API.
- Confirmaciones y toasts: claves i18n con interpolación (`{{monto}}`), no template strings en español en TS.
- SCSS: tokens; sin paleta duplicada.

## Implementación

1. Diagrama mental paso → endpoint → componente contenedor.
2. Implementar servicios HTTP primero; luego contenedores; extraer presentación cuando el template crezca.
3. Actualizar `public/i18n/es.json` en el mismo PR que las plantillas.

## calidad-tests (obligatorio)

- Confirmación de cobro (RC-006) antes de un solo POST.
- `guardAutenticacion` / `guardRol`: sin sesión o rol incorrecto redirige.
- Flujo feliz corto con HTTP mock; sin asserts de copy literal (usar claves i18n o `data-testid`).
- No duplicar POST por doble clic (deshabilitar botón o idempotencia visual).
