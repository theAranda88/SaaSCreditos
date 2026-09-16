---
name: documentar-api
description: Actualiza OpenAPI/Swagger UI y colecciones Postman. Complementa, no reemplaza, calidad-tests.
---

# Skill: Documentar API (Swagger + Postman)

## Dónde

```
apps/api/  (decoradores @nestjs/swagger)
tests/postman/
  postman_collection.json
  postman_environment.json
  postman_environment.docker.json
  postman_environment.production.json
```

UI: `http://localhost:3000/api/docs`

## Buenas prácticas

- Paths en español: `/api/clientes`, `/api/pagos`.
- Tags: Auth, Negocios, Usuarios, Clientes, Creditos, Cuotas, Cobros, Cartera, Planes, Admin.
- Variables: `url_base`, `token`, `negocio_id`, `cliente_id`, `credito_id`, `cuota_id`.
- Examples sintéticos. Roles en `description`.
- Sincronizado con los tests HTTP (mismo status y campos).
