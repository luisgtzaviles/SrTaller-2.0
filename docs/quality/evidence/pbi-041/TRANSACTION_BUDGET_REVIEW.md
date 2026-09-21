# PBI-041 — Transaction Performance Budget Review

## Scope and conclusion

This Quality Work Unit answered one question without changing product code,
SQL, indexes, thresholds or infrastructure: whether the recurring PBI-041
PostgreSQL transaction limit of 15 seconds is justified, correctly measured and
independently valuable as a hard promotion gate.

The transaction boundary is correctly measured and protects a conceptually
useful risk: how long the atomic publish holds transaction resources and locks.
The specific 15-second value is a historical accepted capacity target, but the
repository contains no measurement-derived rationale for that number and the
available observations do not support enforcing it as a fail-fast, one-sample
promotion gate on this local reference environment.

**Classification:** `JUSTIFIED_BUT_THRESHOLD_UNSUPPORTED`.

The Owner subsequently accepted the recommendation below: 30 seconds remains
the blocking single-run publish limit, transaction timing remains mandatory,
and 15 seconds remains the historical p95 capacity target rather than an
every-run maximum. The authorized remediation emits an explicit capacity
diagnostic for an individual miss and does not treat that sample as p95.

## Origin and authority

| Event | Date | Evidence | Finding |
|---|---|---|---|
| Numeric 15-second target introduced | 2026-09-13 | `0051c846f73880cb403e2e9f5dd243ab878edcd2`, Price List Architecture and PBI-041 readiness | The accepted 1k/10k table introduced DB transaction budgets of 5/15 seconds before implementation. |
| Owner decision represented in that readiness | 2026-09-13 | `OD-BI-007` in the bulk-import audit | Owner approved 10,000 rows as candidate capacity subject to benchmark. The decision table does not state or derive 15 seconds specifically. |
| Readiness/test contract | 2026-09-13 | Definition of Ready and Test Strategy | Budgets were marked fixed; the strategy required at least ten isolated destructive/publish runs for p95 evidence and an Owner-reviewed change after a miss. |
| Runtime publish assertion before Quality remediation | through 2026-09-20 | material PBI-041 test before `6f72c569` | Only the 30-second direct-service publish sentinel was enforced. The documented 15-second transaction target was not measured or asserted. |
| 15-second hard assertion introduced | 2026-09-21 | `6f72c56940a5c4be98c439626781f35b81fe6609` | The Quality remediation added BEGIN-to-COMMIT instrumentation and turned the historical target into a blocking one-sample assertion. |

The best authority classification for the number is
`HISTORICAL_REQUIREMENT`: it exists in accepted Architecture/PBI readiness.
Its conversion into a single-run hard promotion gate was an
`IMPLEMENTATION_CHOICE` of the Quality remediation. Repository evidence does
not show an explicit Owner decision selecting 15 seconds specifically or an
empirical derivation of that value.

## Historical PBI-041 contract

The accepted historical contract required both:

- publish HTTP total: at most 8 seconds for 1,000 rows and 30 seconds for the
  10,000-row candidate target;
- publish database transaction: at most 5 seconds for 1,000 rows and 15 seconds
  for the 10,000-row candidate target.

Therefore the historical answer is **C — both**. These were described as p95
capacity budgets on a reference profile, not as evidence that one arbitrary
local sample should fail promotion. The test strategy requires at least ten
isolated destructive/publish observations and records CPU, RAM, PostgreSQL,
dataset, indexes, candidate and raw timings. The recurring FULL sentinel uses
one sample and is not that p95 campaign.

## Measurement boundaries

### Publish duration

The recurring fixture starts wall-clock measurement immediately before
`BulkCatalogService.publish` and stops after it resolves. It includes the
service-level currency lookup/fingerprint preparation and the complete
repository publish call. In this test the currency reader is an immediate
synthetic value, so work before the repository transaction is negligible. It
does not include container provisioning, health, migrations, analysis or
cleanup, and it is not an HTTP measurement.

### Transaction duration

The diagnostic wraps the PostgreSQL client and timestamps the observed
`START TRANSACTION` call through resolution of `COMMIT` or `ROLLBACK`. It
includes database query waits and application processing performed between
those calls. Query-family diagnostics record only operation/table labels and
durations, never SQL values or credentials.

### Why the measurements are effectively identical

The benchmark's `publish` path performs almost all material work inside one
serializable repository transaction. Its synthetic currency reader and request
fingerprint add less than one millisecond outside that boundary. In the bounded
campaign, publish minus transaction was 0.3–0.5 ms. Consequently the current
15-second assertion is operationally a stricter threshold over almost the same
work measured by the 30-second publish sentinel.

The transaction boundary remains conceptually meaningful for lock/resource
occupancy, but this fixture does not separately demonstrate contention harm,
timeout risk or a failure mode at 15 seconds.

## Evidence quality before this review

