---
name: backend-feature
description: Cambia reglas de negocio en backend existente (estados, mora, límites de plan, transacciones). Tests de la regla obligatorios.
---

# Skill: Backend Feature

## Cuándo

Cambiar una regla sobre tablas que ya existen (límite de cobradores, pasar crédito a mora, suspender negocio).

## Buenas prácticas

- Un servicio, una transacción si hay varios writes.
- 422 con mensaje de negocio en español.
- No mutar `creditos.condiciones_originales`.
- Nombres: `CreditosServicio.marcarEnMora`, no `markOverdue`.

## Implementación

1. Si cambia BD → `schema-bd`.
2. Lógica en servicio.
3. Swagger describe la **regla**, no solo el verbo.
4. **calidad-tests**: positivo + 422 + no regresiona la regla anterior.

## Prohibido

Recalcular cuotas históricas. Skip de tests “porque es una regla rara”.
