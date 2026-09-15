# Workflow — frontend-crud

UI Angular de un CRUD cuyo backend **ya está verde** (tests + Swagger).

## Cargar SOLO

- `.cursor/skills/frontend-crud/SKILL.md`
- OpenAPI del recurso
- feature similar

## Buenas prácticas

- Antes del SPEC: skill `control-versiones` (ej. `feature/creditos_ui_crud_<entidad>` desde `creditos-prepro`).
- Standalone, Signals, reactive forms, sin `any`.
- `ClientesServicio`, no `CustomersService`.
- El front oculta botones; el API sigue autorizando.
- Encadenar `calidad-tests` (form inválido no POST; listado vacío).

## Prompt

```
Necesito: frontend-crud
Modelo: Clientes
Roles: admin crea; cobrador no
```
