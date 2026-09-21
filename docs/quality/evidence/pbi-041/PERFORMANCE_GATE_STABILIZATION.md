# PBI-041 — Governed Performance Gate Stabilization

## Scope and result

This Quality Work Unit investigated the unstable PBI-041 10k publish gate
without changing Catalog product behavior, SQL, chunk sizes, PostgreSQL tuning
or thresholds. TL-02 remained frozen as a dependent candidate. The remediation
selects a pinned PostgreSQL 18.4 image native to the Docker server, separates
harness phases from product timing, applies both existing publish budgets and
emits sanitized query-family diagnostics on demand.

## Historical contract audit

| Question | Classification | Finding |
|---|---|---|
| Original requirement | DOCUMENTED FACT | Price List Architecture defines p95 budgets for 1k and candidate 10k capacity. |
| Protected risk | DOCUMENTED FACT | Large atomic publish must remain bounded, set-based and free of ambiguous timeout outcomes. |
| Why 30 seconds | UNSPECIFIED | The accepted architecture fixes 30 s for 10k publish HTTP total but records no hardware-derived rationale for that number. |
| Dataset | DOCUMENTED FACT | Deterministic synthetic 10,000-row FULL list; 10k is candidate capacity, not the Owner 1,500-row material checkpoint. |
| Reference hardware | UNSPECIFIED | The contract says reference profile and requires CPU/RAM to be recorded, but does not name a CPU or memory allocation. |
| PostgreSQL/toolchain | DOCUMENTED FACT | PostgreSQL 18.4, Node 24.18.0 and pnpm 11.15.1 are governed. |
| Provisioning/migrations/process startup | DOCUMENTED FACT for current code; INFERENCE for original intent | The current timer starts immediately before the service call, while the architecture budgets product surfaces rather than environment provisioning. |
| Cold/warm policy | PARTIALLY SPECIFIED | Warm-up is reported separately and p95 requires isolated samples; cache reset semantics were not defined. |
| Percentile protocol | DOCUMENTED FACT | Capacity evidence requires at least ten isolated destructive/publish runs; the recurring FULL gate executes one fail-fast regression sample. |
| Contract type | DOCUMENTED FACT + INFERENCE | It is a Foundation capacity acceptance budget and engineering regression gate. No production SLO environment or live traffic percentile is defined. |

The historical test message called the direct service measurement an HTTP
budget. That label was inaccurate: no HTTP server, transport, controller or
serialization boundary is exercised. The remediation names it a service
budget and does not claim that the original HTTP surface has been measured.

## Current measured boundary

The recurring material test creates and analyzes an exact 10k synthetic list,
then measures:

1. `BulkCatalogService.publish` wall-clock, including currency lookup and the
   complete repository call: ≤30,000 ms;
2. the serializable transaction from `START TRANSACTION` through `COMMIT`:
   ≤15,000 ms;
3. 70 client-observed query calls grouped only by operation/table for optional
   diagnostics.

Container pull/create, health, loopback readiness, first/second migration,
test-process duration and cleanup remain outside those product intervals.

## Controlled reproduction

Campaign baseline: `5a0289f46e0c90bb85b49d4326dc786c2e37d50d`
plus diagnostic-only working-tree instrumentation. Host: Apple `arm64`
Mac17,2, 10 logical CPUs, 24 GiB RAM; Docker 29.6.2, 10 CPUs, 7.75 GiB; Node
24.18.0; pnpm 11.15.1; PostgreSQL 18.4. No run was retried to select a green
result.

