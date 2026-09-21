# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: QUALITY — Stabilize PBI-041 Governed Performance Gate
iteration: 2 - Native Performance Gate Remediation
type: QUALITY
risk: HIGH
shadow_risk: SENSITIVE
branch: fix/pbi-041-performance-gate
base_sha: 5a0289f46e0c90bb85b49d4326dc786c2e37d50d
status: READY_FOR_PROMOTION
closure_mode: DERIVED
last_updated: 2026-09-21
-->

## Identity

- **Milestone:** Tenant Lifecycle MVP promotion dependency.
- **Work Unit:** QUALITY — Stabilize PBI-041 Governed Performance Gate.
- **Sprint:** none.
- **Current PBI:** `NONE`; this is a quality remediation dependency.
Current PBI: NONE
- **Status:** `READY_FOR_PROMOTION`.
- **Progress:** `9 / 9` diagnostic/remediation blocks complete.
- **Current work:** local Quality remediation complete and stopped before
  remote promotion.
- **Next block:** push and Draft PR only with separate Owner authorization.
- **Blockers:** none for diagnosis; TL-02 promotion remains externally blocked.
- **Last updated:** 2026-09-21, America/Hermosillo.

## Objective

Make PBI-041's governed performance gate meaningful, reproducible and
deterministic without assuming the threshold or product implementation is
wrong.

## Why

The same 10k publish path has measured from roughly two seconds to more than
35 seconds. TL-02 is complete but cannot be promoted while FULL contains this
unexplained blocking variance.

## In Scope

- Audit the origin and meaning of the 30-second PBI-041 threshold.
- Instrument the real benchmark without distorting the product operation.
- Run a bounded, controlled diagnostic campaign.
- Attribute variance and check for a genuine product/database regression.
- Define and implement only the smallest evidence-supported quality fix.
- Protect the measurement boundary with regression tests.

## Out of Scope

- Arbitrarily raising, removing, skipping or retrying the performance gate.
- Speculative SQL/PostgreSQL/product optimization.
- TL-02 product changes, TL-03, remote writes, PR, merge or deploy.
- CI or infrastructure changes made merely to obtain GREEN.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`BRANCH_POLICY.md`](../delivery/BRANCH_POLICY.md)
- [`QUALITY_STRATEGY.md`](../quality/QUALITY_STRATEGY.md)
- [`PBI-041`](../backlog/pbis/PBI-041.md)
- [`PBI-041 evidence index`](../quality/evidence/pbi-041/README.md)

## Risks

- Conflating infrastructure latency with product execution time.
- Replacing a meaningful regression gate with a host-dependent benchmark.
- Selecting the fastest run instead of explaining the distribution.
- Changing product or thresholds before proving the cause.
- Losing TL-02 traceability while resolving its promotion dependency.

## Plan

- [x] Freeze TL-02 on its preserved branch without rewriting history.
- [x] Audit historical PBI-041 performance intent and evidence.
- [x] Instrument the current benchmark phases.
- [x] Execute bounded controlled reproduction.
- [x] Attribute variance with measured evidence.
- [x] Assess product/database regression.
- [x] Define the authoritative performance contract.
- [x] Implement and regression-test the minimum quality remediation.
- [x] Validate and prepare the Quality Work Unit for Owner review.

## Current

The performance runner now selects a pinned native PostgreSQL 18.4 image,
separates harness phases from product timing and enforces both the existing
15-second DB transaction and 30-second service ceilings.

## Next

Await explicit Owner authorization for remote promotion of this Quality Work
Unit. TL-02 remains frozen until the remediation is integrated.

## Blockers

None for the authorized diagnostic work. TL-02 cannot resume promotion until
this predecessor is integrated and its branch is reconciled from new `main`.

## Important Discoveries

- Branch policy explicitly permits freezing an unintegrated branch while a
  preceding remediation is completed, then reconciling it from new `main`.
- TL-02 is preserved at `bda3a70d63dcc7c37e15ec2c8c419941c9731790`.
- The PBI-041 publish measurement has varied materially both inside FULL and
  in isolation; retrying until green is not evidence.
- The historical contract defines a 30-second HTTP budget and a 15-second DB
  transaction budget; the current material test calls the service directly and
  previously enforced only 30 seconds.
- Controlled samples on the same Apple `arm64` host measured emulated `amd64`
  PostgreSQL publish at 2.0, 28.7 and 13.2 seconds; slow time accumulated in DB
  query awaits, not provisioning or application work.
- A native PostgreSQL 18.4 control measured 1.8 seconds and the remediated
  governed runner measured 1.6 seconds with a 1.6-second transaction.
- No Catalog product/SQL regression was identified; the integrated publish
  implementation is unchanged from the known batching remediation.

## Focused Verification

- [x] Historical contract audit complete.
- [x] Instrumentation regression tests PASS — 4/4.
- [x] Controlled campaign complete with environment and phase timings.
- [x] Product regression assessment complete.
- [x] Focused quality checks PASS — typecheck, 36 focused contracts,
  architecture, Work Unit, Markdown links and secret scan.
- [x] Remediated PBI-041 PostgreSQL material suite PASS — 10/10, 75
  migrations, second run 0 pending, cleanup PASS.
- [x] `git diff --check` PASS.

## Promotion Gates

- No promotion gate may be weakened.
- A product change requires a proven product regression and renewed scope.
- Remote promotion requires separate Owner authorization after local review.

## Remote Actions / Authorization

- No push, PR, merge, deploy or remote/infrastructure mutation is authorized.

## Handoff Notes

- Preserve `apps/dev-preview-web/src/.DS_Store` untracked.
- Do not modify or push the frozen TL-02 branch.
- Do not start TL-03.

## Closure Predicate

This Quality Work Unit closes only after its exact candidate is merged by an
authorized PR and required exact-main CI is GREEN. No deployment is required
for this harness-only change. Reconciliation and revalidation of frozen TL-02
remain a separate, later authorized step.
