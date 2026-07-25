# Resultado formal de SPIKE-002

## Dictamen

**PASS — SPIKE-002 MATERIAL VERIFICATION COMPLETE**

La hipótesis fue confirmada con PostgreSQL `18.4` real, baseline exacta,
assertions automatizadas E1–E12, dos corridas limpias, comparación material,
cleanup y sanitización.

## Checklist de cierre

| Criterio | Resultado |
|---|---|
| PostgreSQL real `18.4` | PASS |
| versiones exactas | PASS |
| Linux `amd64` reproducible | PASS |
| ESM/NodeNext | PASS |
| E1–E12 ejecutados | PASS |
| assertions con fallo no-cero | PASS |
| run-1 desde cero | PASS |
| cleanup entre runs | PASS |
| run-2 desde cero | PASS |
| comparación material | PASS |
| hashes de artefactos | PASS |
| hashes técnicos antes/después | PASS — nueve superficies MATCH |
| evidencia sanitizada | PASS |
| cero recursos residuales | PASS |
| cero cambios técnicos productivos | PASS |

## Hallazgos

1. La baseline candidata es compatible materialmente.
2. Kysely puede ordenar, registrar, repetir y revertir las migraciones
   experimentales requeridas.
3. PostgreSQL revirtió el DDL transaccional probado y rechazó la operación
   concurrente no transaccional dentro de la transacción.
4. El lock de migración serializó ejecutores y liberó la sesión tras cierre.
5. Contexto obligatorio, queries scopeadas y FK compuesta evitaron lecturas,
   escrituras y referencias cross-tenant.
6. `read committed` permite lost update en un read-modify-write sin control;
   el baseline productivo requerirá precondición/CAS donde aplique.
7. El pool respetó límites y cerró sin conexiones ni handles pendientes.

## Riesgos residuales

- el patrón aún no está materializado en `src/`;
- checker, ownership registry y dependencias productivas siguen pendientes;
- CI real de persistencia y branch protection siguen pendientes;
- roles separados de app/migración y operación de secretos siguen pendientes;
- kill abrupto y recuperación operativa futura no fueron probados;
- no se debe generalizar CAS a negocio todavía no modelado.

## Impacto

PBI-023 puede pasar de `Blocked — planning complete` a
`Ready — SPIKE-002 materially verified / implementation gates ready`.
Esto no significa `In progress`, `Implemented` ni `Done`, y no autoriza
PBI-024, merge, release o despliegue.

La siguiente acción autorizable es el Paso 3 del plan: extender primero los
boundaries y el checker antes de modificar `src/`.
