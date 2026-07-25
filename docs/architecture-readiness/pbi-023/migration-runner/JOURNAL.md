# Journal de migraciones

Se conservan los defaults de Kysely:

- `kysely_migration`;
- `kysely_migration_lock`;
- schema por defecto;
- row de lock estándar;
- `allowUnorderedMigrations: false`;
- transacciones habilitadas.

Status sobre un directorio vacío no crea el journal. La primera operación
mutante lo crea mediante `Migrator`. `migrateToLatest` registra A/B en orden;
la repetición no agrega filas; `migrateDown` elimina sólo la última fila
autorizada.

Una migración `up` fallida revierte su DDL y no escribe su fila. Una migración
`down` fallida conserva tabla y fila por rollback. Las pruebas consultan el
journal sólo desde el harness administrativo y eliminan ambas tablas al final.

El journal no es objeto de negocio, no tiene owner tenant y no se incluye en
`DatabaseSchema`.
