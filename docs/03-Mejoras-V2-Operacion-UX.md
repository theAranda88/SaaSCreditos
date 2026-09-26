# MEJORAS V2 — OPERACIÓN, COBRO Y EXPERIENCIA DE USO

**Documento de planificación SDD (Spec-Driven Development)**

Versión **1.0** — Mejoras puntuales post-MVP operativo

Preparado para: producto, desarrollo y pruebas en monorepo Creditos SaaS

Fecha: **24 de septiembre de 2026**

**DOCUMENTO DE TRABAJO.** Define alcance V2 operacional/UX derivado de prueba de campo (propietario, cobrador, plataforma). Cada etapa se implementa con `.cursor/workflows/ROUTER.md` → workflow indicado → SPEC en chat → OK → código → `calidad-tests` en verde. Rama base: `creditos-prepro`.

Relacionado: `docs/01-SRS.md` (MVP), `.cursor/docs/PLAN_IMPLEMENTACION.md` (fases 0–7), `docs/00-esquema-bd.md` (modelo).

---



## Tabla de contenido

1. Resumen ejecutivo
2. Principios y fuera de alcance
3. Checklist maestro V2
4. Catálogo de requerimientos (RV2-001 …)
5. Etapas de implementación (ramas, ROUTER, entregables)
6. Cambios de datos propuestos
7. Reglas de negocio nuevas o aclaradas
8. Criterios de aceptación por etapa
9. Cómo coordinar con el ROUTER
10. Trazabilidad pantalla → requerimiento

---



## 1. Resumen ejecutivo

Tras cerrar el MVP (flujo cliente → crédito → asignación → cobro → cartera), la **V2 operacional** corrige fricción de uso real: formularios más estrictos, cálculo de cuotas por **plazo en meses**, cartera sin créditos ya asignados, cobro móvil más claro (datos del cliente, historial del préstamo, métodos de pago acotados), **pagos mayores al saldo de una cuota** como abono que acelera el plan, **cierre de jornada del cobrador** y **cierre diario del dueño**, y **UI más compacta** con **Inicio = dashboard gráfico** (una pestaña menos).

No sustituye la V1 del SRS (reportes avanzados, notificaciones masivas, observabilidad). Se ejecuta **por etapas independientes** en ramas `feature/creditos_v2_`*.

---



## 2. Principios y fuera de alcance


| Incluido V2 operación                                       | Fuera de esta ola (SRS V1/V2 comercial)                  |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| UX cobrador y propietario en pantallas existentes           | Pasarela de pagos SaaS, conciliación bancaria automática |
| Comprobante foto en transferencia (MVP almacenamiento stub) | Facturación electrónica DIAN                             |
| Cierre jornada / cierre diario operativo                    | Geolocalización en ruta                                  |
| Barrio en cliente + listados enriquecidos                   | Reportes exportables RF-012                              |
| Plazo en meses + cuotas auto (domingo excluido en diaria)   | Recargo de mora diario porcentual                        |


**Ley del proyecto:** multiempresa (`negocio_id`), dinero en transacción, tests verdes antes de entrega.

---



## 3. Checklist maestro V2

Marcar al cerrar cada etapa (§5). Orden recomendado: **V2-A → V2-B → … → V2-G**.

### Plataforma y propietario — datos maestros

- [ ] **RV2-001** Alta negocio: moneda = lista (catálogo), no texto libre  
- [ ] **RV2-002** Cliente: `direccion` obligatoria en API y formulario  
- [ ] **RV2-003** Cliente: campo `barrio` (nuevo) obligatorio u opcional según SPEC de etapa V2-B  



### Créditos

- [ ] **RV2-004** Crear crédito: plazo en **meses** (1…n) en lugar de “número de cuotas” manual  
- [ ] **RV2-005** Cálculo automático de `numero_cuotas` según periodicidad + meses + regla domingos (diaria)  
- [ ] **RV2-006** Listado créditos: dirección, barrio del cliente, indicador cobrador asignado (sí/no + nombre)  
- [ ] **RV2-007** Filtros/listado créditos: controles de tamaño moderado (no botón Buscar a ancho completo)  



### Asignación de cartera

