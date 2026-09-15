# Creditos SaaS

Plataforma web multiempresa para gestión de créditos y cobro diario.

## Requisitos

- Node.js 20+
- Docker y Docker Compose
- npm 10+

## Arranque rápido (Fase 0)

```bash
# 1. Dependencias (tests y Prisma en el host)
npm install

# 2. Variables de entorno
cp .env.example .env

# 3. Levantar stack completo (migraciones + semilla automáticas)
docker compose up --build
```

Al iniciar, el servicio `db-init` aplica las migraciones Prisma y ejecuta la semilla de `planes` **dentro de Docker**, antes de levantar el backend.

```bash
# 4. Tests (en el host)
npm test
```

## Base de datos en Docker

### Volumen persistente

PostgreSQL guarda los datos en el volumen nombrado `creditos_postgres_data`. Los datos **persisten** entre reinicios (`docker compose down` / `up`) y rebuilds de imágenes.

Solo se borran si ejecutás explícitamente:

```bash
docker compose down -v
```

### Inicialización automática

Orden al hacer `docker compose up`:

1. `postgres` — arranca y pasa healthcheck
2. `db-init` — ejecuta `prisma migrate deploy` + semilla de planes
3. `backend` — arranca cuando `db-init` terminó OK
4. `front` — arranca cuando el backend responde en `/api/salud`

### Comandos manuales (dentro de Docker)

Re-aplicar migraciones y semilla (por ejemplo, tras pull con migraciones nuevas):

```bash
npm run db:docker:init
# equivalente:
docker compose run --rm db-init
```

Consultar datos en PostgreSQL:

```bash
npm run db:docker:psql
# dentro de psql:
# \dt
# SELECT codigo, nombre FROM planes;
```

Ver logs del init:

```bash
docker compose logs db-init
```

### Desarrollo Prisma en el host (opcional)

Si creás migraciones nuevas desde tu máquina (fuera del contenedor), usá `DATABASE_URL` apuntando a `localhost` (ver `.env.example`):

```bash
npm run db:migrate        # migrate dev (crea migración)
npm run db:migrate:deploy # solo aplica migraciones existentes
npm run db:seed           # semilla desde el host
```

## URLs locales

| Servicio | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend salud | http://localhost:3000/api/salud |
| Swagger UI | http://localhost:3000/api/docs |
| PostgreSQL | localhost:5432 |

## Estructura

```
apps/front       Angular (shell mínimo)
apps/backend     NestJS (capas: bd → entidades → servicios → controladores → routes)
  prisma/        Esquema, migraciones y semilla
packages/shared-types
docker/          scripts de inicialización BD
docker-compose.yml
tests/postman/   Colección local
```

## Variables de entorno

| Variable | Descripción | Default local |
|---|---|---|
| `POSTGRES_USER` | Usuario PostgreSQL | `creditos` |
| `POSTGRES_PASSWORD` | Contraseña PostgreSQL | `creditos_dev` |
| `POSTGRES_DB` | Base de datos | `creditos` |
| `POSTGRES_PORT` | Puerto expuesto de PostgreSQL | `5432` |
| `API_PORT` | Puerto del backend | `3000` |
| `FRONT_PORT` | Puerto del frontend | `4200` |
| `DATABASE_URL` | Prisma en el **host** (`localhost`) | ver `.env.example` |
| `JWT_SECRETO` | Secreto JWT (Fase 1+) | placeholder dev |

Dentro de Docker Compose, `DATABASE_URL` se sobrescribe para usar el hostname `postgres`.

Plantilla versionada: `.env.example`. Copiar a `.env` antes de `docker compose up`.

## Documentación de producto

| Documento | PDF |
|---|---|
| SRS v1.2 | [SaaS_Gestion_Creditos_SRS_v1.2.pdf](docs/pdf/SaaS_Gestion_Creditos_SRS_v1.2.pdf) |
| Arquitectura y finanzas v1.2 | [SaaS_Gestion_Creditos_Arquitectura_Finanzas_v1.2.pdf](docs/pdf/SaaS_Gestion_Creditos_Arquitectura_Finanzas_v1.2.pdf) |

Esquema BD: `docs/00-esquema-bd.md`

## Desarrollo (SDD)

Empezá por `.cursor/workflows/ROUTER.md`. Tras cada cambio: `calidad-tests` en verde.

## Stack

Angular + NestJS + PostgreSQL + Docker Compose en la raíz del monorepo. Dominio en español.
