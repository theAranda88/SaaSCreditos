---
name: registrar-pago
description: Registro y anulación de cobros en transacción atómica (pagos, cuotas, creditos, auditorias). Tests P0 obligatorios. RF-008 / RC-005.
---

# Skill: Registrar pago / anular pago

## Invariantes (P0)

1. Un `prisma.$transaction`: insertar/anular `pagos` → saldo/estado `cuotas` → estado `creditos` → `auditorias`.
2. Cobrador: `asignaciones` activa con su `cobrador_id`.
3. `negocio_id` coherente en pago, cuota y crédito.
4. Pago `valido` no se UPDATE de monto. Anular + `motivo_anulacion` + `anulado_por`.
5. `monto > 0`. `saldo_pendiente` nunca negativo.

## Nombres

`PagosServicio.registrarPago` / `anularPago`. Endpoints `/api/pagos`, `/api/pagos/:id/anular`.

## SPEC

Si monto > saldo y la política no está cerrada: **preguntar**. No inventar excedente.

## Implementación

1. Autorizar cartera.
2. Releer la cuota dentro de la transacción (evitar doble cobro).
3. Recalcular `estado` de cuota: `pagada` | `parcial` | `pendiente`.
4. Si todas pagadas → `creditos.estado = pagado`.
5. Swagger + Postman.
6. **calidad-tests** (sin verde no hay entrega): feliz; rollback; 403 cartera ajena; 403 otro negocio; anulación; doble submit; saldo no negativo.

No construye Angular. Encadenar `frontend-feature` para la jornada.