- [ ] **RV2-008** Selector de crédito: **solo** créditos activos/en mora **sin asignación activa** (no listar ya asignados)  
- [ ] **RV2-009** No depender de confirmación “ya lo tiene X” para créditos que no deberían aparecer (img. validación previa)  



### Cobrador — jornada de cobro

- [ ] **RV2-010** Botones y copy: **“Registrar pago”** (no “Revisar cobro”) en lista y ficha  
- [ ] **RV2-011** Tarjeta de cobro del día: mostrar **periodicidad** del crédito (diaria, semanal, …)  
- [ ] **RV2-012** Ficha de cobro: monto del préstamo, nombre, **dirección**, **teléfono** visibles y ordenados  
- [ ] **RV2-013** Historial de pagos del **crédito completo** bajo inputs monto/método (no solo “reciente” arriba)  
- [ ] **RV2-014** Método de pago: solo **efectivo** y **transferencia**  
- [ ] **RV2-015** Si transferencia: **carga de foto** comprobante (obligatoria antes de confirmar)  
- [ ] **RV2-016** Pago **mayor** al saldo de la cuota actual: permitido; mismo interés total; aplica excedente a cuotas siguientes (abono) — API + UI  



### Cierres operativos

- [ ] **RV2-017** Cobrador: acción **Cerrar jornada** con resumen (esperado, cobrado, pendiente, desglose por cliente/método)  
- [ ] **RV2-018** Propietario/administrador: módulo **Cierre diario** — ver cierres de cobradores, recibir/confirmar recaudo del día  



### Shell y dashboard

- [ ] **RV2-019** Reducir tamaño de botones primarios y filtros en módulos propietario (créditos, cartera, etc.)  
- [ ] **RV2-020** Fusionar **Dashboard** en pestaña **Inicio**; eliminar ítem de menú Dashboard  
- [ ] **RV2-021** Inicio: dashboard **más gráfico** (KPIs visuales, tendencia recaudo/cartera — reutilizar datos actuales del dashboard)  

---



## 4. Catálogo de requerimientos (RV2)


| ID      | Rol         | Descripción                                                               | Prioridad etapa |
| ------- | ----------- | ------------------------------------------------------------------------- | --------------- |
| RV2-001 | Plataforma  | Moneda en alta de negocio: select con catálogo (`COP`, extensible)        | V2-B            |
| RV2-002 | Propietario | Dirección de cliente obligatoria                                          | V2-B            |
| RV2-003 | Propietario | Barrio en cliente (campo nuevo)                                           | V2-B            |
| RV2-004 | Propietario | Plazo del préstamo en meses al crear crédito                              | V2-C            |
| RV2-005 | Sistema     | Auto `numero_cuotas` por periodicidad, meses, exclusión domingos (diaria) | V2-C            |
| RV2-006 | Propietario | Listado créditos enriquecido (dirección, barrio, cobrador)                | V2-D            |
| RV2-007 | Propietario | UI filtros proporcionada                                                  | V2-A / V2-D     |
| RV2-008 | Propietario | Asignación: solo créditos sin cobrador activo                             | V2-D            |
| RV2-009 | Propietario | Sin flujo de reasignación accidental desde listado “sucio”                | V2-D            |
| RV2-010 | Cobrador    | Copy “Registrar pago”                                                     | V2-E            |
| RV2-011 | Cobrador    | Periodicidad visible en lista del día                                     | V2-E            |
| RV2-012 | Cobrador    | Ficha con datos de contacto y monto préstamo                              | V2-E            |
| RV2-013 | Cobrador    | Historial del crédito bajo formulario de pago                             | V2-E            |
| RV2-014 | Cobrador    | Métodos efectivo / transferencia                                          | V2-E            |
| RV2-015 | Cobrador    | Foto comprobante si transferencia                                         | V2-F            |
| RV2-016 | Sistema     | Abono multi-cuota si monto > saldo cuota (transacción)                    | V2-E / V2-F     |
| RV2-017 | Cobrador    | Cierre de jornada con resumen                                             | V2-G            |
| RV2-018 | Propietario | Cierre diario / recepción recaudo por cobrador                            | V2-G            |
| RV2-019 | Transversal | Densidad UI (botones, filtros)                                            | V2-A            |
| RV2-020 | Propietario | Inicio = dashboard; quitar ruta dashboard                                 | V2-A            |
| RV2-021 | Propietario | Inicio gráfico e informativo                                              | V2-A            |


