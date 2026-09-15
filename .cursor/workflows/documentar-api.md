# Workflow — documentar-api

Swagger UI y Postman son parte del SDD. No sustituyen `calidad-tests`.

## Cargar SOLO

- `.cursor/docs/DOCUMENTACION.md`
- `.cursor/skills/documentar-api/SKILL.md`
- swagger del módulo + `tests/postman/`

## Buenas prácticas

- Antes del SPEC: skill `control-versiones` (ej. `docs/creditos_swagger_<modulo>` desde `creditos-prepro`).
- Mismo contrato que los tests HTTP (nombres en español, `/api/clientes`).
- Placeholders, nunca datos reales.
- Variables Postman en español: `url_base`, `token`, `negocio_id`, `cliente_id`.

## Prompt

```
Necesito: documentar-api
Módulo: [...]
```
