# Backend — Creditos SaaS

API NestJS con capas inspiradas en el patrón de `unilab` (Express), adaptadas al ecosistema NestJS.

## Estructura

```
apps/backend/
├── prisma/                 # Esquema, migraciones y semilla (réplica de docs/00-esquema-bd.md)
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── bd/                 # Cliente Prisma (conexión PostgreSQL)
│   ├── entidades/          # Repositorios delgados (acceso a datos)
│   ├── servicios/          # Reglas de negocio
│   ├── controladores/      # HTTP / OpenAPI
│   ├── middleware/         # Guards, pipes, interceptors, filters
│   ├── routes/             # Módulos Nest que cablean rutas por dominio
│   ├── app.module.ts
│   └── main.ts
├── test/                   # E2E HTTP (supertest)
├── Dockerfile
└── Dockerfile.db-init      # migrate deploy + seed en Docker
```

## Flujo por capa

```
HTTP → routes → middleware → controlador → servicio → entidades (repositorio) → bd (Prisma) → PostgreSQL
```

| Capa | Responsabilidad | Ejemplo |
|---|---|---|
| `routes/` | Agrupa controlador + servicio + repos del dominio | `salud.routes.ts` |
| `middleware/` | Auth JWT, roles, validación, errores | Fase 1+ |
| `controladores/` | Entrada/salida HTTP, Swagger | `salud.controlador.ts` |
| `servicios/` | Reglas, transacciones, orquestación | `salud.servicio.ts` |
| `entidades/` | Consultas Prisma por tabla/agregado | `plan.repositorio.ts` |
| `bd/` | Singleton/injectable Prisma | `prisma.servicio.ts` |
| `prisma/` | Modelo relacional versionado | `schema.prisma` |

## Comandos Prisma (desde la raíz del monorepo)

```bash
npm run db:generate
npm run db:migrate
npm run db:migrate:deploy
npm run db:seed
npm run db:docker:init
```

## Convenciones

- Archivos en kebab + sufijo de rol: `plan.repositorio.ts`, `salud.servicio.ts`
- Clases en PascalCase español: `PlanRepositorio`, `SaludServicio`
- Prefijo HTTP global: `/api`