---



## 5. Etapas de implementación

Cada fila: **rama sugerida** → **ROUTER** → archivos foco → dependencias.

### V2-A — Shell, Inicio y densidad UI


| Ítem              | Detalle                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| **Rama**          | `feature/creditos_v2_inicio_dashboard_ui`                                                                |
| **ROUTER**        | `frontend-feature.md` + `corregir-front.md` → `calidad-tests`                                            |
| **Depende de**    | MVP Fase 6 (dashboard API existente)                                                                     |
| **Alcance**       | RV2-019, RV2-020, RV2-021; estilos compartidos en `shell-app`, listados (botones/filtros)                |
| **Archivos foco** | `shell-app.component.`*, `inicio.component.`*, `dashboard.component.*`, `app.routes.ts`, SCSS compartido |
| **Backend**       | Opcional: ninguno si Inicio consume mismos endpoints del dashboard                                       |
| **No hacer**      | Nuevas métricas no existentes en API                                                                     |




### V2-B — Clientes, barrio y moneda plataforma


| Ítem              | Detalle                                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rama**          | `feature/creditos_v2_clientes_barrio_moneda`                                                                                                        |
| **ROUTER**        | `schema-bd.md` (si barrio) → `backend-crud` → `calidad-tests` → `frontend-crud`                                                                     |
| **Depende de**    | V2-A opcional (estilos)                                                                                                                             |
| **Alcance**       | RV2-001, RV2-002, RV2-003                                                                                                                           |
| **Archivos foco** | `docs/00-esquema-bd.md`, Prisma `clientes`, DTOs, `crear-negocio-plataforma`, formulario clientes, catálogo monedas (`negocios.moneda` + UI select) |
| **API**           | Validación 422 si falta dirección; POST/PATCH clientes                                                                                              |




### V2-C — Plazo en meses y generación de cuotas


| Ítem                | Detalle                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rama**            | `feature/creditos_v2_plazo_meses_cuotas`                                                                                                                                                                                                                                                                                      |
| **ROUTER**          | `backend-feature.md` → `calidad-tests` → `frontend-feature`                                                                                                                                                                                                                                                                   |
| **Depende de**      | Reglas §7 esquema BD; `generar-plan-cuotas`                                                                                                                                                                                                                                                                                   |
| **Alcance**         | RV2-004, RV2-005                                                                                                                                                                                                                                                                                                              |
| **Regla propuesta** | Entrada: `plazo_meses` (entero ≥ 1), `periodicidad`, `fecha_desembolso`. Salida: `numero_cuotas` persistido + fechas. **Diaria:** días hábiles excluyendo domingo entre desembolso y fin de plazo. **Semanal:** una cuota por semana civil en el plazo. **Quincenal/mensual:** según calendario documentado en SPEC de etapa. |
| **Archivos foco**   | `generar-plan-cuotas.ts`, `creditos.servicio.ts`, formulario nuevo crédito, tests P0 de conteo de cuotas con domingos                                                                                                                                                                                                         |




### V2-D — Créditos en listado y asignación limpia


| Ítem              | Detalle                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Rama**          | `feature/creditos_v2_listado_asignacion`                                                            |
| **ROUTER**        | `backend-feature` (consulta enriquecida + filtro asignables) → `calidad-tests` → `frontend-feature` |
| **Depende de**    | V2-B (barrio), V2-C opcional                                                                        |
| **Alcance**       | RV2-006, RV2-007, RV2-008, RV2-009                                                                  |
| **API**           | GET créditos con join cliente + asignación activa; GET créditos-asignables sin `cobrador_id` activo |
| **Archivos foco** | `listado-creditos`, `asignaciones` (selector), backend repositorio créditos/asignaciones            |




### V2-E — Jornada del cobrador (copy, datos, historial, abono)


