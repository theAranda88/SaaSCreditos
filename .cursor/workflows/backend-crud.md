# Workflow — backend-crud

CRUD de una entidad **ya** en `docs/00-esquema-bd.md`.

**No usar para pagos, cuotas ni reasignación.**

## Cargar SOLO

- `.cursor/skills/backend-crud/SKILL.md`
- sección de la entidad en el esquema
- un módulo similar si existe

## Buenas prácticas

- Antes del SPEC: skill `control-versiones` (ej. `feature/creditos_crud_clientes` desde `creditos-prepro`).
- Capas: controlador → servicio → repositorio. Sin SQL en el controlador.
- `negocio_id` del token, nunca del body.
- Inactivar, no DELETE físico.
- Identificadores en español (`ClientesServicio.crearCliente`).
- Al terminar: **calidad-tests** (único + 403 de otro negocio). Sin verde no se entrega.

## Prompt

```
Necesito: backend-crud
Modelo: [clientes|usuarios|...]
Roles: [quién crea/lista/edita/inactiva]
```

## Done

Repositorio + servicio + controlador + guards + Swagger + Postman + tests verdes. Sin frontend.
