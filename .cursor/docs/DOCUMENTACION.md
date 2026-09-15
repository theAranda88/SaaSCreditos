# Documentación de API — parte obligatoria del SDD

Toda funcionalidad backend nueva o cambiada actualiza **Swagger UI** y **Postman**. Eso **no reemplaza** los tests automatizados (`calidad-tests`).

## Ubicaciones (monorepo)

```
apps/api/           # decoradores @nestjs/swagger
tests/postman/
  CreditosSaaS.postman_collection.json
  local.postman_environment.json
  staging.postman_environment.json
```

UI local: `http://localhost:3000/api/docs`

## Cuándo

| Actividad | Swagger | Postman | Tests auto |
|---|---|---|---|
| Endpoint nuevo | Obligatorio | Obligatorio | Obligatorio (verde) |
| DTO nuevo | Obligatorio | — | Si cambia contrato |
| Cambio de contrato | Obligatorio | Actualizar | Actualizar |
| Bug de flow | Si cambia behavior | Si cambia flow | Test de regresión |

## Contrato mínimo

- Paths en español: `/api/clientes`, `/api/pagos`
- `description` en español con rol y `negocio_id`
- responses: éxito + 400, 401, 403, 404, 409, 422 según aplique
- examples sintéticos

## Postman

Carpetas: Auth, Negocios, Usuarios, Clientes, Creditos, Cuotas, Cobros, Cartera, Planes, Admin.

Variables: `url_base`, `token`, `negocio_id`, `cliente_id`, `credito_id`, `cuota_id`.

## Checklist

- [ ] Path visible en Swagger UI
- [ ] Request en la carpeta correcta
- [ ] Caso 403 de otro negocio en flujos de dinero
- [ ] Mismo contrato que los specs HTTP