| Ítem              | Detalle                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| **Rama**          | `feature/creditos_v2_jornada_cobrador`                                                         |
| **ROUTER**        | `registrar-pago.md` (si toca abono multi-cuota) + `frontend-feature` → `calidad-tests`         |
| **Depende de**    | V2-D (datos cliente en API cobros del día)                                                     |
| **Alcance**       | RV2-010 … RV2-014, RV2-016 (parte lógica si no existe)                                         |
| **Archivos foco** | `jornada-cobro.component.ts`, `pagos.servicio.ts`, DTO registrar pago, tests transacción abono |




### V2-F — Transferencia con comprobante foto


| Ítem           | Detalle                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Rama**       | `feature/creditos_v2_comprobante_transferencia`                                                                                |
| **ROUTER**     | `schema-bd.md` (usar `comprobantes_pago` RC-011) → `backend-feature` → `documentar-api` → `calidad-tests` → `frontend-feature` |
| **Depende de** | V2-E (métodos acotados)                                                                                                        |
| **Alcance**    | RV2-015                                                                                                                        |
| **Nota**       | Almacenamiento stub (clave en BD, archivo en volumen o base64 temporal documentado); no S3 productivo en esta etapa            |




### V2-G — Cierre jornada y cierre diario administrador


| Ítem                 | Detalle                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Rama**             | `feature/creditos_v2_cierres_diarios`                                                                                             |
| **ROUTER**           | `schema-bd.md` → `backend-feature` → `calidad-tests` → `frontend-feature`                                                         |
| **Depende de**       | V2-E (pagos del día consistentes)                                                                                                 |
| **Alcance**          | RV2-017, RV2-018                                                                                                                  |
| **Modelo propuesto** | Tablas `cierres_jornada` (cobrador, fecha, totales, detalle JSON) y `recepciones_cierre` (admin confirma recaudo) — detalle en §6 |
| **Archivos foco**    | Nuevo módulo backend + pantallas cobrador cierre + propietario recepciones                                                        |


---



## 6. Cambios de datos propuestos

Actualizar `docs/00-esquema-bd.md` **antes de migrar** en las etapas que correspondan.


| Cambio             | Tabla / campo                                                                          | Etapa |
| ------------------ | -------------------------------------------------------------------------------------- | ----- |
| Barrio             | `clientes.barrio` VARCHAR(120) NOT NULL (o NOT NULL tras migración datos)              | V2-B  |
| Dirección NOT NULL | `clientes.direccion`                                                                   | V2-B  |
| Plazo              | `creditos.plazo_meses` INT NOT NULL (snapshot en `condiciones_originales`)             | V2-C  |
| Catálogo moneda    | Mantener ISO en `negocios.moneda`; catálogo en código o tabla `monedas` si se extiende | V2-B  |
| Comprobante        | `comprobantes_pago` + upload                                                           | V2-F  |
| Cierres            | `cierres_jornada`, `recepciones_cierre` (nombres tentativos)                           | V2-G  |


---



## 7. Reglas de negocio nuevas o aclaradas



### 7.1 Cuotas por plazo (RV2-004 / RV2-005)

- El usuario define **cuántos meses** dura el compromiso de pago, no el número de cuotas a mano.  
- **Diaria:** contar días de cobro en el rango excluyendo **domingos** (alineado a `dias-habiles-colombia` donde aplique).  
- **Semanal / quincenal / mensual:** SPEC de implementación fija anclaje (ej. misma weekday que desembolso).  
- `numero_cuotas` generado queda inmutable en `condiciones_originales` (RF-005).



### 7.2 Asignación (RV2-008)

- Un crédito con **asignación activa** no aparece en el combo de “nuevo crédito a asignar”.  
- Reasignación explícita (cerrar asignación previa) queda como flujo separado si se pide en V2.1; esta etapa evita el caso img. 5–6.



### 7.3 Pago mayor al saldo de cuota (RV2-016)

- Validación actual “monto no puede superar saldo pendiente **de la cuota**” evoluciona a:  
  - Permitir monto **>** saldo cuota actual si el excedente se aplica en la **misma transacción** a cuotas siguientes (orden por vencimiento).  
  - **No** recalcular interés total del crédito (condiciones inmutables).  
  - Auditar como un pago (o pagos encadenados atómicos) en `auditorias`.



### 7.4 Cierre jornada (RV2-017 / RV2-018)

