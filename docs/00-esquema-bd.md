# Esquema de base de datos — SaaS Gestión de Créditos

**Fuente de verdad** del modelo relacional. Cualquier cambio de tablas, campos, enums, índices o cardinalidad debe actualizar este archivo **antes** de tocar migraciones.

- Motor: PostgreSQL 16+
- Nombres: **español**, `snake_case`. Tablas en plural. PK `id` UUID. Ver `.cursor/rules/15-nomenclatura.mdc`
- Timestamps `TIMESTAMPTZ`, montos `NUMERIC(18,2)`, tasas `NUMERIC(8,4)`
- Multiempresa: toda tabla de negocio lleva `negocio_id` (salvo catálogos globales y roles de plataforma)
- Moneda operativa inicial: COP
- Versión: 1.4 — 24 de septiembre de 2026 (transacción de alta de negocio RF-001 / RA-002; v1.3: reglas financieras MVP)

---

## 1. Diagrama de relaciones

```
negocios (1) ---- (N) usuarios
negocios (1) ---- (N) clientes
negocios (1) ---- (1) suscripciones -- (N):(1) planes
clientes (1) ---- (N) creditos
creditos (1) ---- (N) cuotas
cuotas (1) ------ (N) pagos
creditos (1) ---- (N) asignaciones -- (N):(1) usuarios [rol cobrador]
creditos (N) ---- (1) usuarios [creado_por]
pagos (N) ------- (1) usuarios [cobrador_id]
negocios (1) ---- (N) auditorias
usuarios (1) ---- (N) auditorias

Reservadas V1 (no bloquean el MVP):
pagos (1) ------- (0..1) comprobantes_pago
creditos/clientes (1) -- (N) notas_cobro
```

Cardinalidades operativas:

| Relación | Cardinalidad | Regla |
|---|---|---|
| Negocio → Usuarios de negocio | 1:N | Un usuario de negocio pertenece a un solo negocio. Roles de plataforma (`soporte`, `admin_plataforma`) tienen `negocio_id` nulo. |
| Negocio → Clientes | 1:N | El cliente no es visible fuera de su negocio. |
| Cliente → Créditos | 1:N | Un cliente puede tener varios créditos. |
| Crédito → Cuotas | 1:N | El plan de cuotas se genera al crear el crédito. |
| Cuota → Pagos | 1:N | Un pago se aplica a una cuota. Se permite más de un pago (parciales). |
| Crédito → Asignaciones | 1:N | Histórico de cartera. Solo **una** asignación `activa` por crédito. |
| Negocio → Suscripción | 1:1 | Un negocio tiene una suscripción vigente. |
| Plan → Suscripciones | 1:N | Catálogo comercial global. |
| Entidad crítica → Auditoría | 1:N | Pagos, créditos, asignaciones y acciones administrativas. |

---

## 2. Catálogos (enums)

Los valores exactos de negocio marcados como *por definir* no se inventan en código. Catálogos iniciales:

| Catálogo | Valores | Uso |
|---|---|---|
| `estado_negocio` | `activo`, `suspendido`, `cancelado` | Estado del negocio en la plataforma |
| `rol_usuario` | `propietario`, `administrador`, `cobrador`, `soporte`, `admin_plataforma` | Autorización |
| `estado_usuario` | `activo`, `inactivo` | Acceso a la cuenta |
| `estado_cliente` | `activo`, `inactivo` | Disponibilidad para nuevos créditos |
| `periodicidad_credito` | `diaria`, `semanal`, `quincenal`, `mensual` | Generación de cuotas |
| `estado_credito` | `activo`, `pagado`, `mora`, `anulado`, `refinanciado` | Ciclo de vida del crédito |
| `estado_cuota` | `pendiente`, `pagada`, `parcial`, `mora`, `anulada` | Estado de la cuota |
| `estado_pago` | `valido`, `anulado` | Un pago anulado no altera el saldo vigente |
| `estado_asignacion` | `activa`, `finalizada` | Cartera asignada |
| `estado_plan` | `activo`, `inactivo` | Comercialización del plan |
| `estado_suscripcion` | `activa`, `pago_fallido`, `cancelada`, `suspendida` | Servicio SaaS |
| `tipo_documento` (abierto MVP) | `CC`, `CE`, `NIT`, `PASAPORTE`, `OTRO` | Identificación del cliente |
| `metodo_pago` (abierto MVP) | `efectivo`, `transferencia`, `nequi`, `daviplata`, `otro` | Medio de recaudo |

