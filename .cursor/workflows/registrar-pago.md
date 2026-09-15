# Workflow — registrar-pago

Flujo crítico (RF-008, RC-005, RC-006, RF-014).

## Cargar SOLO

- `.cursor/skills/registrar-pago/SKILL.md`
- `docs/00-esquema-bd.md` § `cuotas`, `pagos`, §5 transacciones

## Buenas prácticas / invariantes

1. Una transacción: `pagos` + saldo/estado `cuotas` + estado `creditos` + `auditorias`.
2. Cobrador solo si `asignaciones.estado = activa` y `cobrador_id` propio.
3. Pago `valido` inmutable; anulación con motivo.
4. Nombres: `PagosServicio.registrarPago` / `anularPago`.
5. **calidad-tests** con los casos P0 del skill. Rojo = no entregado.

## Prompt

```
Necesito: registrar-pago
Operación: [registrar | anular]
Actor: [cobrador | administrador]
```
