# DEC-050 — Resumen del expediente

## Resultado

- **Estado anterior:** abierta; ADR-003 sólo fijaba principios.
- **Estado final:** `Accepted with conditions`.
- **Materialización productiva:** selección exacta, configuración, conexión y
  runners transaccional/de migraciones materializados sin wiring ni schema.
- **Verificación material:** SPIKE-002 `PASS`; [evidencia](spike-002-evidence/README.md).
- **Condiciones:** C01–C08 ganan evidencia parcial del runner; primera
  migración, CI, operación compartida, schema/owners y promoción continúan
  pendientes. C09/C10 no se cierran.
- **Estrategia:** `Migrator` + `FileMigrationProvider` del core de Kysely.
- **Runner:** propio, mínimo, explícito y separado de build/start.
- **Decisión completa:** [DECISION_PROPOSAL.md](../../decisions/dec-050-migration-strategy/DECISION_PROPOSAL.md).
- **Revisión formal:** [FORMAL_REVIEW.md](../../decisions/dec-050-migration-strategy/FORMAL_REVIEW.md).

## Selección

| Tema | Decisión |
|---|---|
| Herramienta | core de Kysely; no CLI adicional |
| Versiones candidatas | `kysely@0.29.4`, `pg@8.22.0`, `@types/pg@8.20.0` |
| Orden | timestamp UTC lexicográfico; unordered deshabilitado |
| Journal | tablas default estables de Kysely |
| Lock | advisory lock del dialecto + exclusión/timeout del job |
| Transacción | habilitada por defecto; no transaccional prohibido en R0 inicial |
| Drift | inmutabilidad + status + manifest SHA-256 + commit exacto |
| Rollback | `down` sólo si es seguro/probado; shared/prod prefiere roll-forward |
| Startup | nunca migra implícitamente |
| Seguridad | usuarios separados, mínimo privilegio, evidencia sanitizada |
| Multi-tenant | owner/scope, `tenant_id`, constraints compuestas y negativos |

## Estado posterior a SPIKE-002

La decisión fue aceptada primero con evidencia primaria. SPIKE-002 agregó
evidencia material: baseline exacta, orden/journal, transacción, lock,
rollback, PostgreSQL real, aislamiento, hashes, doble run y cleanup pasaron.

Esto retira SPIKE-002 como bloqueo. El
[Paso 4](dependency-installation/README.md) materializó las tres versiones
exactas y un lock reproducible, sin código. No habilita directamente la
primera migración: C01 conserva configuración/runtime y PostgreSQL CI; C02–C10
conservan sus triggers de checker, runtime, operación y cambios persistentes.
Su desglose autoritativo está en la sección 10 de DEC-050, en la
[trazabilidad del spike](spike-002-evidence/TRACEABILITY_MATRIX.md) y en la
[trazabilidad de dependencias](dependency-installation/TRACEABILITY_MATRIX.md).

El [Paso 5](typed-configuration/README.md) agrega contrato de roles,
namespaces, TLS, pool/timeouts futuros y sanitización. Aporta cumplimiento
parcial a C01/C06, pero no crea migrator, lock, conexión, PostgreSQL CI ni
migración; C02–C10 conservan sus triggers runtime/operativos.

El [Paso 7](transaction-runner/RESULTS.md) materializa atomicidad,
commit/rollback, isolation y read-only sobre la facility verificada. Aporta
evidencia a C04 y a la reutilización de conexión, sin materializar `Migrator`,
`FileMigrationProvider`, journal, advisory lock, migrations, promoción ni
startup. Por ello no cierra C02–C10 ni autoriza la primera migración.

El [Paso 8](migration-runner/RESULTS.md) materializa `Migrator`,
`FileMigrationProvider`, status/up/down, journal, manifest/drift y advisory
lock finito. Dos runs PostgreSQL `18.4` verifican fixtures únicamente. Esto
autoriza solicitar la primera migración mínima, pero no satisface por completo
condiciones que exigen schema real, CI autoritativa, roles/operación compartida
o promoción.

## Temas no absorbidos

DEC-050 no decide:

- ownership o repositorios, gobernados por DEC-049;
- taxonomía de errores, gobernada por DEC-044;
- pipeline y branch protection, gobernados por DEC-051;
- Definition of Done, gobernada por DEC-063;
- RLS, proveedor productivo, backup/restore o release.

## Evidencia del Paso 9

La [primera migración productiva](first-productive-migration/RESULTS.md)
materializa el schema mínimo autorizado y aporta evidencia directa a ordering,
journal, manifest/drift, transacción, up/down, reapply, atomicidad y cleanup.
Dos runs PostgreSQL 18.4 coinciden materialmente. Las condiciones operativas de
CI, promoción y ejecución en ambientes compartidos permanecen pendientes; no
se declara DEC-050 cerrada sin condiciones.
