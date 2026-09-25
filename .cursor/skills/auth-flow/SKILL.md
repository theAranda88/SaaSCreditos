---
name: auth-flow
description: Login, JWT, roles, negocio_id, recuperación de acceso. Tests de 401/403 cruzado. Cruza NestJS y guards Angular.
---

# Skill: Auth Flow

## Buenas prácticas

- Token: `sub`, `rol`, `negocio_id` (null en plataforma).
- `AuthServicio`, `guardAutenticacion`, `guardRol`.
- Rate limit login. No loguear `hash_contrasena` ni tokens.
- Rutas `/admin-plataforma` separadas de `/app`.
- Pantallas de login/recuperación: skill `frontend-arquitectura` (i18n + tokens); sin mensajes en duro.
- **calidad-tests**: login ok; 401; 403 rol; cobrador no entra a admin; negocio A no lee negocio B.

No meter lógica de créditos aquí.