---

## 3. Entidades y campos

### 3.1 `negocios` — Cliente empresarial del SaaS

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | UUID PK | No | Identificador del negocio |
| `nombre_comercial` | VARCHAR(180) | No | Nombre visible en la UI |
| `razon_social` | VARCHAR(180) | Sí | Por definir con contador |
| `documento_fiscal` | VARCHAR(40) | Sí | NIT u otro; validación legal pendiente |
| `moneda` | CHAR(3) | No | Default `COP` |
| `estado` | `estado_negocio` | No | Default `activo` |
| `configuracion` | JSONB | No | Default `{}`. Parámetros del negocio |
| `fecha_creacion` | TIMESTAMPTZ | No | Default `now()` |
| `fecha_actualizacion` | TIMESTAMPTZ | No | Default `now()` |

Índices: PK `id`; índice por `estado`. Unique parcial de `documento_fiscal` cuando no sea nulo.

### 3.2 `usuarios` — Identidad y roles

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | UUID PK | No | |
| `negocio_id` | UUID FK → negocios.id | Sí | Nulo solo para `soporte` y `admin_plataforma` |
| `nombre` | VARCHAR(160) | No | |
| `correo` | VARCHAR(180) | No | Unique global (login) |
| `hash_contrasena` | VARCHAR(255) | No | Nunca texto plano. Si hay proveedor externo, queda sincronizado |
| `rol` | `rol_usuario` | No | |
| `estado` | `estado_usuario` | No | Default `activo` |
| `telefono` | VARCHAR(30) | Sí | |
| `fecha_creacion` | TIMESTAMPTZ | No | Default `now()` |
| `ultimo_acceso` | TIMESTAMPTZ | Sí | |
| `fecha_actualizacion` | TIMESTAMPTZ | No | Default `now()` |

Restricciones:

- CHECK: si `rol IN ('propietario','administrador','cobrador')` entonces `negocio_id IS NOT NULL`
- CHECK: si `rol IN ('soporte','admin_plataforma')` entonces `negocio_id IS NULL`
- Unique parcial: un solo `propietario` activo por negocio (recomendado)

Índices: `negocio_id`, `rol`, `estado`.

### 3.3 `clientes` — Deudor del negocio

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | UUID PK | No | |
| `negocio_id` | UUID FK → negocios.id | No | ON DELETE RESTRICT |
| `nombre_completo` | VARCHAR(180) | No | |
| `tipo_documento` | VARCHAR(20) | No | Catálogo `tipo_documento` |
| `numero_documento` | VARCHAR(40) | No | |
| `telefono` | VARCHAR(30) | No | Canal operativo del cobrador |
| `direccion` | VARCHAR(220) | No | Calle/número/apartado; obligatorio V2-B |
| `barrio` | VARCHAR(120) | No | Sector/barrio del cliente; nuevo V2-B |
| `referencia_ubicacion` | VARCHAR(220) | Sí | Apoya la ruta diaria |
| `estado` | `estado_cliente` | No | Default `activo` |
| `fecha_creacion` | TIMESTAMPTZ | No | Default `now()` |
| `fecha_actualizacion` | TIMESTAMPTZ | No | Default `now()` |
| `creado_por` | UUID FK → usuarios.id | No | |

Restricciones:

- Unique `(negocio_id, tipo_documento, numero_documento)`
- El cliente **nunca** se consulta sin `negocio_id`

Índices: `negocio_id`, `(negocio_id, nombre_completo)`, `(negocio_id, telefono)`, `creado_por`.

