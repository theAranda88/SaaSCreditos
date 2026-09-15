# Workflow — schema-bd

Cambiar el modelo canónico **antes** de la migración. Nombres en **español**.

## Cargar SOLO

- `docs/00-esquema-bd.md`
- `apps/backend/prisma`
- `rules/15-nomenclatura.mdc`

## Buenas prácticas

- Antes del SPEC: skill `control-versiones` (ej. `feature/creditos_schema_<cambio>` desde `creditos-prepro`).
- Tabla plural `snake_case` español. Prohibido `users`/`tenants`/`payments`.
- PK `id` UUID; FK `entidad_id` (`negocio_id`, `cliente_id`).
- Migración versionada. Nunca `db push` como fuente en equipo.
- Si hay CHECK o unique parcial, test de integración que lo pruebe (encadenar `calidad-tests`).

## Prompt

```
Necesito: schema-bd
Cambio: [campo/tabla/índice/enum en español]
Motivo: [RF/RC/RA]
```

## Prohibido

- Borrar `auditorias` o hacer UPDATE sobre ellas.
- Quitar `negocio_id` de una tabla de negocio.
- Mutar `condiciones_originales` con un UPDATE.
- Inventar columnas en inglés “porque Prisma se ve mejor”.
