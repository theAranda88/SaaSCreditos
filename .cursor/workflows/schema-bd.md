# Workflow — schema-bd

Cambiar el modelo canónico **antes** de la migración. Nombres en **español**.

## Cargar SOLO

- `docs/00-esquema-bd.md`
- `packages/db`
- `rules/15-nomenclatura.mdc`

## Buenas prácticas

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
