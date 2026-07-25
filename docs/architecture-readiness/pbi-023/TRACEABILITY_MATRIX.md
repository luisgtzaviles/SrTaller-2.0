# Matriz de trazabilidad de PBI-023

| Requisito/gate | Autoridad | Diseño | Evidencia futura | Estado |
|---|---|---|---|---|
| PostgreSQL 18.4 | ADR-003, DEC051-C03 | TECHNICAL_DESIGN § dependencies/testing | [connection test matrix](connection-facility/POSTGRESQL_TEST_MATRIX.md) | `Facility verified locally twice; product CI pending` |
| Node/TS/ESM/NodeNext | DEC-004 | SPIKE §1/13 | [product compatibility/frozen installs](dependency-installation/COMPATIBILITY.md) | `PASS for package install; runtime pending` |
| Kysely/pg exactos | DEC049-C01, DEC050-C01 | DEC-050 + SPIKE | [dependency manifest](dependency-installation/EVIDENCE_MANIFEST.json) | `PASS package selection; C01 runtime/CI pending` |
| migrador único | DEC-050 | MIGRATION_STRATEGY | [migration runner](migration-runner/MIGRATION_CONTRACT.md) | `PASS local; operational composition pending` |
| orden/immutability | DEC050-C02 | DEC-050 §6.1 | [schema manifest](first-productive-migration/EVIDENCE_MANIFEST.json) | `PASS first product migration` |
| lock concurrente | DEC050-C03 | MIGRATION_STRATEGY | [advisory lock](migration-runner/ADVISORY_LOCK.md) | `PASS local; CI/job pending` |
| transacción/fallo | DEC049-C04, DEC050-C04 | TECHNICAL_DESIGN §8 | [runner PostgreSQL matrix](transaction-runner/POSTGRESQL_TEST_MATRIX.md) | `PASS runner; migration use pending` |
| drift/checksum | DEC050-C05 | MIGRATION_STRATEGY | [manifest/drift](migration-runner/MANIFEST_AND_DRIFT.md) | `PASS runner; promotion gate pending` |
| config/roles/secretos | DEC050-C06, DEC055 parcial, DEC063-C06 | TECHNICAL_DESIGN §7 | [typed configuration](typed-configuration/README.md) | `PASS contractual; operational roles/provider pending` |
| vacío/anterior/re-run | DEC050-C07, DEC051-C03 | IMPLEMENTATION step 8/10 | [schema PostgreSQL matrix](first-productive-migration/POSTGRESQL_TEST_MATRIX.md) | `PASS product local; CI pending` |
| no migration startup | DEC-004, DEC050-C08 | IMPLEMENTATION step 8/14 | [D5-R049](migration-runner/ARCHITECTURE_ENFORCEMENT.md) | `PASS` |
| owner/scope | DEC049-C02, DEC050-C09 | OWNERSHIP_REGISTRY | [schema ownership](first-productive-migration/OWNERSHIP.md) | `Schema/constraints PASS; adapters pending` |
| tenant obligatorio | ADR-004, DEC-049 | ISOLATION_TEST_PLAN | D5-R044 + ISO-001–007 | `Static contract enforced; runtime pending` |
| branch coherente | ADR-004/010, DEC-049 | TECHNICAL_DESIGN §5 | D5-R044/D5-R047 + ISO-008–011 | `Static ownership enforced; runtime pending` |
| contexto concurrente | SPIKE-002 | ISOLATION_TEST_PLAN | [E8–E10](spike-002-evidence/EXPERIMENT_MATRIX.md) | `Verified by spike; product suite pending` |
| no query global | DEC049-C05/C07 | TECHNICAL_DESIGN §2 | [D5-R038/D5-R039/D5-R046](connection-facility/ARCHITECTURE_ENFORCEMENT.md) | `PASS; only owner-scoped literal select 1 probe` |
| error sanitizado | DEC-044, DEC049-C06 | TECHNICAL_DESIGN §9 | [transaction mapping/redaction](transaction-runner/ERROR_MAPPING.md) | `PASS config/connection/runner; adapter mapping pending` |
| boundaries/checker | DEC-005, DEC051-C06/C09 | IMPLEMENTATION step 3/7/8/9 | [schema enforcement](first-productive-migration/ARCHITECTURE_ENFORCEMENT.md) | `PASS — D5-R037–D5-R053` |
| branch protection | DEC051-C02 | DEC_051_APPLICABILITY | remote config/rejection | `Pending` |
| riesgo high fail-closed | DEC063-C02 | RISK_ASSESSMENT | review/manifest | `Defined; pending closure` |
| checklist migration | DEC063-C05 | DEC_063_APPLICABILITY | completed checklist | `Pending` |
| checklist security | DEC063-C06 | DEC_063_APPLICABILITY | negatives/redaction/privilege | `Pending` |
| release/hotfix | DEC063-C07 | excluded | future runbook | `Not triggered` |
| waiver | DEC063-C08 | none | only if exception | `Not triggered` |
| fixtures sintéticos | DEC-052 | SPIKE/ISOLATION plans | fixture manifest | `Pending` |
| evidence manifest | DEC063-C03 | EXPECTED_EVIDENCE | [product JSON + hashes](first-productive-migration/EVIDENCE_MANIFEST.json) | `PASS product schema` |

## Cadena de gate

`DEC-050 accepted → SPIKE-002 executable PASS → checker/boundaries → exact
dependencies → config → connection → transaction runner → migrator → schema/owners → PG18 real →
isolation/transactions → evidence/review → merge`

SPIKE-002, la instalación exacta, la configuración tipada, la facility de
conexión, transaction runner, migration runner y primera migración están
ejecutados y cerrados. Su evidencia no sustituye PostgreSQL CI
ni etapas posteriores.
