# PBI-041 — FV2-041-001 Owner-scoped PostgreSQL remediation

## Scope and candidate

- Date: 2026-09-19.
- Branch: `feature/pbi-041-bulk-catalog-composer`.
- Base HEAD: `165719c3419423e721f884147f46b3069185ad64`.
- Verified implementation predecessor: `a18d763e7ad0f8c760c8b3c9a9cf3d6f8e7a3555`.
- Remediation implementation commit: `68350af`.
- Owner data and AviCell: read-only and unchanged.
- Remote actions: none.

This evidence preserves the failed result in
[`FORMAL_REVERIFICATION_REVIEW_041_001.md`](FORMAL_REVERIFICATION_REVIEW_041_001.md).
It does not reinterpret that run as PASS. A new independent Formal
Re-Verification remains mandatory after the focused remediation prerequisites.

## Reproduction and root cause

The exact Stage 4 owner-scoped command was executed first with Node.js
24.18.0, PostgreSQL 18.4, the governed digest and
`SR_PG_CI_EXECUTION_LABEL=local-run-1`. It passed all eight material files,
with a fresh database/container per file, zero skips, cleanup PASS and material
hash `a4d67c930d024ec3946ca051d3eb335d51765eda4b6ced8774bc77f50b50a298`.

The full Stage 4 prerequisite order and composite then passed `17/17`. No
material test, SQL assertion, migration, schema, shared-state, ordering,
transaction, cleanup or Tenant-isolation failure reproduced.

Historical Docker Desktop logs for the failed campaign show that the schema
suite removed its container successfully at `09:48:59Z`. The owner-scoped
runner then initiated its first image pull; no first owner-scoped container was
created. The historical wrapper exited after roughly 34 seconds, before an
inner Node material test could run. Its stderr contained neither a valid child
test marker nor a retained Docker operation.

Primary classification: **HARNESS / ORCHESTRATION DEFECT**. The owner-scoped
runner replaced every Docker error with a generic message, and the outer
composite retained only a child-test marker. A bootstrap, setup or cleanup
failure therefore became the undifferentiated wrapper exit recorded as
`FV2-041-001`. The historical low-level Docker/registry message was discarded
and cannot be reconstructed safely; the exact proven boundary is the first
owner-scoped image-pull/bootstrap phase, before any material test.

## Contract reconstruction

DEC-049 and ADR-004 remain satisfied:

- every ordinary owner-scoped port requires nominal `tenantId` scope;
- Branch-owned access additionally requires coherent Branch scope;
- repositories expose no global or unscoped fallback;
- the authoritative transaction connection is reused explicitly;
- negative cross-Tenant access remains denied;
- payload identifiers cannot replace trusted owner context;
- fresh disposable databases and independent retained-object checks prevent
  cleanup from hiding state.

PBI-041's Catalog Field Policy, Supplier Source/Version, Bulk Catalog,
Resolution, Memory, pending Brand governance and granular capabilities are
covered by their own Tenant-scoped material suites. The owner-scoped failure
occurred before those product effects or their material assertions. No PBI-041
table, repository, migration or business rule caused this blocker.

## Remediation

The harness now emits a second fail-closed, allowlisted diagnostic identity for
Docker failures. It records only:

- one governed operation (`pull`, `run`, `inspect`, `exec`, `remove` or
  `list`);
- one exact governed material test file;
- bounded exit code, signal and timeout state.

Raw command text, stderr/stdout, credentials, database names, container names,
paths and SQL are not serialized. Forged operations/files, invalid signals and
duplicate markers are rejected. If both child and harness identities appear,
the outer runner fails closed without selecting either. The original child-test
diagnostic remains unchanged.

The container registry changed from a `Set` to a `Map` only to retain the exact
governed test-file identity during cleanup and signal handling. Fresh-container
isolation, cleanup guards, suite inventory, exit handling, test assertions and
Stage 4 requirements were not weakened.

## Focused proof

| Check | Result |
| --- | --- |
| Diagnostic contracts | PASS — 13/13 |
| Simulated `docker pull` failure | PASS — operation/file retained; synthetic stderr absent |
| Exact owner-scoped runner | PASS — 8/8, zero skips, cleanup PASS |
| Stage 4 composite | PASS — 17/17, zero critical skips |
| Persistence/migration/schema architecture contracts | PASS — 42/42 |
| PBI-041 PostgreSQL first run | FAIL — 9/10; 10k publish `30,120.3 ms` vs `30,000 ms` |
| Environmental inspection | No residual test container; host load `4.77`; high concurrent WindowServer/IDE load |
| Single controlled retry | PASS — 10/10; publish `2,181.3 ms`; 75 migrations; second run 0 pending |
| Typecheck | PASS |
| Build | PASS |
| Architecture | PASS |
| Base `verify` | PASS — 938 pass / 0 fail / 30 governed material skips |

The performance threshold and implementation were not changed. The first
PBI-041 run is retained as a transient environmental observation, not replaced
or omitted. The single controlled retry was the only retry and passed with the
same code and threshold.

## Read-only Owner-data guard

A read-only transaction reconfirmed the existing baseline without writes:

- AviCell v3 `INGESTED / COMPLETE`, 744 listings;
- Batch `APPLIED`, 744 decisions (`742 APPLY / 2 EXCLUDE`);
- 744 resolutions (`742 CREATED / 2 EXCLUDED`);
- row-411 item `INACTIVE`, version 3;
- Tenant CatalogItems `787` (`783 ACTIVE / 4 INACTIVE`);
- non-AviCell `Aple` pending group still `1`;
- local migration journal `75`.

## Formal gate result

The subsequent independent review passed 29/29 acceptance criteria,
authorization, isolation, architecture and read-only Owner-data integrity. Its
single `verify:full` campaign passed Stages 0–13, including owner-scoped 8/8,
composite 17/17 and PBI-041 10/10. Publish 10k measured `28,723.2 ms` against
the unchanged `30,000 ms` budget. Cleanup and candidate fingerprint passed.

See
[`FORMAL_REVERIFICATION_FV2_041_001.md`](FORMAL_REVERIFICATION_FV2_041_001.md).
`FV2-041-001` is resolved; no remote promotion occurred in this cycle.
