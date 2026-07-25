# Matriz de trazabilidad de PBI-023

| Requisito/gate | Autoridad | Diseño | Evidencia futura | Estado |
|---|---|---|---|---|
| PostgreSQL 18.4 | ADR-003, DEC051-C03 | TECHNICAL_DESIGN § dependencies/testing | version/lifecycle/run | `Pending` |
| Node/TS/ESM/NodeNext | DEC-004 | SPIKE §1/13 | frozen install/typecheck/build | `Pending execution` |
| Kysely/pg exactos | DEC049-C01, DEC050-C01 | DEC-050 + SPIKE | lockfile/metadata/test | `Candidate selected` |
| migrador único | DEC-050 | MIGRATION_STRATEGY | runner/status/latest | `Defined` |
| orden/immutability | DEC050-C02 | DEC-050 §6.1 | mutation/status/hash | `Defined; pending` |
| lock concurrente | DEC050-C03 | MIGRATION_STRATEGY | two-process test | `Pending` |
| transacción/fallo | DEC049-C04, DEC050-C04 | TECHNICAL_DESIGN §8 | commit/rollback/failure | `Pending` |
| drift/checksum | DEC050-C05 | MIGRATION_STRATEGY | SHA-256 manifest | `Defined; pending` |
| roles/secretos | DEC050-C06, DEC063-C06 | TECHNICAL_DESIGN §7 | privilege/redaction tests | `Pending` |
| vacío/anterior/re-run | DEC050-C07, DEC051-C03 | IMPLEMENTATION step 9 | migration suite | `Pending` |
| no migration startup | DEC-004, DEC050-C08 | IMPLEMENTATION step 7/13 | smoke/status | `Pending` |
| owner/scope | DEC049-C02, DEC050-C09 | OWNERSHIP_REGISTRY | checker/review | `Proposed` |
| tenant obligatorio | ADR-004, DEC-049 | ISOLATION_TEST_PLAN | ISO-001–007 | `Pending` |
| branch coherente | ADR-004/010, DEC-049 | TECHNICAL_DESIGN §5 | ISO-008–011 | `Pending` |
| contexto concurrente | SPIKE-002 | ISOLATION_TEST_PLAN | ISO-012–015 | `Blocked` |
| no query global | DEC049-C05/C07 | TECHNICAL_DESIGN §2 | static negatives | `Pending` |
| error sanitizado | DEC-044, DEC049-C06 | TECHNICAL_DESIGN §9 | translation/log tests | `Pending` |
| boundaries/checker | DEC-005, DEC051-C06/C09 | IMPLEMENTATION step 3 | fixtures/mutations/double run | `Pending` |
| branch protection | DEC051-C02 | DEC_051_APPLICABILITY | remote config/rejection | `Pending` |
| riesgo high fail-closed | DEC063-C02 | RISK_ASSESSMENT | review/manifest | `Defined; pending closure` |
| checklist migration | DEC063-C05 | DEC_063_APPLICABILITY | completed checklist | `Pending` |
| checklist security | DEC063-C06 | DEC_063_APPLICABILITY | negatives/redaction/privilege | `Pending` |
| release/hotfix | DEC063-C07 | excluded | future runbook | `Not triggered` |
| waiver | DEC063-C08 | none | only if exception | `Not triggered` |
| fixtures sintéticos | DEC-052 | SPIKE/ISOLATION plans | fixture manifest | `Pending` |
| evidence manifest | DEC063-C03 | EXPECTED_EVIDENCE | JSON + docs + hashes | `Defined; pending` |

## Cadena de gate

`DEC-050 accepted → SPIKE-002 executable PASS → checker/boundaries → exact
dependencies → config/connection/migrator → schema/owners → PG18 real →
isolation/transactions → evidence/review → merge`

No se puede saltar SPIKE-002 usando esta matriz como sustituto de ejecución.
