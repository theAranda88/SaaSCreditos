# Creditos SaaS

Plataforma web multiempresa para gestión de créditos y cobro diario.

## Base de requerimientos (etapa 1)

| Documento | PDF |
|---|---|
| SRS v1.2 | [SaaS_Gestion_Creditos_SRS_v1.2.pdf](docs/pdf/SaaS_Gestion_Creditos_SRS_v1.2.pdf) |
| Arquitectura y finanzas v1.2 | [SaaS_Gestion_Creditos_Arquitectura_Finanzas_v1.2.pdf](docs/pdf/SaaS_Gestion_Creditos_Arquitectura_Finanzas_v1.2.pdf) |

El esquema de base de datos (tablas, campos, relaciones e índices en español) está formalizado en esos documentos y es la fuente de verdad para el desarrollo.

## Cómo se desarrolla (SDD)

Empezá por el ROUTER en `.cursor/workflows/` y pedí `Necesito: [skill]`. Tras crear o modificar, el flujo `calidad-tests` es obligatorio: **sin verde no se entrega**.

Nombres de tablas y de código de dominio en **español**.

## Stack acordado

Angular + NestJS + PostgreSQL en monorepo dockerizado. Siguiente etapa: `Necesito: bootstrap-monorepo`.
