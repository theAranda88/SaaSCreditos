# SDD Creditos SaaS — índice

Punto de entrada del sistema de desarrollo conducido por especificaciones.

1. Tenés prisa → [QUICK_START.md](./QUICK_START.md)
2. **Plan por fases (MVP)** → [PLAN_IMPLEMENTACION.md](./PLAN_IMPLEMENTACION.md)
3. Elegís flujo → [../workflows/ROUTER.md](../workflows/ROUTER.md) **(siempre)**
4. Contrato HTTP → [DOCUMENTACION.md](./DOCUMENTACION.md)
5. Mapa de carpetas SDD → [STRUCTURE.md](./STRUCTURE.md)
6. Modelo de datos → [`docs/00-esquema-bd.md`](../../docs/00-esquema-bd.md)
7. SRS / Arquitectura → [`docs/01-SRS.md`](../../docs/01-SRS.md) · [`docs/02-Arquitectura-Finanzas.md`](../../docs/02-Arquitectura-Finanzas.md)

## Flujo típico de construcción (después de esta etapa 1)

```
bootstrap-monorepo
  → auth-flow → calidad-tests
  → backend-crud (clientes, usuarios cobrador) → calidad-tests
  → backend-crud (creditos) + generación de cuotas → calidad-tests
  → backend-feature (asignaciones) → calidad-tests
  → registrar-pago → calidad-tests
  → backend-to-frontend / frontend-feature (jornada cobrador) → calidad-tests
```

Cada caja es un chat con `Necesito: ...` y SPEC confirmada.

## Conceptos SDD

- Spec first, una funcionalidad a la vez
- Backend deployable antes que Angular
- Conversacional: sin informes `.md` extra
- Lecciones reales → `../LECCIONES.md`
