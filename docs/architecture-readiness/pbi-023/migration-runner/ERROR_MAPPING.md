# Errores del migration runner

| Código | Categoría | Origen |
| --- | --- | --- |
| `DATABASE_MIGRATION_INVALID_STATE` | Configuration | lifecycle, overlap u options |
| `DATABASE_MIGRATION_INVALID_ROLE` | Configuration | role/flag/access incompatibles |
| `DATABASE_MIGRATION_DIRECTORY_MISSING` | Configuration | root ausente |
| `DATABASE_MIGRATION_PATH_FORBIDDEN` | Configuration | contención/symlink |
| `DATABASE_MIGRATION_FILENAME_INVALID` | Configuration | entry o nombre inválido |
| `DATABASE_MIGRATION_DUPLICATE` | Configuration | timestamp/nombre repetido |
| `DATABASE_MIGRATION_DRIFT_DETECTED` | Persistence | manifest distinto/no verificado |
| `DATABASE_MIGRATION_LOCK_TIMEOUT` | Concurrency | exclusión no obtenida |
| `DATABASE_MIGRATION_LOCK_FAILED` | Infrastructure | advisory lock/driver |
| `DATABASE_MIGRATION_EXECUTION_FAILED` | Persistence | `up`/`latest` con error |
| `DATABASE_MIGRATION_DOWN_FORBIDDEN` | Configuration | autorización o función ausente |
| `DATABASE_MIGRATION_DOWN_FAILED` | Persistence | reversión fallida |
| `DATABASE_MIGRATION_STATUS_FAILED` | Persistence | lectura de status/journal |
| `DATABASE_MIGRATION_PROVIDER_FAILED` | Infrastructure | import/provider |
| `DATABASE_MIGRATION_CLEANUP_FAILED` | Infrastructure | unlock/cleanup |

Errores de fs, módulos, Kysely, `pg`, PostgreSQL y migraciones se conservan sólo
como causa privada no enumerable. El contrato visible contiene código,
categoría, mensaje fijo, operación, estado, ambiente, role, migration name y
timeout cuando aplica.

No hay retry automático para migraciones, lock, `40001`, `40P01` ni timeout.
Una nueva ejecución administrativa debe recomenzar la operación completa.
