# Workflow — frontend-feature

UI Angular no trivial: jornada del cobrador, dashboard, alta de crédito.

## Cargar SOLO

- `.cursor/skills/frontend-arquitectura/SKILL.md` (+ `reference.md`)
- `.cursor/skills/frontend-feature/SKILL.md`
- contratos HTTP del flujo

## Buenas prácticas

- Antes del SPEC: skill `control-versiones` (ej. `feature/creditos_<flujo_ui>` desde `creditos-prepro`).
- Contenedor por paso; presentación extraída; servicios HTTP separados.
- Cada paso mapea a un endpoint real.
- i18n en todo copy visible; confirmación RC-006 con claves `cobros.*`.
- Tokens SCSS; móvil cobrador.
- No recalcular cartera en el cliente como verdad.
- Tests del flujo corto + guard. Encadenar `calidad-tests`.

## Prompt

```
Necesito: frontend-feature
Flujo: jornada de cobro
Viewport: 390px
```
