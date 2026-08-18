# Registry propuesto de ownership de persistencia

## Estado

- **Estado:** configuración, facility, runners, tipos, schema mínimo y
  adapters/ports owner-scoped materializados; PostgreSQL CI permanece
  pendiente.
- **Autoridad:** DEC-049.
- **Gate:** DEC049-C02.
- **Co-ownership:** prohibido.

La representación machine-readable vigente está en
`architecture/dec-005-policy.json` bajo `persistence`. D5-R041, D5-R044,
D5-R045 y D5-R047 fallan cerrado ante owner, scope, API, consumer u objeto no
registrado.

## Facility materializada

| Path | Owner | API | Consumer | Estado |
|---|---|---|---|---|
| `src/infrastructure/database/database-config.ts` | `database` | `DatabaseConfig`, `DatabaseConfigError`, `parseDatabaseConfig`, `sanitizeDatabaseConfig` | connection, runtime y migrator one-shot | `materialized-configuration`; pura y sin red |
| `src/infrastructure/database/database-connection.ts` | `database` | `DatabaseConnection`, `DatabaseConnectionError`, `createDatabaseConnection`, `sanitizeDatabaseConnectionState` | runtime, migrator, runners y adapters materializados | `materialized-connection-facility`; no exporta pool/Kysely |
| `src/infrastructure/database/database-persistence-capability.ts` | `database` | API owner-internal exacta | connection y adapters registrados | `materialized-owner-internal-capability`; executor tipado por owner |
| `src/infrastructure/database/database-transaction-capability.ts` | `database` | API interna exacta; no superficie funcional | exclusivamente connection y runner | `materialized-owner-internal-capability`; Kysely no se reexporta |
| `src/infrastructure/database/transaction-runner.ts` | `database` | `DatabaseTransactionOptions`, `DatabaseTransactionContext`, `DatabaseTransactionError`, `runInTransaction` | adapters/composición futuros | `materialized-transaction-runner` |
| `src/infrastructure/database/database-migration-capability.ts` | `database` | capability/runtime internos exactos | exclusivamente connection y migration runner | `materialized-owner-internal-capability`; no superficie funcional |
| `src/infrastructure/database/database-migration-provider.ts` | `database` | inspection/manifest/provider internos | exclusivamente migration runner | `materialized-owner-internal-provider`; root arbitrario no público |
| `src/infrastructure/database/migration-runner.ts` | `database` | options/status/execution/error/factory exactos | `src/db-migrate.ts` | `materialized-migration-runner`; sólo one-shot, startup HTTP prohibido |
| `src/infrastructure/database/database-runtime.ts` | `database` | lifecycle y readiness sanitizados | `src/main.ts` | `materialized-database-runtime`; conexión y schema listos antes de escuchar |
| `src/infrastructure/database/database-types.ts` | `database` | `DatabaseSchema` y tipos select/insert/update inmutables | migración; adapters futuros | `materialized-schema-contract` |
| `src/infrastructure/database/migrations/20260725183832_database_create_tenants_and_branches.ts` | `database` operacional | `up`/`down` | migration runner | `materialized`; schema DDL únicamente |

## Objetos

| Objeto | Owner único | Scope | Escrituras | Lecturas | Invariantes | Evolución |
|---|---|---|---|---|---|---|
| `tenants` | `tenancy` | global SaaS; raíz de tenant | sólo adapter tenancy | tenancy; referencias por FK | UUID/timestamp no nulos; PK tenant; delete referenciado restringido | creada por migración central Paso 9; adapter Paso 10 |
| `branches` | `stations` | tenant + sucursal | sólo adapter stations | stations con tenant + branch | PK `(tenant_id, branch_id)`; FK tenant restrictiva | creada por migración central Paso 9; adapter Paso 10 |
| `kysely_migration` | facility database | técnico global | sólo migrador core | runner/status | journal no manipulable por app | DEC-050 |
| `kysely_migration_lock` | facility database | técnico global | sólo migrador core | migrador | exclusión del migrador | DEC-050 |

## Accesos

- `tenancy` no accede físicamente a `branches`.
- `stations` puede depender del contrato público de tenancy, pero su FK no
  autoriza lectura arbitraria de la tabla owner.
- La migración central puede crear objetos de distintos owners sólo con un
  archivo y review que declare el owner correspondiente.
- Tests no convierten acceso directo en API productiva.
- No existe `BaseRepository`, CRUD genérico ni query global ordinaria.

## Scope de repositorios

| Puerto | Scope obligatorio | Métodos iniciales permitidos |
|---|---|---|
| tenant repository | `tenantId` explícito para operación tenant | sólo los necesarios por la prueba/consumidor real |
| branch repository | `tenantId` + `branchId` cuando es individual; `tenantId` para lista tenant-wide explícita | sólo los necesarios por la prueba/consumidor real |

Las firmas materializadas están documentadas en
[owner-scoped-adapters/PORT_CONTRACTS.md](owner-scoped-adapters/PORT_CONTRACTS.md).
No se autorizaron update/delete ni CRUD genérico.

## Constraints físicas materializadas

- `tenants`: PK por tenant.
- `branches`: PK compuesta tenant + branch; FK al tenant con `RESTRICT`.
- futuras referencias branch-scoped: FK compuesta tenant + branch.
- futuras claves naturales tenant-scoped: UK con tenant.
- índices actuales: sólo PK; `branches_pk` comienza por tenant y fue verificado
  con `EXPLAIN`.

## Cambios al registry

Agregar tabla, vista, secuencia, función, índice especial o acceso cross-module
requiere:

1. owner único;
2. scope;
3. invariantes;
4. consumidores;
5. migración owner;
6. actualización de tests/constraints/checker;
7. revisión DEC-049.
