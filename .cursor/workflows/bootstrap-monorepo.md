# Workflow — bootstrap-monorepo

Usar cuando **aún no existe** el esqueleto dockerizado. Es la etapa 2 de construcción, no un CRUD.

## Cargar SOLO

- `docs/02-Arquitectura-Finanzas.md` §3 y §4
- `docs/00-esquema-bd.md` (Prisma inicial, sin dominio de cobro)
- `rules/15-nomenclatura.mdc`
- este archivo

## Buenas prácticas

- Un `docker compose` levanta web + api + workers + postgres + (opcional) runner de test.
- Scripts raíz: `npm test` (falla si api o web fallan).
- Prisma con `@@map` a tablas en español (`negocios`, `planes`).
- Health en español de dominio: `GET /api/salud` (además del probe de orquestador si hace falta).
- Seed solo `planes`. Sin créditos de mentira en producción.

## Prompt

```
Necesito: bootstrap-monorepo
```

## Definition of done

- [ ] Compose levanta los servicios
- [ ] Angular responde; Swagger UI abre
- [ ] Postman `local` con `{{url_base}}`
- [ ] Vitest/`ng test` cableados; `npm test` corre
- [ ] Encadenar `calidad-tests` (harness verde, aunque sea spec de `/api/salud`)
- [ ] Sin lógica de créditos/pagos todavía
