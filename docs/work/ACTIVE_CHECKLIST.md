# Active Work Unit Checklist

Current PBI: NONE

<!-- WORK_UNIT_METADATA
work_unit: TL-07 — Station Inventory + Enrollment Authority
iteration: 3 - Post-Quality reconciliation and final verification
type: PRODUCT
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: feature/tl-07-station-inventory-enrollment-readiness
base_sha: 74fe2b5fd5b66ee48428953f3e027f2815c839ca
status: ACTIVE
closure_mode: DERIVED
last_updated: 2026-09-22
-->

## Objective

Complete Tenant-administered Station inventory and enrollment authority while
preserving the trusted Station/PIN boundary and reserving redemption for TL-08.

## Why

Materialize the approved TL-07 authority, lifecycle and administrative UX with
fail-closed tenancy and trust semantics.

## In Scope

- Station Inventory V1 reads and rename.
- Enrollment issue/cancel with immutable Branch/name authority, ten-minute TTL,
  one-time secret presentation and digest-only persistence.
- Unlink, initiate relink and terminal revoke with trust/session invalidation.
- Branch-scoped Admin authorization, tenant isolation, audit and concurrency.
- Admin HTTP/UI `Dispositivos`, QR/manual-code presentation and Level-2 UX.
- Additive migration/backfill for the exact approved legacy Station mapping.
- Reconciliation with the integrated bounded child-diagnostics Quality fix.

## Out of Scope

- Device redemption, activation or operational handoff owned by TL-08.
- Station reactivation, physical delete, generic lifecycle patch, MDM,
  fingerprint authority and invented telemetry.
- Push, PR, TL-07 merge, deploy, infrastructure and unrelated cleanup.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`QUALITY_STRATEGY.md`](../quality/QUALITY_STRATEGY.md)
- [`DEFINITION_OF_DONE.md`](../delivery/DEFINITION_OF_DONE.md)

## Risks

- Station trust changes must immediately deny PIN login and existing
  Operational Sessions without crossing persistence ownership boundaries.
- Admin authorization needs a branch-scoped control-plane path consistent with
  TL-06 and must remain fail-closed across tenants.
- Enrollment authority must be useful to TL-08 without exposing a production
  redemption endpoint in TL-07.
- The owner-scoped campaign must stay serial, preserve eight suites and remain
  within its unchanged 240-second outer budget.

## Plan

- [x] Preserve the original TL-07 history and checkpoint `8b75ba6724257044896b4c4ae26c09ef616c4d42`.
- [x] Complete the approved Station inventory, enrollment authority and lifecycle implementation.
- [x] Complete Admin HTTP/UI, authorization, audit and responsive product proof.
- [x] Fix the historical Access PIN schema fixture incompatibility.
- [x] Fix the historical Access Session schema fixture incompatibility.
- [x] Classify the later contextual-authorization campaign failure as unresolved environmental/Quality evidence.
- [x] Preserve TL-07 while bounded isolated diagnosis could not reproduce that failure.
- [x] Integrate and close the Quality dependency for bounded sanitized child diagnostics.
- [~] Reconcile current `main` into the preserved TL-07 branch by ordinary merge.
- [ ] Run focused continuity verification on the combined state.
- [ ] Run exactly one canonical `verify:full` on the reconciled exact candidate.
- [ ] Reconcile evidence/checklist and freeze a promotion-ready local candidate.

## Current

TL-07 has resumed from its preserved checkpoint. Current authoritative `main`
is being merged normally into the same branch so TL-07 consumes the closed
owner-scoped child-diagnostics Quality dependency without rewriting history.

## Next

Audit the combined state, run focused continuity checks and, only if they pass,
run one canonical `verify:full` on the exact reconciled candidate.

## Blockers

No external dependency remains. Promotion stays unavailable until the focused
checks and the single authorized canonical full verification pass.

## Important Discoveries

- TL-07 product implementation and product walkthrough were complete before
  the Quality dependency; TL-08 redemption remains deliberately absent.
- The historical Access PIN and Access Session fixtures now seed only columns
  available at their intentionally rolled-back schema versions.
- The Access Session fixture uses the Owner-approved legacy Station mapping,
  preserves the alternate credential as revoked and creates its second Station
  only after TL-07 is reapplied.
- The later owner-scoped contextual-authorization failure was not reproduced by
  bounded isolated diagnosis and therefore did not justify a TL-07 product
  change.
- The integrated Quality dependency preserves bounded and redacted child
  stdout/stderr, assertion summary, exit code, signal and timeout reason.
- The Quality dependency did not change the eight-suite inventory, serial
  execution, fresh database per suite, outer 240-second budget or fail-closed
  result semantics.
- The repository defines 89 migrations on the preserved TL-07 checkpoint; the
  reconciled migration count and rerun state must be revalidated.
- `apps/dev-preview-web/src/.DS_Store` remains an unrelated Owner artifact and
  must remain untracked.

## Focused Verification

- [x] Prior TL-07 domain, application, authorization and UI proof completed.
- [x] Prior TL-07 PostgreSQL material proof: `3/3` PASS.
- [x] Prior Access PIN PostgreSQL historical fixture: `1/1` PASS.
- [x] Prior Access Session PostgreSQL historical fixture: `1/1` PASS.
- [ ] Reconciled Station/domain/Admin HTTP/UI and trusted-context regressions.
- [ ] Reconciled Access PIN and Access Session PostgreSQL proof.
- [ ] Reconciled TL-07 PostgreSQL `3/3`, migrations current and rerun `0 pending`.
- [ ] Child-diagnostics regressions, eight-suite inventory and unchanged budget.
- [ ] Typecheck, build, architecture, Work Unit checker and `git diff --check`.
- [ ] Exactly one canonical `verify:full` on the final reconciled candidate.

## Promotion Gates

- [x] Approved TL-07 product scope implemented without TL-08 redemption.
- [x] Historical-schema fixture remediations preserved.
- [x] Owner-scoped child diagnostics integrated through closed Quality Work Unit.
- [ ] Focused continuity verification PASS on the combined state.
- [ ] Canonical `verify:full` PASS on one exact candidate.
- [ ] `READY_FOR_PROMOTION` snapshot and clean tracked tree.
- [ ] Push, PR, CI and review remain separately unauthorized.

## Remote Actions / Authorization

- Owner authorized local reconciliation, focused checks, one canonical full
  verification and logical local commits.
- Push, PR, TL-07 merge, deploy and TL-08 remain unauthorized.
- No force push, rebase, squash, timeout change or retries-to-green are allowed.

## Handoff Notes

- The preserved TL-07 checkpoint is `8b75ba6724257044896b4c4ae26c09ef616c4d42`.
- The integrated Quality merge on `main` is `9bd8bfcf106ba69be66202eedee115a2eea19739`.
- Preserve `apps/dev-preview-web/src/.DS_Store`; it is unrelated and untracked.
- TL-08 is explicitly not started and production redemption is forbidden.

## Closure Predicate

TL-07 becomes `READY_FOR_PROMOTION` only when all approved inventory,
enrollment-authority, lifecycle, authorization, audit, HTTP and Admin UI blocks
remain material; the two historical fixtures and material TL-07 PostgreSQL
proof pass; the owner-scoped campaign preserves eight serial fresh-database
suites within the unchanged budget; canonical `verify:full` passes once on the
exact reconciled HEAD; the tracked tree is clean; and TL-08 remains unstarted.
