# LECCIONES — Creditos SaaS

Reglas destiladas de errores reales. Una lección = una regla accionable.
Si se vuelve ley, súbela a `rules/00-core.mdc` y dejá acá el puntero.

---

## Arranque (2026-09-15)

- El árbol de directorios en PDF no debe usar caracteres de caja (`├──`, `│`): en extractores y en xhtml2pdf se corrompen (`nnn`). Usar indentación ASCII.
- Frontend decidido: **Angular**, no Next/React. El SRS v1.0 no lo fijaba; v1.1 sí.
- Swagger UI + Postman son criterio de *terminado*, no documentación posterior.
- El modelo de datos vive en `docs/00-esquema-bd.md` antes que en migraciones.
- Tablas y código de dominio en **español** (`negocios`, no `tenants`; `ClientesServicio`, no `CustomersService`).
- Crear/modificar siempre encadena `calidad-tests`. Rojo = no entregado.
- `calidad-tests` no se salta con Postman manual: Postman es complemento, no la puerta.
