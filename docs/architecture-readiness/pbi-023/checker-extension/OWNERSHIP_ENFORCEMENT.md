# Enforcement de ownership futuro

## Estado

`database-config.ts` quedó **materialized-configuration** y
`database-connection.ts` quedó **materialized-connection-facility**,
`database-transaction-capability.ts` quedó
**materialized-owner-internal-capability** y `transaction-runner.ts` quedó
**materialized-transaction-runner**. Los demás paths continúan
**future-approved / not materialized**.

| Superficie futura | Owner | API/port | Consumer/composition |
| --- | --- | --- | --- |
| `src/infrastructure/database/database-config.ts` | database facility | config/error/parser/sanitizer exactos | `database-connection.ts` materializado |
| `src/infrastructure/database/database-types.ts` | database facility | `DatabaseSchema` | connection, runner y adapters registrados |
| `src/infrastructure/database/database-connection.ts` | database facility | interface/error/factory/sanitizer exactos; no exporta drivers | `transaction-runner.ts` materializado; migrator/composición futuros |
| `src/infrastructure/database/database-transaction-capability.ts` | database facility | capability interna, binding/release/use exactos; no superficie funcional | sólo connection y transaction runner |
| `src/infrastructure/database/transaction-runner.ts` | database facility | options/context/error/`runInTransaction` exactos | consumer diferido hasta composición de adapters tenancy/stations |
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
