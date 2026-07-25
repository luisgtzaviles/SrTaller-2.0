# DEC-050 — Resumen del expediente

## Resultado

- **Estado anterior:** abierta; ADR-003 sólo fijaba principios.
- **Estado final:** `Accepted with conditions`.
- **Materialización:** no iniciada.
- **Condiciones:** DEC050-C01 a C10 `Pending`.
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

## Por qué puede aceptarse sin instalar

La decisión elige un contrato con evidencia primaria de API, orden,
transacción, lock y compatibilidad declarada. La instalación y ejecución son
condiciones de materialización, no requisitos para comparar las opciones.

La aceptación no habilita la primera migración: DEC050-C01 y SPIKE-002 siguen
siendo gates fail-closed.

## Temas no absorbidos

DEC-050 no decide:

- ownership o repositorios, gobernados por DEC-049;
- taxonomía de errores, gobernada por DEC-044;
- pipeline y branch protection, gobernados por DEC-051;
- Definition of Done, gobernada por DEC-063;
- RLS, proveedor productivo, backup/restore o release.
