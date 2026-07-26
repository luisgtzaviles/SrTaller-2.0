# PBI-023 — Owner-scoped persistence adapters

## Dictamen

`PASS — PBI-023 OWNER-SCOPED PERSISTENCE VERIFIED`

El Paso 10 materializa puertos y adapters específicos para `tenancy` y
`stations`. Toda operación individual de branch exige `tenantId + branchId`;
la lista exige `tenantId`. Los puertos no filtran Kysely, `pg`, SQL, conexión
ni contexto transaccional.

## Alcance materializado

- `tenancy` posee exclusivamente `tenants`;
- `stations` posee exclusivamente `branches`;
- capability interna discrimina el schema por owner;
- operación ordinaria y operación ligada al transaction runner;
- errores estables y sanitizados;
- PostgreSQL `18.4` real por digest, dos runs equivalentes y cleanup;
- aislamiento negativo, rollback, duplicados y contexto expirado;
- enforcement D5 vigente sin repositorio genérico.

No se implementaron endpoint, controller, DTO HTTP, provider Nest, startup DB,
auth, PIN, sesión, rol, capability de negocio, reparación, tabla, migración,
RLS ni workflow.

## Índice

- [OWNERSHIP.md](OWNERSHIP.md)
- [PORT_CONTRACTS.md](PORT_CONTRACTS.md)
- [TENANT_ADAPTER.md](TENANT_ADAPTER.md)
- [BRANCH_ADAPTER.md](BRANCH_ADAPTER.md)
- [TENANT_SCOPE.md](TENANT_SCOPE.md)
- [ERROR_MAPPING.md](ERROR_MAPPING.md)
- [TRANSACTION_USAGE.md](TRANSACTION_USAGE.md)
- [POSTGRESQL_TEST_MATRIX.md](POSTGRESQL_TEST_MATRIX.md)
- [NEGATIVE_ISOLATION.md](NEGATIVE_ISOLATION.md)
- [ARCHITECTURE_ENFORCEMENT.md](ARCHITECTURE_ENFORCEMENT.md)
- [CLEANUP.md](CLEANUP.md)
- [RESULTS.md](RESULTS.md)
- [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)
- [EVIDENCE_MANIFEST.json](EVIDENCE_MANIFEST.json)

## Estado de gobierno

PBI-023 pasa de `Ready — tenant schema verified / owner-scoped adapters
authorized` a `Ready — owner-scoped persistence verified / PostgreSQL CI gate
authorized`. No queda `Done`; el PostgreSQL autoritativo de CI es el siguiente
gate.
