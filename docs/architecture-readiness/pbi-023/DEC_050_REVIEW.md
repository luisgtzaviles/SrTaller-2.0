# DEC-050 — Resumen del expediente

## Resultado

- **Estado anterior:** abierta; ADR-003 sólo fijaba principios.
- **Estado final:** `Accepted with conditions`.
- **Materialización productiva:** no iniciada.
- **Verificación material:** SPIKE-002 `PASS`; [evidencia](spike-002-evidence/README.md).
- **Condiciones:** DEC050-C01 a C10 continúan pendientes por trigger; el spike
  verificó el patrón candidato, no la implementación.
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

Esto retira SPIKE-002 como bloqueo, pero no habilita directamente la primera
migración. C01–C10 conservan sus triggers de instalación, checker, runtime,
CI, operación y cambios persistentes. Su desglose autoritativo está en la
sección 10 de DEC-050 y en la
[trazabilidad del spike](spike-002-evidence/TRACEABILITY_MATRIX.md).

## Temas no absorbidos

DEC-050 no decide:

- ownership o repositorios, gobernados por DEC-049;
- taxonomía de errores, gobernada por DEC-044;
- pipeline y branch protection, gobernados por DEC-051;
- Definition of Done, gobernada por DEC-063;
- RLS, proveedor productivo, backup/restore o release.