| Case | PostgreSQL execution | Publish | DB/query evidence | Result |
|---|---|---:|---|---|
| A — normal fresh runner | pinned `amd64` image emulated on `arm64` | 2,014.6 ms | 1,809.3 ms across 70 queries; 205.0 ms non-query | PASS |
| B1 — ready container, fresh DB and identical fixture | same emulated `amd64` container | 28,742.5 ms | 28,458.7 ms query time; three insert families accounted for 27,681.7 ms | PASS below 30 s, but above the previously unenforced 15 s DB budget |
| B2 — same ready container, second fresh DB and identical fixture | same emulated `amd64` container | 13,247.2 ms | 12,922.2 ms query time; preview also rose to 3,107.2 ms | FAIL on preview budget |
| C — prior normal FULL/isolated observations | emulated `amd64` on this host | 35,464.7 / 34,533.3 ms | failure reproduced both inside FULL and immediately isolated | FAIL; preserved historical input to this Work Unit |
| D — native control, fresh DB and identical fixture | pinned/tag-resolved `arm64` PostgreSQL 18.4 | 1,758.8 ms | 1,515.4 ms query time; 243.2 ms non-query | PASS |
| Remediated normal runner | pinned `arm64` digest selected fail-closed | 1,588.4 ms | transaction 1,588.1 ms; queries 1,374.7 ms; non-query 213.5 ms | PASS |

Harness phases in the remediated normal run were: environment inspection 22.9
ms, image pull 2,155.5 ms, container create 194.6 ms, health 1,309.3 ms,
loopback readiness 10.3 ms, first migration 545.2 ms, second migration 251.7
ms and test process 9,377.6 ms. Total harness time was 13,887.8 ms; none of
those setup phases was added to publish time.

## Variance attribution and regression assessment

The primary proven source is architecture emulation under host contention:

- Docker server and host are `arm64`, while the former fixed image executes
  PostgreSQL as `x86_64`;
- in the slow samples, 98–99% of publish wall time accumulated inside database
  query awaits while non-query work remained 205–325 ms;
- latency moved between unrelated large inserts and, in one sample, the 10k
  decision read/preview, which is inconsistent with one regressed query plan;
- inspection after the slow samples showed the virtualization process at about
  82% CPU and host load averages around 3.2–3.7;
- the native PostgreSQL control and the remediated runner returned to 1.6–1.8
  seconds on the same host and fixture.

Container startup and migrations are excluded by direct timing and each stayed
below one second except initial health/pull. Process startup is likewise outside
the publish timer. No lock competitor exists in the benchmark. Publish remains
one serializable transaction with the same 10,000 NEW outcomes, 10,000 items,
20,000 identifiers, 10,000 price revisions, 10,000 resolutions, 10,000 memory
rows and 10,000 audit events. No Catalog implementation file changed after the
integrated batching remediation `4bcb37c`.

No product/SQL regression was identified. The query-plan hypothesis is not
supported: the delay migrated across multiple insert/read families while the
same schema, indexes, cardinality and code were fast under native execution.
Cache/warmup can contribute to ordinary spread, but it does not explain the
observed architecture-dependent 13–29 second query stalls and is not claimed
as a proven primary cause.

## Governed contract after remediation

- **Boundary:** service publish wall-clock ≤30 s and its DB transaction ≤15 s.
- **Dataset:** exact deterministic 10k FULL synthetic fixture in a fresh DB.
- **Environment:** Node/pnpm pins plus pinned native PostgreSQL 18.4 digest for
  supported Docker server architectures (`amd64`, `arm64`); unknown fails.
- **Cold/warm:** disposable container/base for the recurring gate; image pull,
  readiness and migrations reported separately. Capacity p95 remains a
  separate multi-iteration protocol.
- **Failure:** the first run blocks; no retry, averaging, threshold increase or
  skipped assertion.
- **Diagnostics:** phase timings always identify harness costs; optional
  query-family aggregation records counts/times without SQL or values.
- **Authority:** local FULL retains the blocking recurring sentinel on a native
  supported environment. Existing hosted CI remains the authority for its own
  Linux x64 gates but does not currently execute this PBI-041 material suite.
- **HTTP caveat:** the 30 s architectural HTTP budget remains unchanged, but
  this direct-service sentinel is only a necessary component check and does
  not manufacture HTTP evidence.

The remediation changes only the quality harness, its regression tests and
the clarified performance contract. It does not change product behavior,
database schema, migrations, data, SQL, PostgreSQL settings or deployment.