### 3.4 `creditos` — Crédito otorgado

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | UUID PK | No | |
| `negocio_id` | UUID FK → negocios.id | No | Desnormalizado para aislamiento |
| `cliente_id` | UUID FK → clientes.id | No | |
| `monto_principal` | NUMERIC(18,2) | No | CHECK `> 0` |
| `tasa_interes` | NUMERIC(8,4) | No | CHECK `>= 0`. **% sobre el principal de este crédito** (no es un fijo global). Ej.: `20.0000` sobre `100000.00` → interés `20000.00`, total `120000.00`. Validación legal/financiera pendiente de producción |
| `valor_mora` | NUMERIC(18,2) | Sí | **Opcional.** Lo elige el dueño de la cartera (propietario/administrador) al crear el crédito: si no cobra mora → `NULL`; si cobra → COP `> 0`. Se aplica **una vez** a cada cuota que entre en mora. El cobrador no lo define |
| `periodicidad` | `periodicidad_credito` | No | Default operativo: `diaria` |
| `numero_cuotas` | INTEGER | No | CHECK `>= 1`. No existe cuota 0 |
| `fecha_desembolso` | DATE | No | La primera cuota vence al día siguiente (o +1 período si no es diaria) |
| `estado` | `estado_credito` | No | Default `activo` |
| `condiciones_originales` | JSONB | No | Snapshot **inmutable** (RF-005). Ver §7 |
| `fecha_creacion` | TIMESTAMPTZ | No | Default `now()` |
| `fecha_actualizacion` | TIMESTAMPTZ | No | Default `now()` |
| `creado_por` | UUID FK → usuarios.id | No | |

Restricciones:

- CHECK: `cliente_id` pertenece al mismo `negocio_id`
- CHECK: `valor_mora IS NULL OR valor_mora > 0`
- `condiciones_originales` no se actualiza después del insert (trigger recomendado)

Índices: `negocio_id`, `cliente_id`, `estado`, `fecha_desembolso`.

### 3.5 `cuotas` — Cuota del plan de pagos

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | UUID PK | No | |
| `negocio_id` | UUID FK → negocios.id | No | Aislamiento en consultas de cartera/mora |
| `credito_id` | UUID FK → creditos.id | No | ON DELETE RESTRICT |
| `numero_cuota` | INTEGER | No | CHECK `>= 1` |
| `fecha_vencimiento` | DATE | No | |
| `monto_esperado` | NUMERIC(18,2) | No | CHECK `>= 0`. Si la cuota entra en mora **y** el crédito tiene `valor_mora`, se le suma ese valor (una vez) |
| `saldo_pendiente` | NUMERIC(18,2) | No | CHECK `>= 0` y `<= monto_esperado`. Al aplicar mora, si hay `valor_mora`, se incrementa en el mismo monto |
| `estado` | `estado_cuota` | No | Default `pendiente` |

Restricciones: Unique `(credito_id, numero_cuota)`. No hay `numero_cuota = 0`.

Índices: `negocio_id`, `credito_id`, `fecha_vencimiento`, `estado`.

### 3.6 `pagos` — Recaudo aplicado a una cuota

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | UUID PK | No | |
| `negocio_id` | UUID FK → negocios.id | No | |
| `cuota_id` | UUID FK → cuotas.id | No | |
| `credito_id` | UUID FK → creditos.id | No | Redundante a propósito: consultas rápidas de cartera |
| `cobrador_id` | UUID FK → usuarios.id | No | Quién registró el cobro |
| `monto` | NUMERIC(18,2) | No | CHECK `> 0` |
| `fecha_pago` | TIMESTAMPTZ | No | Fecha/hora real del recaudo |
| `metodo_pago` | VARCHAR(40) | No | Catálogo `metodo_pago` |
| `estado` | `estado_pago` | No | Default `valido` |
| `motivo_anulacion` | VARCHAR(240) | Sí | Obligatorio si `estado = anulado` (RF-014) |
| `anulado_por` | UUID FK → usuarios.id | Sí | |
| `fecha_anulacion` | TIMESTAMPTZ | Sí | |
| `fecha_creacion` | TIMESTAMPTZ | No | Default `now()` |

Restricciones:

- CHECK: si `estado = anulado` entonces `motivo_anulacion` y `anulado_por` no nulos
- Un pago `valido` no se edita: se anula y se registra uno nuevo
- `cobrador_id` debe ser usuario del mismo negocio (cobrador o admin/propietario que registre)

