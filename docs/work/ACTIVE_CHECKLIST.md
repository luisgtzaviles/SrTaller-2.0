# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: QUALITY — Stabilize Owner-Scoped PostgreSQL Verification Runtime
iteration: 1 - Authorized Start
type: QUALITY
risk: SENSITIVE
shadow_risk: SENSITIVE
branch: fix/owner-scoped-postgresql-runtime
base_sha: 81b57994c69ed3584776ff080253f9a772e6425b
status: ACTIVE
closure_mode: DERIVED
last_updated: 2026-09-22
-->

Current PBI: NONE

Dependent candidate preserved: TL-06 at
`edd9bb4d73dd2eba41eba5aaf6367d8b2dde7850`.

## Objective

Make all eight isolated owner-scoped PostgreSQL verification suites complete deterministically within the existing 240-second authoritative harness budget without weakening coverage, isolation or fail-closed behavior.

## Why

To execute one authorized objective with a transferable repository-native handoff.

## In Scope

- Measure the exact owner-scoped PostgreSQL harness phases and all eight suites.
- Define the isolation semantics actually required by the accepted contracts.
- Remove proven duplicated orchestration cost without changing product behavior.
- Preserve real PostgreSQL 18.4, all assertions, all suites and fail-closed behavior.
- Add regression protection for suite inventory, isolation, failure attribution,
  cleanup, authoritative migrations and the unchanged 240-second budget.
- Demonstrate deterministic focused runs and the canonical full gate locally.

## Out of Scope

- TL-06 product behavior and its preserved branch/candidate.
- Timeout increases, retries-to-green, averaging, skips or reduced assertions.
- TL-07, merge, deploy, GitHub policy and unrelated cleanup.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`DEC-051`](../decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md)
- [`DEC-063`](../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md)
- [`PBI-023 PostgreSQL suite matrix`](../architecture-readiness/pbi-023/postgresql-ci/SUITE_MATRIX.md)
- [`PBI-025 CI flakiness incident`](../quality/evidence/pbi-025/CI_FLAKINESS_INCIDENT.md)

## Risks

- Shared infrastructure could accidentally leak state or make test order material.
- Parallel execution could trade elapsed time for nondeterministic contention.
- A timeout increase or retry would conceal rather than remediate the defect.
- Harness changes could weaken failure attribution or cleanup evidence.

## Plan

- [x] Preserve TL-06 local/remote HEAD and leave PR #69 unmerged.
- [x] Start this Quality Work Unit from clean, synchronized `main`.
- [x] Instrument and measure provisioning, migration, execution and cleanup.
- [x] Audit data, transaction, schema, process and container isolation semantics.
- [x] Quantify duplicated invariant work across all eight suites.
- [x] Select and implement the smallest deterministic orchestration fix.
- [x] Add regression protection without changing the 240-second budget.
- [x] Execute repeated focused diagnostics and record every attempt.
- [x] Run architecture/persistence/migration checks and `verify:full`.
- [x] Reconcile final evidence and freeze a promotion candidate.

## Progress

9 / 10 blocks complete.

## Current

The first exact-HEAD remote run proved the shared-container isolation design
but exposed insufficient Linux x64 margin: run-1 passed the owner-scoped stage
in 220,138 ms and run-2 exhausted the fixed 240-second timeout. Remediation is
active on the same Quality branch; TL-06 remains frozen at its reviewed
candidate.

## Next

Revalidate the single-active-Argon2 test profile locally, freeze a new exact
candidate, push normally to the existing Draft PR and require fresh
authoritative CI in both legs.

## Blockers

Remote promotion remains blocked until the remediated exact HEAD completes
run-1, run-2, comparison and the Authoritative promotion gate. TL-06 promotion
remains externally blocked until this Work Unit is integrated and TL-06 is
reconciled from the resulting main.

## Important Discoveries

- Two first-attempt PR runs timed out at the fixed 240-second child-process
  boundary while executing `owner-scoped-adapters`; run-1 completed the same
  stage and TL-06 passed 3/3.
- The current harness provisions a fresh container/database and reapplies the
  full migration chain independently for each of eight files, serially.
- The instrumented baseline passed in 150,495 ms: 113,759 ms in the eight
  child processes plus 36,736 ms of repeated per-file harness lifecycle.
- A parallelism-2 experiment failed closed in the repair suite and was
  rejected; it is not retried or used as green evidence.
- One disposable PostgreSQL 18.4 campaign container with a fresh database per
  file preserves data/schema/transaction/process isolation and removes only
  duplicated server lifecycle.
- Corrected diagnostics passed 8/8 in 123,654 ms, 126,212 ms (reverse order)
  and 120,300 ms; material comparison and cleanup passed.
- The normal PostgreSQL composite passed 17/17; owner-scoped execution was
  119,883 ms and remained inside the unchanged 240-second budget.
- First authoritative remote CI preserved a material red result: run-1 passed
  all eight files in 220,138 ms; run-2 exhausted the unchanged 240-second
  timeout, so comparison was unavailable and the promotion gate failed.
- Successful-leg timings localize the remaining variance to CPU-heavy child
  work rather than database lifecycle. The PIN material test now serializes
  real Argon2 work at one active operation without changing its production KDF
  profile, assertions, command concurrency or PostgreSQL semantics.

## Focused Verification

- [x] All eight owner-scoped suites selected and materially executed.
- [x] Per-phase and per-suite timing evidence.
- [x] Isolation/reset and order-independence regressions.
- [x] Failure propagation and deterministic cleanup regressions.
- [x] Migration/schema authority and 240-second budget static checks.
- [x] Relevant architecture/persistence tests, typecheck and `git diff --check`.
- [~] Canonical `verify:full` must be rerun on the remediated exact HEAD.

## Promotion Gates

- [x] Local focused verification PASS.
- [x] Local governed `verify` PASS.
- [~] Local governed `verify:full` rerun on remediation HEAD.
- [~] Remote PR/CI/review — PR #70 open; first authoritative run failed closed.
- [ ] Merge/exact-main closure — not authorized.

## Remote Actions / Authorization

- Push and one Draft PR are authorized for this Quality Work Unit. PR #70 is
  open; merge and deploy remain unauthorized.

## Handoff Notes

- Branch creation/switching is explicit and occurred before this command.
- Preserve `feature/tl-06-admin-users-roles-readiness` and remote PR #69 at
  `edd9bb4d73dd2eba41eba5aaf6367d8b2dde7850` without product changes.
- Preserve `apps/dev-preview-web/src/.DS_Store` as unrelated Owner material.

## Closure Predicate

All eight owner-scoped PostgreSQL suites remain materially selected, isolated,
fail-closed and clean; the unchanged 240-second authoritative budget is met
with reasonable margin in diagnostic repetitions; focused checks and
`verify:full` pass on one exact clean HEAD; no product behavior changes; the
Work Unit is `READY_FOR_PROMOTION` and remote actions remain separately gated.
