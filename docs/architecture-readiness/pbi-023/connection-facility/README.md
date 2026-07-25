# PBI-023 Paso 6 — Facility de conexión

## Dictamen

**PASS — PBI-023 CONNECTION FACILITY VERIFIED**

El paso materializa una única facility controlada de PostgreSQL en
`src/infrastructure/database/database-connection.ts`. La factory no abre red:
el primer `verify()` adquiere un cliente, ejecuta exclusivamente `select 1` y
lo libera. `close()` es explícito, concurrente e idempotente.

## Alcance materializado

- `pg.Pool` con mapping explícito de la configuración tipada;
- `Kysely<EmptyDatabaseSchema>` + `PostgresDialect` sin tablas ficticias;
- estados `created`, `verifying`, `ready`, `closing`, `closed`, `failed`;
- errores tipados y sanitizados;
- concurrencia determinista y cierre controlado;
- pruebas unitarias y dos runs PostgreSQL `18.4` reales;
- transición fail-closed de D5-R045 y excepción exacta D5-R046 para el probe.

## Límites preservados

No existen migraciones, tablas, DDL, transaction runner, repositories,
adapters, endpoints, wiring en `AppModule`, auto-connect en bootstrap ni
credenciales persistentes. El workflow no cambió y DEC051-C03 continúa
pendiente de un gate PostgreSQL en CI.

## Índice

- [CONNECTION_CONTRACT.md](CONNECTION_CONTRACT.md)
- [LIFECYCLE.md](LIFECYCLE.md)
- [ERROR_MAPPING.md](ERROR_MAPPING.md)
- [SANITIZATION.md](SANITIZATION.md)
- [POSTGRESQL_TEST_MATRIX.md](POSTGRESQL_TEST_MATRIX.md)
- [CONCURRENCY.md](CONCURRENCY.md)
- [ARCHITECTURE_ENFORCEMENT.md](ARCHITECTURE_ENFORCEMENT.md)
- [CLEANUP.md](CLEANUP.md)
- [RESULTS.md](RESULTS.md)
- [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)
- [EVIDENCE_MANIFEST.json](EVIDENCE_MANIFEST.json)

## Gate siguiente

Transaction runner sobre una misma conexión, en autorización separada. Esta
facility no lo anticipa ni autoriza migraciones o persistencia funcional.