Índices: `negocio_id`, `credito_id`, `cuota_id`, `cobrador_id`, `fecha_pago`, `estado`.

### 3.7 `asignaciones` — Relación cartera–cobrador

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | UUID PK | No | |
| `negocio_id` | UUID FK → negocios.id | No | |
| `credito_id` | UUID FK → creditos.id | No | |
| `cobrador_id` | UUID FK → usuarios.id | No | Rol cobrador |
| `fecha_asignacion` | TIMESTAMPTZ | No | Default `now()` |
| `fecha_fin` | TIMESTAMPTZ | Sí | Se llena al reasignar o finalizar |
| `estado` | `estado_asignacion` | No | Default `activa` |
| `asignado_por` | UUID FK → usuarios.id | No | |

Restricciones:

- Unique parcial: **una sola** fila `estado = activa` por `credito_id`
- Reasignar = cerrar la activa e insertar una nueva, misma transacción + auditoría

Índices: `negocio_id`, `credito_id`, `cobrador_id`, `estado`.

### 3.8 `planes` — Catálogo comercial (global)

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | UUID PK | No | |
| `codigo` | VARCHAR(40) | No | Unique. Valores: `emprendedor`, `profesional`, `empresarial` |
| `nombre` | VARCHAR(80) | No | |
| `limite_cobradores` | INTEGER | No | CHECK `>= 1`. 3 / 10 / 15 |
| `precio_implementacion` | NUMERIC(18,2) | No | CHECK `>= 0` |
| `precio_mensual` | NUMERIC(18,2) | No | CHECK `>= 0` |
| `caracteristicas` | JSONB | No | Default `{}` |
| `estado` | `estado_plan` | No | Default `activo` |
| `fecha_creacion` | TIMESTAMPTZ | No | Default `now()` |

Semilla comercial inicial:

| codigo | nombre | limite_cobradores | precio_implementacion | precio_mensual |
|---|---|---|---|---|
| `emprendedor` | Emprendedor | 3 | 1250000.00 | 250000.00 |
| `profesional` | Profesional | 10 | 2500000.00 | 425000.00 |
| `empresarial` | Empresarial | 15 | 3500000.00 | 750000.00 |

### 3.9 `suscripciones` — Estado del servicio por negocio

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | UUID PK | No | |
| `negocio_id` | UUID FK → negocios.id | No | Unique (1:1) |
| `plan_id` | UUID FK → planes.id | No | |
| `estado` | `estado_suscripcion` | No | |
| `fecha_inicio` | DATE | No | |
| `fecha_renovacion` | DATE | No | |
| `fecha_cancelacion` | DATE | Sí | |
| `referencia_pago_externo` | VARCHAR(120) | Sí | ID de pasarela/checkout |
| `fecha_creacion` | TIMESTAMPTZ | No | Default `now()` |
| `fecha_actualizacion` | TIMESTAMPTZ | No | Default `now()` |

Índices: unique `negocio_id`; `plan_id`; `estado`.

### 3.10 `auditorias` — Trazabilidad de operaciones críticas

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | UUID PK | No | |
| `negocio_id` | UUID FK → negocios.id | Sí | Nulo para eventos de plataforma |
| `usuario_id` | UUID FK → usuarios.id | No | |
| `entidad` | VARCHAR(60) | No | Recurso afectado (`creditos`, `pagos`, `asignaciones`, …) |
| `entidad_id` | UUID | No | |
| `accion` | VARCHAR(40) | No | `crear`, `editar`, `anular`, `reasignar`, `suspender`, … |
| `detalle` | JSONB | No | Default `{}` |
| `fecha` | TIMESTAMPTZ | No | Default `now()` |
| `ip_origen` | VARCHAR(45) | Sí | |

Índices: `negocio_id`, `usuario_id`, `(entidad, entidad_id)`, `fecha`.

Tabla **append-only**: no se actualiza ni se borra desde la aplicación.

---

## 4. Entidades reservadas V1

### 4.1 `notas_cobro` — Novedades de cobro (RC-010)

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | UUID PK | No | |
| `negocio_id` | UUID FK → negocios.id | No | |
| `credito_id` | UUID FK → creditos.id | No | |
| `cliente_id` | UUID FK → clientes.id | No | |
| `cobrador_id` | UUID FK → usuarios.id | No | |
| `nota` | TEXT | No | |
| `fecha` | TIMESTAMPTZ | No | Default `now()` |

