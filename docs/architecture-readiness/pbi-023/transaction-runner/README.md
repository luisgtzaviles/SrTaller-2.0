# PBI-023 — Transaction runner

## Resultado

**PASS — PBI-023 TRANSACTION RUNNER VERIFIED**

Se materializó una frontera transaccional explícita sobre la
[facility de conexión](../connection-facility/README.md), sin exponer pool,
Kysely, cliente, SQL ni control manual. El callback recibe un contexto
inmutable, ejecuta una vez y comparte internamente el executor reservado.

## Superficies

- `transaction-runner.ts`: options, context, error y `runInTransaction`.
- `database-transaction-capability.ts`: capability exclusivamente interna al
  owner database.
- `database-connection.ts`: coordinación interna y drenado en cierre; su API
  pública no cambió.
- pruebas unitarias y PostgreSQL 18.4 efímero;
- D5-R048 y evidencia documental.

No se crearon migraciones, tablas productivas, repositories, adapters, ports,
providers Nest ni wiring de aplicación.

## Contratos

- [Contrato transaccional](TRANSACTION_CONTRACT.md)
- [Aislamiento](ISOLATION_LEVELS.md)
- [Read-only](READ_ONLY_POLICY.md)
- [Nesting](NESTING_POLICY.md)
- [Errores](ERROR_MAPPING.md)
- [Sanitización](SANITIZATION.md)
- [Concurrencia](CONCURRENCY.md)
- [Matriz PostgreSQL](POSTGRESQL_TEST_MATRIX.md)
- [Cleanup](CLEANUP.md)
- [Enforcement](ARCHITECTURE_ENFORCEMENT.md)
- [Resultados](RESULTS.md)
- [Trazabilidad](TRACEABILITY_MATRIX.md)
- [Manifest](EVIDENCE_MANIFEST.json)

## Comandos de reproducción

Con Node.js `24.18.0` y pnpm `11.15.1`:

```bash
pnpm install --frozen-lockfile
pnpm run architecture
pnpm run typecheck
pnpm run build
pnpm test
pnpm run test:architecture
node scripts/test-database-transaction-postgresql.mjs --runs 2
pnpm run verify
pnpm run smoke:start
git diff --check
```

El test PostgreSQL usa sólo credenciales sintéticas, puerto dinámico y un
container efímero que se elimina aun ante fallo.
