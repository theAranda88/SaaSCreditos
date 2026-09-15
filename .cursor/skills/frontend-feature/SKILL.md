---
name: frontend-feature
description: UI Angular compleja (jornada del cobrador, dashboard) con tests del flujo. No recalcular cartera en el cliente.
---

# Skill: Frontend Feature (Angular)

## Buenas prácticas

- Un paso UI = un endpoint. Loading / vacío / error de red / 403.
- Cobrador: botones grandes, RC-006 confirmación antes de `registrarPago`.
- Totales del día (RC-009) vienen del API.
- Nombres: `JornadaCobroComponent`, `CobrosServicio`.

## Implementación

1. Mapear pasos a OpenAPI.
2. Si falta endpoint → parar y rutar a backend.
3. **calidad-tests**: confirmación dispara un solo POST; guard sin sesión redirige.
