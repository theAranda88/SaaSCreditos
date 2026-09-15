---
name: backend-crud
description: CRUD NestJS de una entidad del esquema (repositorio, servicio, controlador, validación, Swagger, Postman, tests). Sin pagos. Nombres en español.
---

# Skill: Backend CRUD

## Cuándo

Sí: entidad del esquema, alta/listado/edición/inactivación, sin recálculo de saldos.

No: `registrar-pago`; reglas de estados (`backend-feature`); tabla no documentada (`schema-bd`).

## Entrada

```
Necesito: backend-crud
Modelo: clientes
Campos: docs/00-esquema-bd.md
Roles: propietario y administrador crean/editan
```

## Buenas prácticas

- Archivos: `modulos/clientes/clientes.servicio.ts`, `crear-cliente.dto.ts`.
- Clases: `ClientesModulo`, `ClientesControlador`, `ClientesServicio`, `ClientesRepositorio`.
- `negocio_id` del JWT en cada query. 404 si no está **en este** negocio (no filtrar en memoria después).
- Validar DTO en el borde; reglas de unique en el servicio (409).
- Mensajes de error en español.
- No `any`. No lógica de dinero.

## Implementación

1. Campos vs esquema. Si falta → `schema-bd`.
2. DTO + validación.
3. Repositorio con `negocio_id`.
4. Servicio: unicidad, inactivar (no DELETE).
5. Guards JWT + rol.
6. Swagger + Postman (`/api/clientes`).
7. Encadenar **calidad-tests**: crear/listar/inactivar, 409 unique, 403 otro `negocio_id`.

## Checklist de entrega

- [ ] Nombres en español
- [ ] Swagger + Postman
- [ ] Tests verdes (si no, **no entregado**)