The previous Quality remediation usefully proved that x86_64 PostgreSQL
emulation on an arm64 Docker host produced large DB-wait variance and that the
runner must select a pinned native image. It also separated setup phases from
product timing and added safe query-family diagnostics.

Its native evidence was limited:

| Observation | Publish | Transaction/query evidence | Notes |
|---|---:|---:|---|
| Native control | 1,758.8 ms | 1,515.4 ms query time | Fresh DB; one observation. |
| Corrected native runner | 1,588.4 ms | 1,588.1 ms transaction | Fresh DB; one observation. |
| Authoritative local FULL reported in PR #62 | 1,491.6 ms | not reported separately | One promotion observation. |

Those samples demonstrate a fast path and validate native selection. They do
not constitute the ten-run p95 protocol and do not derive a 15-second cutoff.
The same evidence document explicitly records unspecified reference hardware,
partially specified cold/warm policy and no hardware-derived rationale even for
the 30-second limit. Hosted Linux CI does not execute the PBI-041 material
suite, so its GREEN result adds no transaction-duration sample.

## Bounded diagnostic campaign

This campaign is diagnostic only, not promotion evidence. It used current
`main` product code on an Apple arm64 host, Docker server arm64 with 10 CPU and
approximately 7.75 GiB RAM, Node 24.18.0, PostgreSQL 18.4 native pinned digest,
the deterministic 10,000-row FULL fixture and a fresh disposable database for
every run. All three sequential observations are retained.

| Run | Host load before run | Publish | Transaction | Query time | Result |
|---|---:|---:|---:|---:|---|
| 1 | 3.85 initial profile | 1,475.5 ms | 1,475.1 ms | 1,268.4 ms | both gates PASS |
| 2 | 4.48 | 18,404.2 ms | 18,403.9 ms | 18,155.8 ms | publish PASS; transaction FAIL |
| 3 | 4.55 | 1,456.9 ms | 1,456.4 ms | 1,238.2 ms | both gates PASS |

The pre-existing local PostgreSQL container remained between approximately
2.1% and 2.6% CPU and was not modified. Run 2 concentrated delay in the same
large insert families previously observed under slow environments:
reconciliation memory, listing resolutions and identifiers. Non-query work
remained 248.3 ms. Runs 1 and 3 returned to approximately 1.46 seconds without
code, schema, fixture, image, threshold or host configuration changes.

The earlier reconciled TL-02 observation is consistent with this variance:
publish 20,534.0 ms, transaction 20,533.8 ms, query time 20,321.8 ms and
non-query time 212.2 ms. TL-02 changes no Catalog production path; its only
PBI-041 runner reconciliation changes the expected migration count from 75 to
76.

## Assessment

- Correct measurement: **yes** for BEGIN-to-COMMIT client-observed duration.
- Independent conceptual value: **yes**, because transaction occupancy and
  lock duration are narrower risks than complete request latency.
- Independent value in the current recurring fixture: **weak**; transaction
  and publish measure effectively the same work.
- Evidence for 15 seconds specifically: **insufficient**.
- Product regression: **not demonstrated**. A single native run moved from
  about 1.46 seconds to 18.40 seconds and back with unchanged product/schema.
- Healthy/unhealthy separator: **not demonstrated**. The 15-second boundary
  divides observations from the same environment and deterministic fixture
  without an accompanying correctness, contention or timeout failure.

## Recommended governed contract

Accepted Owner decision:

1. keep the existing 30-second service publish sentinel as the blocking
   recurring promotion gate;
2. keep BEGIN-to-COMMIT transaction measurement mandatory and visible, but
   make the 15-second value diagnostic rather than blocking in the one-sample
   recurring gate;
3. retain 15 seconds as the historical candidate-capacity target until a
   controlled native reference campaign either validates or replaces it;
4. require the existing protocol of at least ten isolated publish runs, with
   host/resources and raw timings, before approving any new hard transaction
   threshold;
5. preserve fail-closed native architecture selection and never use retries or
   averaging to turn a failed promotion sample green.

The separately authorized harness-contract remediation must:

- update Price List Architecture and PBI-041 Test Strategy to distinguish the
  p95 capacity target from the recurring one-sample sentinel;
- change the transaction assertion in the PBI-041 material test into mandatory
  diagnostic evidence while retaining the 30-second blocking assertion;
- update the stabilization evidence and focused regression contract;
- run focused diagnostics and the required promotion verification on the new
  exact candidate.

TL-02 remains paused until this remediation is integrated into `main`; only
then may its branch reconcile current `main` and repeat focused and full
verification under separate authority.

## Authorized remediation proof

The corrected recurring harness retained the unchanged deterministic 10k
publish path and produced a material observation of 21,424.3 ms publish and
21,423.9 ms transaction. Publish remained below its 30-second hard limit; the
transaction exceeded the historical 15-second p95 target and emitted
`TRANSACTION_CAPACITY_TARGET_EXCEEDED` with only sanitized target, observation
and enforcement fields. PBI-041 Stage 7 and the complete full verification
passed without retries, averaging, product changes or threshold changes.
