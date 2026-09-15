# Workflow — auth-flow

Login, JWT, roles, `negocio_id`, recuperación de acceso.

## Cargar SOLO

- `.cursor/skills/auth-flow/SKILL.md`
- módulo auth + `nucleo/auth` Angular si cruza
- esquema § `usuarios` / `negocios`

## Buenas prácticas

- Claims: `sub` (estándar JWT), `negocio_id` (nullable), `rol`.
- Panel plataforma ≠ panel negocio.
- Rate limit en login. Contraseña nunca en logs.
- Tests: login ok, 401, 403 cruzado. Encadenar `calidad-tests`.

## Prompt

```
Necesito: auth-flow
Cambio: [login | refresh | roles | recuperar | 2FA]
¿Cambia claims?: [sí/no]
```
