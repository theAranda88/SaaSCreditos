# Workflow — backend-to-frontend

API documentada y **verde**; falta Angular por rol.

## Cargar SOLO

- `.cursor/skills/backend-to-frontend/SKILL.md`
- controller / swagger del módulo
- `nucleo` Angular (auth, interceptors)

## Buenas prácticas

- Antes del SPEC: skill `control-versiones` (ej. `feature/creditos_ui_<modulo>` desde `creditos-prepro`).
- Extraer permisos de `requireRole` / guards, no inventarlos en la UI.
- Cobrador no ve configuración.
- Tipos alineados al OpenAPI (`Cliente`, no `Customer`).
- Encadenar `calidad-tests` de la feature nueva.

## Prompt

```
Necesito: backend-to-frontend-integration
Módulo: Creditos
Roles y acciones
```
