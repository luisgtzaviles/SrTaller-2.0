# Matriz de suites PostgreSQL

## Gap de entrada y cierre

| Suite | Test gated | Trigger previo | Motivo del skip ordinario | Estado CI | Artifact | Cleanup |
|---|---|---|---|---|---|---|
| connection | `test/database-connection-postgresql.test.mjs` | `SR_CONNECTION_PG_TEST` | PostgreSQL externo no disponible en test ordinario | 6/6 PASS, 0 skip | manifest VC-024 | PASS |
| transaction | `test/database-transaction-postgresql.test.mjs` | `SR_TRANSACTION_PG_TEST` | requiere DB real aislada | 1/1 PASS, 0 skip | manifest VC-024 | PASS |
| migration | `test/database-migration-postgresql.test.mjs` | `SR_MIGRATION_PG_TEST` | requiere journal/lock/DB real | 1/1 PASS, 0 skip | manifest VC-024 | PASS |
| schema | `test/database-schema-postgresql.test.mjs` | `SR_SCHEMA_PG_TEST` | aplica migración productiva | 1/1 PASS, 0 skip | manifest VC-024 | PASS |
| owner-scoped adapters | `test/owner-scoped-persistence-postgresql.test.mjs` | `SR_OWNER_SCOPED_PG_TEST` | requiere schema y dos tenants | 1/1 PASS, 0 skip | manifest VC-024 | PASS |

## Escenarios materiales

- connection: `select 1`, auth, DB inexistente, timeout, SSL, pool,
  concurrencia y close;
- transaction: commit, rollback, isolation, read-only, serializable, deadlock,
  timeout, concurrencia, close y reuse;
- migration: status, up/down, journal, lock/timeout, drift, provider y
  ejecución `dist`;
- schema: DB vacía, introspección, constraints, índices, down/reapply,
  atomicidad y aislamiento estructural;
- adapters: CRUD mínimo, duplicados, tenant inexistente, lecturas cross-tenant,
  list scopeado, commit/rollback y concurrencia.

Cada ejecución totalizó cinco suites, diez tests, cero fallos y cero skips
críticos.
