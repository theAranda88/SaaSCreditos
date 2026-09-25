---
name: backend-to-frontend
description: Pantallas Angular a partir de un módulo backend verde — capas, i18n, tokens, UI por rol (propietario, administrador, cobrador, plataforma).
---

# Skill: Backend → Frontend

## Cuándo

Swagger al día y tests API verdes. Falta cablear o completar Angular para un módulo existente.

## Antes de codificar

1. **`frontend-arquitectura`** + `reference.md`.
2. Leer guards/`requireRole` del backend; listar acciones por rol.

## Enfoque

- Por cada **acción** del API: ruta lazy, contenedor, servicio, claves i18n, token SCSS si hay UI nueva.
- Tipos desde OpenAPI / `shared-types` (`Credito`, no `Credit`).
- Menús y botones según rol; acción prohibida = sin control **y** 403 si llaman igual.

## Entregables por módulo

| Pieza | Ubicación |
|---|---|
| HTTP | `funcionalidades/<m>/...servicio.ts` |
| Pantallas | `contenedores/` + `presentacion/` |
| Textos | `public/i18n/es.json` |
| Estilos | tokens + scss local mínimo |
| Rutas | `app.routes.ts` + guards |

## Buenas prácticas

- No inventar endpoints ni campos en el front.
- Errores y vacíos: i18n; mapeo de códigos HTTP en `nucleo/http/`.
- Cobrador no ve configuración de negocio; plataforma en rutas `/admin-plataforma` separadas de `/app`.
- Encadenar `calidad-tests` de cada feature cableada.

## calidad-tests

- Al menos un test por rol crítico (p. ej. cobrador no monta ruta de admin).
- Servicio del módulo: URL y método HTTP correctos.
- Componente principal del módulo: estado vacío o 403 con stub de traducción.
