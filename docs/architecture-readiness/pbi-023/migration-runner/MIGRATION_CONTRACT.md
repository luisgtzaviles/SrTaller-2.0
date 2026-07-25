# Contrato del migration runner

## Owner y API

El owner es `database` y la única API administrativa del runner es:

- `createMigrationRunner(connection, options)`;
- `getMigrationStatus()`;
- `migrateToLatest()`;
- `migrateUp()`;
- `migrateDown(authorization)`;
- `destroy()`.

Los tipos públicos son `DatabaseMigrationRunnerOptions`,
`DatabaseMigrationDownAuthorization`, `DatabaseMigrationStatusItem`,
`DatabaseMigrationStatus`, `DatabaseMigrationExecution`,
`DatabaseMigrationRunner` y `DatabaseMigrationError`.

No se exportan Kysely, `Migrator`, `FileMigrationProvider`, `Pool`, SQL, un
setter de path ni filesystem arbitrario. Capability, provider y override de
fixtures son owner-internal y D5-R049 limita sus consumidores exactos.

## Precondiciones

La creación exige simultáneamente:

- role `migration`;
- `migrationsEnabled === true`;
- access mode `read-write`;
- environment y conexión ya validados por la configuración tipada.

Application, test, read-only o migration deshabilitado fallan antes de verificar
o adquirir conexión. No se abre red al construir el runner.

## Operaciones y lifecycle

Estados: `created`, `inspecting`, `acquiring-lock`, `running`, `ready`,
`failed`, `closing` y `closed`.

Una instancia admite una sola operación activa. Un error deja el runner en
`failed`, pero permite una inspección o reintento explícito posterior. `destroy`
espera una operación activa y es idempotente. La conexión es propiedad del
caller: el runner no la crea ni la cierra; el caller ejecuta después
`connection.close()`, que drena una migración activa antes de destruir pool y
Kysely.

## Mutación explícita

Status puede ejecutarse sin hash esperado y marca el manifest como
`unverified`. Toda mutación exige `expectedManifestHash` exacto. Esto obliga al
orquestador futuro a ligar artefacto revisado y ejecución, sin almacenar
metadata paralela no autorizada en PostgreSQL.

No hay ejecución por import, build, start, bootstrap ni `AppModule`. La
composición CLI/secret provider se difiere porque aún no existe un contrato
operacional completo.