### 4.2 `comprobantes_pago` — Comprobante digital (RC-011)

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | UUID PK | No | |
| `negocio_id` | UUID FK → negocios.id | No | |
| `pago_id` | UUID FK → pagos.id | No | Unique 1:1 |
| `clave_almacenamiento` | VARCHAR(255) | No | Clave en object storage (nunca el binario en PostgreSQL) |
| `url_archivo` | VARCHAR(500) | Sí | URL firmada o pública según política |
| `fecha_creacion` | TIMESTAMPTZ | No | Default `now()` |

---

## 5. Integridad, transacciones e índices

### 5.1 Aislamiento multiempresa

Toda consulta de negocio **debe** filtrar por `negocio_id` del usuario autenticado. El frontend no es fuente de confianza. `negocio_id` va desnormalizado en `creditos`, `cuotas`, `pagos` y `asignaciones`.

### 5.2 Transacción de alta de negocio (RF-001 / RA-002)

Una sola transacción atómica al registrarse (público) o al crearlo `admin_plataforma`:

1. Insertar `negocios` (`estado = activo`)
2. Insertar `usuarios` con `rol = propietario` (correo único global)
3. Insertar `suscripciones` (`estado = activa`, plan inicial por defecto **Emprendedor**)
4. Si el origen es panel plataforma: insertar `auditorias` (`entidad = negocios`, `accion = crear`, `usuario_id` del admin)

Si el correo ya existe → 409. Si falta el plan inicial en catálogo → 422. Rollback completo ante cualquier fallo.

### 5.3 Transacción de registro de pago (obligatoria)

Una sola transacción atómica:

1. Insertar `pagos` con `estado = valido`
2. Recalcular `cuotas.saldo_pendiente` y `cuotas.estado`
3. Recalcular `creditos.estado` si todas las cuotas quedaron pagadas o si entra en mora
4. Insertar `auditorias` (`entidad = pagos`, `accion = crear`)

Si cualquier paso falla, rollback completo. No se admite estado parcial.

### 5.4 Transacción de anulación de pago

1. Marcar el pago `anulado` con motivo, usuario y fecha
2. Recalcular saldo y estado de la cuota y del crédito
3. Auditar `accion = anular`

No se borra el pago.

### 5.5 Transacción de reasignación

1. Cerrar asignación activa
2. Crear asignación nueva
3. Auditar `accion = reasignar`

### 5.6 Índices iniciales de cartera

- `cuotas (negocio_id, fecha_vencimiento, estado)` — cobros del día y mora
- `pagos (negocio_id, fecha_pago, estado)` — recaudo diario
- `asignaciones (negocio_id, cobrador_id, estado)` — mi cartera
- `clientes (negocio_id, numero_documento)`

### 5.7 Archivos

Comprobantes viven en almacenamiento de objetos. La BD solo guarda `clave_almacenamiento` / `url_archivo`.

---

## 6. Mapeo requerimientos → tablas

| ID | Requerimiento | Tablas |
|---|---|---|
| RF-001 / RC-001 | Registro e inicio de sesión | `usuarios`, `negocios`, `suscripciones` |
| RF-002 | Configuración del negocio | `negocios.configuracion` |
| RF-003 | Gestión de clientes | `clientes` |
| RF-004 | Gestión de cobradores | `usuarios` (rol cobrador) + `planes` / `suscripciones` |
| RF-005 | Gestión de créditos | `creditos` (`condiciones_originales` inmutable) |
| RF-006 | Plan de cuotas | `cuotas` |
| RF-007 | Asignación de cartera | `asignaciones` |
| RF-008 / RC-003 / RC-005 | Cobro diario | `cuotas` + `pagos` |
| RF-009 / RC-007 | Historial de pagos | `pagos` |
| RF-010 / RF-013 | Cartera y mora | `creditos`, `cuotas` |
| RF-011 | Dashboard | lecturas agregadas |
| RF-014 | Auditoría | `auditorias` |
| RF-015 / RA-004 / RA-005 | Suscripción y planes | `planes`, `suscripciones` |
| RC-002 | Mi cartera | `asignaciones` + `creditos` + `clientes` |
| RC-010 | Observaciones | `notas_cobro` (V1) |
| RC-011 | Comprobante | `comprobantes_pago` (V1) |
| RA-002 | Alta / gestión de negocios (plataforma) | `negocios`, `usuarios`, `suscripciones`, `auditorias` |
| RA-001 / RA-003 / RA-007 | Administración SaaS (consulta) | `negocios`, `usuarios`, `suscripciones`, `auditorias` |

