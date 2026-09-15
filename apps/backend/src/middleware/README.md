# Middleware del backend

Capa transversal de NestJS: guards, interceptors, pipes y filters.

| Pieza NestJS | Uso en Creditos SaaS | Ubicación futura |
|---|---|---|
| Guard | JWT, `negocio_id`, rol | `middleware/guards/` |
| Interceptor | Logging, transformación | `middleware/interceptors/` |
| Pipe | Validación DTO (class-validator) | `middleware/pipes/` |
| Filter | Errores HTTP en español | `middleware/filters/` |

Flujo HTTP objetivo (Fase 1+):

```
routes → middleware (guards/pipes) → controlador → servicio → entidades (repositorio) → Prisma
```
