# Workflow — backend-to-frontend

API documentada y **verde**; falta Angular por rol.

## Cargar SOLO

- `.cursor/skills/frontend-arquitectura/SKILL.md` (+ `reference.md`)
- `.cursor/skills/backend-to-frontend/SKILL.md`
- controller / swagger del módulo
- `apps/front/src/app/nucleo` (auth, interceptors, http)

## Buenas prácticas

- Antes del SPEC: skill `control-versiones` (ej. `feature/creditos_ui_<modulo>` desde `creditos-prepro`).
- Matriz rol → rutas → acciones; permisos desde guards del API.
- Estructura contenedor/presentación + i18n + tokens en cada módulo cableado.
- Cobrador no ve configuración.
- Tipos alineados al OpenAPI (`Cliente`, no `Customer`).
- Encadenar `calidad-tests` de la feature nueva.

## Prompt

```
Necesito: backend-to-frontend-integration
Módulo: Creditos
Roles y acciones
```
