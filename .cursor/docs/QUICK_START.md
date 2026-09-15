# QUICK START — SDD Creditos SaaS

Monorepo dockerizado: **Angular** (`apps/web`) + **NestJS** (`apps/api`) + PostgreSQL. Cobros diarios multiempresa.

## Paso 1 — ROUTER

Abrí `.cursor/workflows/ROUTER.md` y elegí UNA fila. Al crear o modificar, **después** encadená `calidad-tests`. Sin verde no se entrega.

| Skill | Para qué |
|---|---|
| `bootstrap-monorepo` | Aún no hay Compose/Angular/API |
| `schema-bd` | Tablas/campos (español) |
| `backend-crud` | CRUD API simple |
| `backend-feature` | Reglas (mora, planes, estados) |
| `registrar-pago` | Cobro / anulación |
| `auth-flow` | Login, JWT, negocio |
| `frontend-crud` | Listado+form Angular |
| `frontend-feature` | Jornada cobrador, dashboard |
| `backend-to-frontend` | API lista → UI por rol |
| `documentar-api` | Swagger + Postman |
| `calidad-tests` | Puerta de entrega |
| `debug-fix` / `corregir-front` / `refactor` | Arreglos |

## Paso 2 — Chat

```
Necesito: registrar-pago
Operación: registrar
Actor: cobrador
```

## Leyes relámpago

- `negocio_id` en cada query de negocio
- Tablas y código de dominio en **español** (`negocios`, `ClientesServicio`)
- Pago = transacción + auditoría
- Angular, no React; Docker Compose desde el día uno
- Swagger + Postman + **tests verdes** o el módulo no está terminado
- Fuente BD: `docs/00-esquema-bd.md`
