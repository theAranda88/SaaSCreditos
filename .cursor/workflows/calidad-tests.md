# Workflow — calidad-tests

**Puerta de salida.** Se encadena **siempre** después de crear o modificar código (CRUD, feature, pago, auth, front, bugfix, refactor, bootstrap). No es un flujo opcional de “si hay tiempo”.

Si la suite está en rojo, la actividad **no se entrega**. Se corrige hasta verde o se rutea a `debug-fix`.

## Cargar SOLO

- `.cursor/skills/calidad-tests/SKILL.md`
- tests del módulo tocado (grep `*.spec.ts` del feature)
- este archivo

## No cargar

El resto del dominio. No reescribir la feature “aprovechando” los tests.

## Prompt

```
Necesito: calidad-tests

Cambio que se cierra: [workflow origen, ej. backend-crud clientes]
Archivos tocados: [lista]
Riesgos: [negocio_id | dinero | rol | UI]
```

## Orden

1. Identificar capa (api / web / ambos).
2. Escribir o completar los tests **mínimos del skill** para ese tipo de cambio.
3. Ejecutar el comando del área. Pegar resultado (pass/fail) en el chat.
4. Rojo → no cerrado. Verde → recién ahí “hecho”.

## Done (los cuatro)

- [ ] Hay tests nuevos o actualizados que cubren el comportamiento pedido
- [ ] Nombres de tests en español (`debe ...`)
- [ ] Comando de la capa en **verde**
- [ ] Si hubo API: Postman del módulo no contradice los tests (mismo contrato)
