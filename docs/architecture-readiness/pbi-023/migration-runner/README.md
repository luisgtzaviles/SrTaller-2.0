# PBI-023 Paso 8 — Migration runner gobernado

## Resultado

**PASS — PBI-023 MIGRATION RUNNER VERIFIED**

El Paso 8 materializa el runner administrativo, la capability interna de
conexión y el wrapper gobernado sobre `Kysely.Migrator` y
`FileMigrationProvider`. La ejecución es explícita, exige role `migration`,
usa manifest SHA-256 y lock finito, y no forma parte de import, build,
`AppModule`, bootstrap o startup.

No existe todavía `src/infrastructure/database/migrations/`. La ruta queda
reservada por policy y el runtime falla cerrado con
`DATABASE_MIGRATION_DIRECTORY_MISSING` hasta el Paso 9. Todos los módulos
ejecutables usados en esta verificación viven bajo `test/fixtures/`.

## Índice

- [Contrato](MIGRATION_CONTRACT.md)
- [Directorio autoritativo](DIRECTORY_POLICY.md)
- [Nombres](NAMING_POLICY.md)
- [Discovery y provider](DISCOVERY.md)
- [Manifest y drift](MANIFEST_AND_DRIFT.md)
- [Advisory lock](ADVISORY_LOCK.md)
- [Journal](JOURNAL.md)
- [Down gobernado](DOWN_POLICY.md)
- [Errores](ERROR_MAPPING.md)
- [Sanitización](SANITIZATION.md)
- [Matriz PostgreSQL](POSTGRESQL_TEST_MATRIX.md)
- [Enforcement](ARCHITECTURE_ENFORCEMENT.md)
- [Cleanup](CLEANUP.md)
- [Trazabilidad](TRACEABILITY_MATRIX.md)
- [Resultados](RESULTS.md)
- [Manifest de evidencia](EVIDENCE_MANIFEST.json)

## Alcance acreditado

- status seguro e inmutable;
- `migrateToLatest`, `migrateUp` y un solo `migrateDown` autorizado;
- ESM/NodeNext ejecutado desde `dist`;
- journal estándar de Kysely;
- rollback transaccional ante fallo;
- lock de sesión con timeout y liberación;
- hash por archivo y hash agregado;
- drift fail-closed;
- errores estables sin mensajes crudos;
- dos runs limpios con Node.js `24.18.0` y PostgreSQL `18.4`.

## Límite

Esta evidencia no autoriza la primera migración productiva, schema de negocio,
repositorios, adapters, wiring Nest, CLI operacional, PostgreSQL autoritativo
en CI, merge, R0 ni cierre de Sprint 00.
