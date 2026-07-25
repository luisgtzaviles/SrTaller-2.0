# Enforcement de ownership futuro

## Estado

Todos los paths de esta matriz son **future-approved / not materialized**.
Ninguno existe bajo `src/` en este cambio.

| Superficie futura | Owner | API/port | Consumer/composition |
| --- | --- | --- | --- |
| `src/infrastructure/database/database-config.ts` | database facility | `DatabaseConfig` | `database-connection.ts` |
| `src/infrastructure/database/database-types.ts` | database facility | `DatabaseSchema` | connection, runner y adapters registrados |
| `src/infrastructure/database/database-connection.ts` | database facility | `createDatabaseConnection` | tenancy/stations composition y migration runner |
| `src/infrastructure/database/transaction-runner.ts` | database facility | `TransactionRunner` | tenancy/stations composition |
| `src/infrastructure/database/migration-runner.ts` | database facility | `runMigrations` | script técnico registrado |
| `.../tenancy/application/ports/tenant-repository.port.ts` | tenancy | tenant port + tenant scope | tenancy adapter |
| `.../tenancy/infrastructure/persistence/kysely-tenant.repository.ts` | tenancy | adapter exacto | `tenancy.module.ts` |
| `.../stations/application/ports/branch-repository.port.ts` | stations | branch port + tenant/branch scope | stations adapter |
| `.../stations/infrastructure/persistence/kysely-branch.repository.ts` | stations | adapter exacto | `stations.module.ts` |
| `src/infrastructure/database/migrations/` | central runner; cada archivo declara owner | naming UTC owner-scoped | migration runner |

## Objetos físicos registrados

| Objeto | Owner | Acceso autorizado |
| --- | --- | --- |
| `tenants` | tenancy | adapter tenancy |
| `branches` | stations | adapter stations |

`access` no adquiere ownership de ninguno. Un objeto/path/export/consumer no
registrado falla; el checker no lo auto-admite.
