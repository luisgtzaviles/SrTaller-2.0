# PBI-023 — Primera migración productiva

## Dictamen

**PASS — PBI-023 TENANT SCHEMA VERIFIED**

El Paso 9 materializa una única migración productiva central que crea
exclusivamente `tenants` y `branches`. El contrato se verificó con PostgreSQL
18.4 efímero en dos bases vacías, introspección de catálogos, pruebas negativas
de aislamiento, `up`/re-run/`down`/reapply, rollback atómico, manifest/drift y
cleanup sin residuos.

## Alcance exacto

- migración:
  `20260725183832_database_create_tenants_and_branches.ts`;
- owner operacional de migración: `database`;
- owner de `tenants`: `tenancy`;
- owner de `branches`: `stations`;
- tipos centrales mínimos de Kysely;
- reglas D5-R050–D5-R053;
- cero repositories, adapters, ports, seeds, RLS o wiring de startup.

## Índice

- [Contrato de schema](SCHEMA_CONTRACT.md)
- [Tabla tenants](TABLE_TENANTS.md)
- [Tabla branches](TABLE_BRANCHES.md)
- [Claves y constraints](KEYS_AND_CONSTRAINTS.md)
- [Índices](INDEXES.md)
- [Aislamiento tenant](TENANT_ISOLATION.md)
- [Up y down](UP_DOWN.md)
- [Introspección](INTROSPECTION.md)
- [Matriz PostgreSQL](POSTGRESQL_TEST_MATRIX.md)
- [Enforcement](ARCHITECTURE_ENFORCEMENT.md)
- [Ownership](OWNERSHIP.md)
- [Cleanup](CLEANUP.md)
- [Resultados](RESULTS.md)
- [Trazabilidad](TRACEABILITY_MATRIX.md)
- [Manifest](EVIDENCE_MANIFEST.json)

## Límites

La evidencia prueba aislamiento estructural del schema, no autorización de
usuario, permisos, sesión, RLS ni aislamiento de queries de adapters futuros.
DEC051-C03 continúa parcial mientras PostgreSQL real permanezca fuera de la CI
autoritativa.
