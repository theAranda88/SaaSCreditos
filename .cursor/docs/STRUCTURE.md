# Estructura `.cursor/` — Creditos SaaS (SDD)

```
.cursor/
  workflows/
    ROUTER.md                 <- empeza SIEMPRE aca
    control-versiones.md      <- sugerencia de rama antes de codificar
    bootstrap-monorepo.md
    schema-bd.md
    backend-crud.md
    backend-feature.md
    registrar-pago.md
    auth-flow.md
    frontend-crud.md
    frontend-feature.md
    backend-to-frontend.md
    documentar-api.md
    corregir-front.md
    calidad-tests.md
    debug-fix.md
    refactor.md
  rules/
    00-core.mdc               alwaysApply
    10-backend.mdc
    15-nomenclatura.mdc       alwaysApply (español)
    20-proceso.mdc            alwaysApply
    30-frontend.mdc
    40-respuestas-chat.mdc    alwaysApply
    50-calidad-tests.mdc      alwaysApply (sin verde no hay entrega)
  skills/                     recetas paso a paso
    frontend-arquitectura     capas, tokens SCSS, i18n (previo a UI)
    backend-crud, backend-feature, registrar-pago,
    frontend-crud, frontend-feature, backend-to-frontend,
    auth-flow, documentar-api, calidad-tests, control-versiones
  docs/                       INDEX, QUICK_START, PLAN_IMPLEMENTACION, DOCUMENTACION, STRUCTURE
  LECCIONES.md                append-only
```

En la raíz del repo (fuera de `.cursor/`):

- `AGENTS.md` — guía corta del agente
- `docs/00-esquema-bd.md` — modelo canónico
- `docs/01-SRS.md` / `docs/02-Arquitectura-Finanzas.md` — base de req
- `docs/pdf/` — PDF v1.2 generados

## Cómo invocar

```
Necesito: [skill del ROUTER]

[formato de entrada del workflow]
```

El agente lee `.cursor/workflows/ROUTER.md`, abre UNA fila y sigue ese workflow.
