# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: QUALITY — Diagnose Owner-Scoped CI Runtime Variability
iteration: 1 - Authorized Start
type: QUALITY
risk: SENSITIVE
shadow_risk: SENSITIVE
branch: chore/quality-owner-scoped-ci-variability
base_sha: 9bd8bfcf106ba69be66202eedee115a2eea19739
status: ACTIVE
closure_mode: DERIVED
last_updated: 2026-09-23
-->

Current PBI: NONE

## Objective

Diagnose the exact cause and historical pattern of owner-scoped PostgreSQL CI runtime variability without changing TL-07, gates, timeouts, coverage, product, or infrastructure.

## Why

TL-07 attempt 1 exhausted the unchanged owner-scoped 240-second budget, while
the same exact PR head later produced both a fast leg and a near-budget leg.
The Owner requires a cause classification before deciding whether TL-07 may
resume promotion.

## In Scope

- Recover the exact observable identity of TL-07 CI attempt 1.
- Compare both TL-07 attempts by suite and phase where evidence exists.
- Audit the exact 240-second measurement boundary against its accepted contract.
- Compare PR #70, PR #71, their exact-main runs and TL-07 evidence.
- Classify the runtime variability before proposing any remediation.

## Out of Scope

- Product, TL-07, PostgreSQL, migrations, tests, timeout, inventory, retries,
  parallelism, CI gates and infrastructure changes.
- Push, PR, merge, deploy and TL-08.
- A new benchmark/calibration campaign.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`QUALITY_STRATEGY.md`](../quality/QUALITY_STRATEGY.md)
- [Owner-scoped runtime stabilization](../quality/evidence/owner-scoped-postgresql-runtime/README.md)
- [Owner-scoped child diagnostics](../quality/evidence/owner-scoped-child-diagnostics/README.md)

## Risks

- A successful rerun must not erase the failed first attempt.
- Total campaign timing alone could incorrectly blame one child or TL-07.
- Hosted-runner variability must not be converted into an invented product fix.
- GitHub logs may not expose the active inner child after an outer timeout.

## Plan

- [x] Preserve TL-07 branch, exact HEAD and Draft PR #72 unchanged.
- [x] Recover attempt-1 stage, timeout boundary, cleanup and retained diagnostics.
- [x] Compare both TL-07 attempts by file and phase where materially available.
- [x] Audit the complete 240-second owner-scoped wrapper boundary.
- [x] Build the authoritative PR #70/#71/TL-07 runtime series.
- [x] Classify cause and decide whether repository remediation is justified.
- [ ] Await Owner decision on TL-07 promotion and this Quality handoff.

## Current

The review classifies the observed behavior as `CI_HOST_RESOURCE_VARIABILITY`.
The same-head slow leg expands all material child processes proportionally;
no TL-07, PostgreSQL, migration, assertion, cleanup or specific-suite defect is
shown. No runtime remediation was implemented.

## Next

Owner decides whether the preserved historical failure and narrow successful
margin are acceptable for TL-07 promotion. A separate bounded progress-marker
change is optional if exact inner-suite identity on future outer timeouts is
required; it is not a runtime fix.

## Blockers

TL-07 remote promotion is paused by explicit Owner direction pending this
review. There is no proven repository-controlled runtime defect to remediate.

## Important Discoveries

- Attempt 1 `run-1` failed in `owner-scoped-adapters` at the outer 240,000 ms
  timeout; cleanup passed and no PostgreSQL/assertion failure was emitted.
- The external kill occurred before the owner-scoped parent could return its
  structured child marker, so the exact inner suite/ordinal is not recoverable
  from that historical log.
- The accepted budget covers the complete owner-scoped wrapper. The
  `campaign=232240 ms` value excludes setup/finalization; the enforced wrapper
  was 234,565 ms and had 5,435 ms of margin.
- In TL-07 attempt 2, the slow leg was 41% slower overall and the principal
  material suites were each approximately 40–43% slower than the fast leg.
- Access PIN is the largest absolute contributor but scales proportionally; it
  is not a unique regression.
- PR #71 exact-main also required a second attempt after the same outer timeout,
  before TL-07 was present. Runtime is not worsening monotonically with TL-07.
- Runner image/region do not correlate with the observed fast and slow legs.
- The comparative report is in
  [`owner-scoped-ci-runtime-variability`](../quality/evidence/owner-scoped-ci-runtime-variability/README.md).
- `apps/dev-preview-web/src/.DS_Store` remains unrelated and untracked.

## Focused Verification

- [x] Exact GitHub attempt-1 and attempt-2 logs inspected without rerun.
- [x] Successful per-suite timings compared for the same exact TL-07 HEAD.
- [x] PR #70/#71 candidate and exact-main history inspected.
- [x] Current runner code and accepted Quality contract inspected.
- [x] Documentation links, consistency, Work Unit checker and `git diff --check`.

## Promotion Gates

- The Quality review remains `ACTIVE` pending Owner disposition.
- No timeout, retry, suite, assertion or gate change is proposed.
- TL-07 remains a dependent, frozen Draft candidate and is not merged.

## Remote Actions / Authorization

- Read-only GitHub/CI inspection was authorized and completed.
- No push, new PR, merge, deploy or CI rerun is authorized for this Quality
  Work Unit.
- PR #72 remains open and Draft; TL-07 was not modified or pushed.

## Handoff Notes

- Quality branch was created from clean integrated `main` at
  `9bd8bfcf106ba69be66202eedee115a2eea19739`.
- Preserve TL-07 branch and PR #72 at
  `1e5335734920de8a0f47a929120dcdce0c4ea3c9`.
- Preserve `apps/dev-preview-web/src/.DS_Store` untracked.
- Attempt 1 remains historical authoritative evidence; attempt 2 does not
  erase it.

## Closure Predicate

The Quality diagnosis is complete when the historical attempts, exact budget
boundary, same-head suite variance and authoritative runtime series are
documented; one cause class is selected without changing TL-07 or weakening
the gate; proportional documentation checks pass; and the Owner decides the
disposition of TL-07 and this Quality branch.
