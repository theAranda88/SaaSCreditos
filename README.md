# Creditos SaaS

Plataforma web multiempresa para gestión de créditos y cobro diario.

## Base de requerimientos (etapa 1)

| Documento | Markdown | PDF |
|---|---|---|
| SRS v1.1 | [docs/01-SRS.md](docs/01-SRS.md) | [docs/pdf/SaaS_Gestion_Creditos_SRS_v1.1.pdf](docs/pdf/SaaS_Gestion_Creditos_SRS_v1.1.pdf) |
| Arquitectura y finanzas v1.1 | [docs/02-Arquitectura-Finanzas.md](docs/02-Arquitectura-Finanzas.md) | [docs/pdf/SaaS_Gestion_Creditos_Arquitectura_Finanzas_v1.1.pdf](docs/pdf/SaaS_Gestion_Creditos_Arquitectura_Finanzas_v1.1.pdf) |
| Esquema BD (fuente de verdad) | [docs/00-esquema-bd.md](docs/00-esquema-bd.md) | — |

Regenerar PDF: `python scripts/generar_pdfs.py`

## Cómo se desarrolla (SDD)

Abrí [.cursor/workflows/ROUTER.md](.cursor/workflows/ROUTER.md) y pedí en el chat `Necesito: [skill]`. Guía: [AGENTS.md](AGENTS.md), [QUICK_START](.cursor/docs/QUICK_START.md).

## Stack acordado

Angular + NestJS + PostgreSQL en monorepo dockerizado. Siguiente etapa: `Necesito: bootstrap-monorepo`.
