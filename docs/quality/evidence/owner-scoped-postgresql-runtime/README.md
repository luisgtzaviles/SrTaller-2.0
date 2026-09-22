# Owner-scoped PostgreSQL runtime stabilization

## Scope

This Quality Work Unit stabilizes the existing eight-file owner-scoped
PostgreSQL campaign under the unchanged 240-second authoritative child-process
budget. It changes verification orchestration only. Product code, SQL,
migrations, assertions, suite inventory and promotion policy are unchanged.

TL-06 remains frozen at
`edd9bb4d73dd2eba41eba5aaf6367d8b2dde7850`; this Work Unit was created from
clean `main` at `81b57994c69ed3584776ff080253f9a772e6425b`.

## Failure and bottleneck evidence

The TL-06 PR ran the owner-scoped stage in 196,933 ms in run-1. Run-2 reached
the unchanged 240,000 ms outer timeout before it could reach TL-06. A local
instrumented baseline on the same serial orchestration completed in 150,495
ms:

| File | Total | Child test | Repeated harness overhead |
|---|---:|---:|---:|
| owner-scoped persistence | 5,698 ms | 573 ms | 5,125 ms |
| repair persistence | 15,486 ms | 11,641 ms | 3,845 ms |
| trusted station | 13,418 ms | 9,491 ms | 3,927 ms |
| user directory | 22,601 ms | 17,668 ms | 4,933 ms |
| access role | 23,256 ms | 19,349 ms | 3,907 ms |
| access PIN | 40,060 ms | 35,013 ms | 5,047 ms |
| access session | 20,300 ms | 15,334 ms | 4,966 ms |
| contextual authorization | 9,676 ms | 4,690 ms | 4,986 ms |

The child processes account for 113,759 ms. The former per-file image pull,
container startup, readiness, environment probes, port inspection, schema
check and container cleanup add 36,736 ms locally and make the campaign pay
eight infrastructure lifecycles. The actual test work remains dominant and
includes the migrations intentionally exercised by each contract. Static
inspection found the following calls, which are not removed: `migrateToLatest`
counts `1/1/1/3/3/1/2/1`, `migrateDown` counts `1/1/1/13/10/13/5/0`, and
`migrateUp` counts `0/0/0/0/0/4/2/0` in canonical suite order.

A bounded-parallelism experiment was rejected. Its first diagnostic campaign
failed closed in `test/repair-persistence-postgresql.test.mjs` with child exit
code 1 and no timeout. It produced no valid campaign summary and was not
retried or treated as promotion evidence. This demonstrates that competing
heavy child processes is not a deterministic remediation on the governed
host.

## Isolation semantics

| Isolation dimension | Required and preserved mechanism |
|---|---|
| Data | A random, empty PostgreSQL database is created for each file and forcibly dropped afterward; absence is queried explicitly. |
| Transaction | Each file retains its own transaction assertions and independent Node test process. No transaction crosses a file boundary. |
| Schema | Each file starts from a new database, executes its existing migration lifecycle, must leave no material tables, and is then dropped. |
| Process | Every file still runs in a separate `node --test --test-concurrency=1` child with the scoped `--no-maglev` mitigation and 150-second child timeout. |
| Container | One pinned PostgreSQL 18.4 container is shared only as the disposable server runtime for the campaign. Container-per-file is not required for data, transaction, schema or process isolation. |

The campaign uses one control database only for database lifecycle commands.
Test files receive a unique database name. The runner is serial, alternates
canonical and reverse order in diagnostic repetitions, compares canonicalized
material results and fails on the first child, Docker, schema or cleanup
failure. Signal cleanup and the outer workflow's `always()` cleanup remain.

## Selected remediation

The smallest deterministic change is one governed PostgreSQL container per
owner-scoped campaign plus one fresh database per test file:

1. pull the pinned image once;
2. start, inspect and verify PostgreSQL 18.4/UTC/UTF8 once;
3. for each of the exact eight files, create a random database, run its
   unchanged isolated child, assert no retained schema, force-drop the database
   and verify absence;
4. remove the campaign container and verify cleanup;
5. emit sanitized campaign and per-file phase timings outside the material
   comparison hash.

The design does not pre-migrate or clone a template because migration
up/down/reapply is material behavior in several suites. It removes only the
duplicated server lifecycle.

## Diagnostic results

