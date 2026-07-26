# Matriz de trazabilidad

| Obligación | Autoridad | Evidencia | Estado |
| --- | --- | --- | --- |
| shared schema tenant | ADR-004 | [contrato](SCHEMA_CONTRACT.md) | PASS |
| tenant/branch identity | ADR-010, diseño PBI-023 | [tablas](TABLE_BRANCHES.md) | PASS |
| ownership | DEC-049 | [ownership](OWNERSHIP.md) | PASS schema; adapters pending |
| migración única/ordenada | DEC-050 C01–C02 | manifest + [up/down](UP_DOWN.md) | PASS local |
| atomicidad/down | DEC-050 C04/C07 | [up/down](UP_DOWN.md) | PASS |
| manifest/drift | DEC-050 C05 | pruebas sobre copia | PASS |
| no startup | DEC-050 C08 | D5-R049 | PASS |
| scope owner | DEC-050 C09 | D5-R050–D5-R053 | PASS schema |
| PostgreSQL real | DEC-051 C03 | [matriz](POSTGRESQL_TEST_MATRIX.md) | local PASS; CI partial |
| aislamiento negativo | DEC-051 C04 | [aislamiento](TENANT_ISOLATION.md) | schema PASS; adapters pending |
| checker/ownership | DEC-051 C06 | [enforcement](ARCHITECTURE_ENFORCEMENT.md) | PASS |
| DoD riesgo/migración/security | DEC-063 C02/C05/C06 | [resultados](RESULTS.md) | evidencia parcial |
| cleanup | DEC-063 | [cleanup](CLEANUP.md) | PASS |