---

## 7. Reglas financieras del MVP (cerradas — v1.3)

Fuente para Fase 3 (cuotas) y Fase 5–6 (pago y mora). No se hardcodea la tasa ni el recargo: van en el crédito.

### 7.1 Interés (flat sobre principal, dinámico)

- `tasa_interes` se captura **al crear cada crédito**. No hay tasa global de producto.
- Fórmula: `interes = round(monto_principal × tasa_interes / 100, 2)` (half-up).
- `total_a_pagar = monto_principal + interes`.
- Ejemplo: principal `100000.00`, tasa `20.0000` → interés `20000.00`, total `120000.00`.

### 7.2 Plan de cuotas

- Periodicidad por defecto operativa: `diaria` (el catálogo semanal/quincenal/mensual usa la misma fórmula).
- No hay cuota 0: `numero_cuota` empieza en 1. Primera `fecha_vencimiento` = `fecha_desembolso` + 1 período (diaria: día siguiente).
- Cuotas 1…n−1 con el mismo `monto_esperado`; la última absorbe el residuo para que la suma = `total_a_pagar`.
- Redondeo: half-up a 2 decimales (COP).

### 7.3 Pagos

- Parcial: permitido. `0 < monto < saldo_pendiente` → cuota `parcial`.
- El monto de un pago **no puede superar** `cuotas.saldo_pendiente` (422). Un pago se aplica a **una** cuota.
- Anticipar una cuota futura pendiente: sí (otro `POST` sobre esa cuota).
- Pago válido no se edita: se anula. Anulan `propietario` y `administrador` con motivo obligatorio; el cobrador no anula.

### 7.4 Mora (opcional; la decide el dueño de la cartera)

- Quién: **propietario o administrador** del negocio al crear el crédito. El cobrador no elige mora.
- El dueño **elige si cobra mora**. Si no: `valor_mora = NULL` y las cuotas vencidas solo cambian de estado (sin recargo).
- Si cobra: indica un **valor en COP > 0**, propio de ese crédito (no hay mora global de producto).
- 0 días de gracia: cuota con `fecha_vencimiento < hoy` y `saldo_pendiente > 0` → estado `mora`.
- Recargo solo si `valor_mora` no es nulo, **una sola vez**: `monto_esperado += valor_mora` y `saldo_pendiente += valor_mora`.
- No es recargo diario ni porcentaje en MVP.
- Crédito: alguna cuota en mora → `mora`; todas pagadas → `pagado`.
- Recargo por día / % de mora: V1.

### 7.5 Snapshot `condiciones_originales` (inmutable)

Al insertar el crédito se persiste al menos:

```json
{
  "monto_principal": "100000.00",
  "tasa_interes": "20.0000",
  "cobra_mora": true,
  "valor_mora": "5000.00",
  "periodicidad": "diaria",
  "numero_cuotas": 20,
  "fecha_desembolso": "2026-09-16",
  "formula_interes": "flat_sobre_principal",
  "redondeo": "half_up_2",
  "total_a_pagar": "120000.00",
  "monto_cuota_base": "6000.00"
}
```

Cambiar configuración del negocio no reescribe créditos existentes. Si el dueño no cobra mora: `"cobra_mora": false, "valor_mora": null`.

### 7.6 Aún abiertas (no bloquean Fase 3)

- Refinanciación / reestructuración (el estado `refinanciado` existe; el flujo no)
- Campos adicionales de cliente
- Facturación electrónica colombiana (`documento_fiscal` queda nullable)
- Recargo de mora diario o porcentual (V1)
