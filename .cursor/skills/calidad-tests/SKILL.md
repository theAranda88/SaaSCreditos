---
name: calidad-tests
description: Escribe y ejecuta tests de calidad del cambio en curso. Sin verde no se entrega. Encadenar después de crear o modificar backend, frontend, auth, pagos o bugfix.
---

# Skill: Calidad y tests (puerta de entrega)

## Principio

Código + Swagger/Postman **no bastan**. El desarrollo terminado es ese conjunto **más** una batería de pruebas que pasa en verde.

## Cuándo

- Al cerrar `backend-crud`, `backend-feature`, `registrar-pago`, `auth-flow`, `frontend-*`, `bootstrap-monorepo`, `debug-fix`, `refactor`, `schema-bd` (si hay migración con lógica).
- Cuando el usuario pide “terminar”, “entregar” o “listo” y aún no hay verde.

## Herramientas (estándar del monorepo)

| Capa | Runner | Dónde |
|---|---|---|
| API unitaria | Vitest | `*.servicio.spec.ts`, `*.repositorio.spec.ts` junto al código |
| API HTTP | Vitest + supertest | `apps/api/test/*.e2e-spec.ts` |
| Angular | runner del proyecto (Vitest o `ng test`) | `*.spec.ts` del componente/servicio |
| Contrato | Postman/Newman | `tests/postman/` — humo del módulo, no reemplaza unitarias |
| Orquestación | script raíz | `npm test` (api + web). Rojo global = no entrega |

Base de datos de test: PostgreSQL del Compose (perfil `test` o schema aislado). **Prohibido** apuntar tests a datos reales.

## Pirámide (no invertida)

1. **Unitarias de servicio** — reglas, 422, cálculos, transacción mockeada o con BD de test.
2. **HTTP** — un feliz y los de seguridad (401, 403 negocio ajeno).
3. **UI** — formulario/guard/flujo corto, no capturas de todo el CSS.
4. **Postman** — humo manual/CI; no es la única red.

No hace falta 100% de líneas. Sí hace falta cubrir **el comportamiento nuevo** y los **casos P0** (dinero, `negocio_id`, rol).

## Mínimos por workflow de origen

| Origen | Tests obligatorios |
|---|---|
| `backend-crud` | crear/listar/inactivar; unique (409); 403 de otro `negocio_id`; 404 en este negocio |
| `backend-feature` | regla nueva (positivo + 422); no regresiona la regla vieja documentada |
| `registrar-pago` | transacción feliz; rollback si falla un paso; 403 cartera no asignada; 403 otro negocio; anulación con motivo; saldo nunca negativo; doble submit |
| `auth-flow` | login ok; 401; 403 rol; claim `negocio_id`; plataforma sin `negocio_id` |
| `frontend-crud` | crea el form inválido no emite POST; listado muestra vacío; servicio llama la URL correcta |
| `frontend-feature` | confirmación de cobro (RC-006) antes del POST; guard redirige sin sesión |
| `debug-fix` | test de regresión que fallaba con el bug |
| `refactor` | suite previa verde; mismos asserts de negocio |
| `bootstrap-monorepo` | `GET /salud` o `/health` de arranque + `npm test` corre (aunque sea un spec placeholder) y la pipeline queda cableada |

## Cómo escribir un test (buenas prácticas)

```ts
describe('PagosServicio', () => {
  it('debe registrar el pago y dejar saldo cero en una transacción', async () => {
    // Arrange — datos sintéticos en español
    // Act — pagosServicio.registrarPago(...)
    // Assert — cuota.estado === 'pagada' y existe fila en auditorias
  });

  it('debe rechazar cobro de cartera no asignada con 403', async () => { /* ... */ });
});
```

- Un comportamiento por `it`. Nombre que falle en el reporte y se entienda.
- No dormir (`setTimeout`) para esperar la BD.
- No usar `any`. Fixtures en español (`clienteActivo`, `cuotaPendiente`).
- No asserts débiles (`toBeTruthy()` del body entero). Comparar campos de negocio.
- Tests deterministas: fechas fijas, montos `NUMERIC` como string o decimal, no `float`.

## Comandos (ajustar a los scripts reales del repo)

```bash
# API
npm test --workspace=apps/api

# Angular
npm test --workspace=apps/web -- --watch=false

# Raíz (entrega)
npm test
```

Si el repo aún no tiene `npm test` (solo bootstrap), **crearlo** forma parte de este skill.

## Proceso SDD

1. SPEC de tests (lista de `debe ...`) alineada al cambio. Si el origen no definió casos límite, preguntar **una** vez.
2. Implementar specs.
3. Ejecutar. Pegar resumen: N pass / N fail.
4. Fail → arreglar código o test (no skip, no `.only` en main, no comentar el assert).
5. Pass → declarar **entrega**.

## Qué no hacer

- Subir o dar por cerrado con fail.
- Medir calidad solo con Postman manual.
- Tests que hablan con producción.
- Duplicar la implementación en el test (copiar el algoritmo en vez de observar estado).