All requested diagnostic attempts are preserved here; there was no retry to
select a green result.

| Attempt | Order/design | Result | Campaign |
|---|---|---|---:|
| pre-fix baseline | serial, container + database per file | PASS 8/8 | 150,495 ms |
| rejected experiment | parallelism 2 | FAIL at repair child, exit 1, timeout false | no valid summary |
| corrected 1 | serial fresh DB, canonical | PASS 8/8 | 123,654 ms |
| corrected 2 | serial fresh DB, reverse | PASS 8/8 | 126,212 ms |
| corrected 3 | serial fresh DB, canonical | PASS 8/8 | 120,300 ms |
| normal composite | serial fresh DB, canonical | PASS 8/8; composite 17/17 | 119,883 ms; wrapper 124,617 ms |

Corrected per-file totals across the three diagnostic runs:

| File | Run 1 | Run 2 | Run 3 |
|---|---:|---:|---:|
| owner-scoped persistence | 1,428 ms | 1,395 ms | 1,359 ms |
| repair persistence | 13,108 ms | 13,034 ms | 13,058 ms |
| trusted station | 10,887 ms | 11,095 ms | 10,851 ms |
| user directory | 19,764 ms | 19,652 ms | 19,748 ms |
| access role | 20,212 ms | 19,830 ms | 19,140 ms |
| access PIN | 36,963 ms | 37,741 ms | 35,666 ms |
| access session | 15,634 ms | 17,318 ms | 15,055 ms |
| contextual authorization | 5,657 ms | 6,147 ms | 5,423 ms |

Shared infrastructure for the three-run diagnostic was: image pull 1,038 ms,
container start 150 ms, readiness 2,654 ms, environment probes 755 ms and
container cleanup 228 ms. Per-file database create/drop/schema inspection is
included in each total. The worst corrected campaign is 126,212 ms, leaving
113,788 ms of the unchanged 240,000 ms budget.

## First authoritative remote finding

The first remote candidate run on Linux x64 preserved the red result instead
of treating one successful leg as sufficient evidence. Run 1 executed all
eight files and passed in 220,138 ms, leaving only 19,862 ms of the fixed
budget. Run 2 exhausted the unchanged 240,000 ms child-process timeout before
producing a campaign summary. Comparison was therefore unavailable and the
authoritative promotion gate failed.

The successful leg showed bounded database create/drop overhead while
CPU-heavy child work expanded on the smaller host. The PIN material test alone
took 72,869 ms and permitted two real Argon2 operations to contend even though
the governed KDF profile itself uses parallelism 4. The PostgreSQL contract
needs concurrent commands, credential semantics and real Argon2 material; it
does not require two KDF derivations to compete for the same limited runner CPU
at once. The focused test now admits one real Argon2 operation at a time while
retaining the same KDF profile, queue, commands, assertions, material
PostgreSQL behavior and failure propagation. No KDF result is cached or
substituted.

The focused material campaign with this scheduler setting passed all 8 files
locally in 118,554 ms; the PIN file passed in 36,027 ms. This local result
validates behavior but does not substitute for a fresh two-leg authoritative
run on the constrained remote host.

## Regression protection

The focused contract fixes the exact eight-file inventory and asserts:

- serial fresh-database execution and canonical result ordering;
- one campaign container and one image pull;
- database create, force-drop and explicit absence check per file;
- canonical/reverse diagnostic order;
- child and Docker failure propagation through sanitized identities;
- signal/finally cleanup;
- unchanged 240,000 ms outer budget and 150,000 ms per-child budget;
- no parallel `Promise.allSettled`, retry or suite removal.

The normal five-suite PostgreSQL composite passes 17/17 with zero skips and
all migration/journal/lock/drift checks passing. Full verification remains the
promotion authority for the final exact commit.

## Promotion verification

The governed local `verify:full` campaign passed Stages 0–17 with cleanup and
final fingerprint checks passing. Its material PostgreSQL Stage 4 completed in
143,909 ms: the owner-scoped campaign passed 8/8 in 113,318 ms and the complete
five-suite composite passed 17/17 with zero critical skips. PBI-039, PBI-040,
PBI-041, TL-02, TL-03, TL-04, TL-05, Preview-like runtime and compiled backend
and UI smokes all passed against 84 migrations with zero pending on rerun where
applicable. The only emitted warning was the already accepted Vite main-chunk
size warning.
