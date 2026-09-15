# Workflow — backend-feature

Reglas de negocio sobre tablas **existentes**.

## Cargar SOLO

- `.cursor/skills/backend-feature/SKILL.md`
- servicio del módulo
- SRS (RF/RC) + esquema

## Buenas prácticas

- La regla vive en el **servicio**, no en el controlador ni en el front.
- Más de un write → transacción.
- 422 para regla de negocio; 409 para conflicto de unique.
- Tests: positivo + 422 principal. Encadenar `calidad-tests`.

## Prompt

```
Necesito: backend-feature
Módulo: [creditos|cartera|suscripciones]
Regla anterior / nueva
¿Cambia BD?: [sí → schema-bd primero]
```