- Cobrador cierra cuando termina ruta; snapshot de totales del día **inmutable**.  
- Administrador ve lista de cierres pendientes/recibidos y marca recepción (fecha, usuario, observación opcional).

---



## 8. Criterios de aceptación por etapa


| Etapa | Criterio de cierre (extracto)                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------- |
| V2-A  | Menú sin “Dashboard”; `/app/inicio` muestra KPIs gráficos; botones/filtros ≤ altura estándar definida en SPEC |
| V2-B  | No se crea cliente sin dirección; barrio visible en formulario; alta plataforma solo monedas del catálogo     |
| V2-C  | Crédito 1 mes diario excluye domingos en conteo; tests unitarios con fechas fijas                             |
| V2-D  | Combo asignación sin créditos ya asignados; listado créditos muestra barrio y cobrador                        |
| V2-E  | Copy “Registrar pago”; historial bajo inputs; ficha con teléfono y dirección                                  |
| V2-F  | Transferencia sin foto → 422; con foto → pago válido + registro comprobante                                   |
| V2-G  | Cobrador ve resumen al cerrar; admin ve cierres del día y confirma recepción                                  |


---



## 9. Cómo coordinar con el ROUTER

1. Abrir `.cursor/workflows/ROUTER.md`.
2. Elegir workflow de la **etapa V2-x** (§5).
3. Sugerir rama `feature/creditos_v2_*` desde `creditos-prepro`.
4. SPEC en chat citando IDs **RV2-*** de este documento.
5. OK del usuario → implementar → `calidad-tests`.
6. Marcar checklist §3 y fila en tabla de seguimiento (abajo).
7. Postman/Swagger si hay endpoint nuevo (ley 8).

**Entrada sugerida en chat (plantilla):**

```
Necesito: etapa V2-D del docs/03-Mejoras-V2-Operacion-UX.md
Alcance: RV2-006, RV2-008, RV2-009
Rama sugerida: feature/creditos_v2_listado_asignacion
```

---



## 10. Trazabilidad pantalla → requerimiento


| Referencia usuario | Pantalla / URL                        | RV2               |
| ------------------ | ------------------------------------- | ----------------- |
| Img. 1             | `/plataforma/negocios/nuevo` — moneda | RV2-001           |
| Img. 2             | Clientes — dirección                  | RV2-002, RV2-003  |
| Img. 3             | `/app/creditos/nuevo` — cuotas        | RV2-004, RV2-005  |
| Img. 4             | Listado créditos + filtros            | RV2-006, RV2-007  |
| Img. 5–6           | Asignar cartera                       | RV2-008, RV2-009  |
| Img. 7–8           | Cobros del día — botón y tarjetas     | RV2-010, RV2-011  |
| Img. 9–10          | Ficha rápida cobro                    | RV2-012, RV2-013  |
| Img. 11            | Método de pago                        | RV2-014, RV2-015  |
| Img. 12            | Monto > saldo cuota                   | RV2-016           |
| (nuevo)            | Cierre jornada / cierre admin         | RV2-017, RV2-018  |
| Transversal        | Botones grandes, dashboard            | RV2-019 … RV2-021 |


---



## Tabla de seguimiento V2 (actualizar manualmente)


| Etapa                   | Estado | Rama                                       | Fecha cierre | Notas |
| ----------------------- | ------ | ------------------------------------------ | ------------ | ----- |
| V2-A Inicio/UI          | ⬜ok    | fix/Ajuste_front                           | 25/09        |       |
| V2-B Clientes/moneda    | ⬜ok    | feature/creditos_v2_clientes_barrio_moneda | 25/09        |       |
| V2-C Plazo/cuotas       | ⬜      |                                            |              |       |
| V2-D Listado/asignación | ⬜      |                                            |              |       |
| V2-E Jornada cobrador   | ⬜      |                                            |              |       |
| V2-F Comprobante        | ⬜      |                                            |              |       |
| V2-G Cierres diarios    | ⬜      |                                            |              |       |


**Leyenda:** ⬜ Pendiente · 🔄 En curso · ✅ Cerrada (tests verdes)

---

*Fin del documento — Mejoras V2 Operación y UX v1.0*