# Workflow — frontend-crud

UI Angular de un CRUD cuyo backend **ya está verde** (tests + Swagger).

## Cargar SOLO

- `.cursor/skills/frontend-arquitectura/SKILL.md` (+ `reference.md` si hace falta)
- `.cursor/skills/frontend-crud/SKILL.md`
- OpenAPI del recurso
- feature similar en `apps/front/src/app/funcionalidades/`

## Buenas prácticas

- Antes del SPEC: skill `control-versiones` (ej. `feature/creditos_ui_crud_<entidad>` desde `creditos-prepro`).
- Capas: servicio / contenedor / presentación (`30-frontend.mdc`).
- i18n: nuevas claves en `public/i18n/es.json`; cero literales en template.
- Estilos: `nucleo/ui/_tokens.scss`; componentes con `var(--*)`.
- Standalone, Signals, reactive forms, sin `any`.
- `ClientesServicio`, no `CustomersService`.
- El front oculta botones; el API sigue autorizando.
- Encadenar `calidad-tests` (form inválido no POST; listado vacío; URL del servicio).

## Prompt

```
Necesito: frontend-crud
Modelo: Clientes
Roles: admin crea; cobrador no
```
