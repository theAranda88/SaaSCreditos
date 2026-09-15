# AGENTS.md — Creditos SaaS

Sistema SDD (spec-driven) para el SaaS de gestión de créditos y cobro diario.

## Empieza aquí

1. Leé `.cursor/workflows/ROUTER.md`
2. Elegí UNA fila
3. Seguí ese workflow (carga solo esos archivos)
4. SPEC en el chat → OK del usuario → código → **`calidad-tests` en verde**

No leas todo `.cursor/`. **Sin tests verdes la actividad no se entrega.**

## Producto

- SRS: `docs/01-SRS.md`
- Arquitectura: `docs/02-Arquitectura-Finanzas.md`
- Esquema BD (español, fuente de verdad): `docs/00-esquema-bd.md`
- PDF: `docs/pdf/`

## Stack

Monorepo dockerizado: Angular + NestJS + PostgreSQL. Swagger UI + Postman + tests automatizados.

## Leyes cortas

Multiempresa (`negocio_id`), dinero en transacción, condiciones de crédito inmutables, nombres en español, nada de secretos, backend verde antes que front, commits solo si el usuario los pide.
