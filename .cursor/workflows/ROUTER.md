# ROUTER — empezá SIEMPRE acá

> Vas a construir o corregir el SaaS de créditos. **No leas todo el `.cursor`.**
> Buscá tu caso en la tabla, abrí SOLO ese workflow y cargá SOLO los archivos de esa fila.

## Puerta de versiones (antes de implementar)

Antes del SPEC y del código, **encadená** `control-versiones.md` + skill `control-versiones`.

- Rama base: **`creditos-prepro`**
- Rama de trabajo: `<tipo>/creditos_<descripcion_en_snake_case>` (ej. `feature/creditos_crud_clientes`, `fix/creditos_saldo_cuota`)
- El agente **sugiere** la rama y los comandos; **no** crea ramas ni hace commit salvo petición explícita.

Excepción: solo ejecutar `calidad-tests` sobre un cambio ya hecho, o consultas informativas.

## Puerta de calidad (todas las filas de creación/modificación)

Después del workflow de la tabla, **encadená** `calidad-tests.md`.
**Sin tests en verde la actividad no se entrega.** No es un paso opcional.

## Preguntas para ubicarte

1. ¿Todavía no existe el monorepo dockerizado (Compose + `apps/web` Angular + `apps/api`)?
   → **bootstrap**. No empieces por un CRUD.
2. ¿El problema es **regla/datos/API** o **pantalla Angular**?
   → API/datos = **backend** · pantalla = **front**.
3. ¿Es **nuevo** o **arreglar algo que ya existe**?
4. ¿Toca **dinero** (pago, cuota, saldo, anulación)?
   → `registrar-pago` o `backend-feature`, nunca un CRUD ingenuo.
5. ¿Vas a **cerrar** un cambio ya implementado?
   → `calidad-tests` si aún no está verde.

## Tabla de ruteo — elegí UNA fila

| Lo que querés (en cristiano) | Abrí | Toca SOLO | NO cargues |
|---|---|---|---|
| **Levantar el proyecto** (Compose, Angular, Nest, Postgres, Swagger, Postman, harness de tests) | `bootstrap-monorepo.md` | `apps/*`, `infra/`, `packages/`, `tests/` | reglas de cobro, pantallas de negocio |
| Cambiar **tablas/campos/relaciones** | `schema-bd.md` | `docs/00-esquema-bd.md` + `packages/db` | frontend; nombres en inglés |
| CRUD backend de una entidad (clientes, usuarios…) | `backend-crud.md` + skill `backend-crud` | módulo API + swagger + postman + `*.spec.ts` | frontend; no usar para pagos |
| Lógica de negocio compleja (mora, límites de plan, estados) | `backend-feature.md` + skill `backend-feature` | servicio + transacción + tests | frontend |
| **Registrar / anular cobro** (flujo crítico) | `registrar-pago.md` | `pagos`, `cuotas`, `creditos`, `auditorias` | CRUD genérico, UI primero |
| Auth, JWT, roles, negocio, 2FA | `auth-flow.md` + skill `auth-flow` | auth API + guards Angular | rediseñar el dominio |
| UI CRUD Angular (listado + form) | `frontend-crud.md` + skill `frontend-crud` | `apps/web/.../funcionalidades/<x>` | backend |
| UI compleja (jornada del cobrador, dashboard) | `frontend-feature.md` + skill `frontend-feature` | feature Angular | schema BD |
| Backend listo → **cablear Angular** con permisos por rol | `backend-to-frontend.md` | `apps/web` + `packages/shared-types` | reescribir la API |
| Falta o está viejo **Swagger / Postman** | `documentar-api.md` | swagger + `tests/postman/` | lógica de negocio |
| La **pantalla se ve mal** / rota en móvil | `corregir-front.md` | componente Angular afectado | backend |
| Bug (saldo, 403, no compila, Compose) | `debug-fix.md` | zona del síntoma + test de regresión | todo el repo |
| Mejorar código **sin** cambiar comportamiento | `refactor.md` | área acotada + suite verde | “aprovechar” para features |
| **Cerrar entrega** / tests del cambio / suite en rojo | `calidad-tests.md` + skill `calidad-tests` | specs del módulo tocado | reescribir la feature |

> Si no encaja en ninguna fila, casi seguro son **dos filas seguidas** (ej. CRUD API listo → `calidad-tests` → `frontend-crud`). No improvises un camino nuevo.

## Reglas que valen para TODAS las filas (no las repitas)

- Carril **rama sugerida → SPEC → OK → código → tests verdes**: `rules/00-core.mdc` + `control-versiones`.
- **Nada sensible** en el código: `00-core` ley 7.
- Endpoint nuevo → **Swagger + Postman + tests**: `docs/DOCUMENTACION.md` + `calidad-tests`.
- Consultas de negocio → **`negocio_id`**.
- Identificadores de dominio en **español**: `rules/15-nomenclatura.mdc`.
- Frontend es **Angular**. Entorno es **Docker Compose**.

## Para qué sirve cada especialista

- `control-versiones.md` — sugerencia de rama Git (`creditos-prepro` → `tipo/creditos_*`) antes de codificar.
- `bootstrap-monorepo.md` — esqueleto dockerizado + runner de tests.
- `schema-bd.md` — modelo canónico (tablas en español).
- `backend-crud` / `frontend-crud` — alta, listado, edición, inactivación.
- `backend-feature` / `frontend-feature` — flujos con estados y reglas.
- `registrar-pago.md` — corazón del producto (RF-008 / RC-005).
- `auth-flow.md` — identidad y aislamiento.
- `documentar-api.md` — contrato HTTP vivo.
- `calidad-tests.md` — puerta de entrega.
- `debug-fix.md` / `refactor.md` / `corregir-front.md` — arreglo quirúrgico.

## Contexto vivo (no lo cargues entero)

- Plan por fases (MVP): `.cursor/docs/PLAN_IMPLEMENTACION.md`
- SRS: `docs/01-SRS.md`
- Arquitectura: `docs/02-Arquitectura-Finanzas.md`
- Esquema BD: `docs/00-esquema-bd.md`
- Lecciones: `.cursor/LECCIONES.md`
