# Active Work Unit Checklist

Current PBI: NONE

<!-- WORK_UNIT_METADATA
work_unit: TL-07 — Station Inventory + Enrollment Authority
iteration: 5 - final remote promotion
type: PRODUCT
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: feature/tl-07-station-inventory-enrollment-readiness
base_sha: 74fe2b5fd5b66ee48428953f3e027f2815c839ca
status: PROMOTION
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
- Reconciliation with the integrated child-diagnostics and CI-variability
  Quality evidence.

## Out of Scope

- Device redemption, activation or operational handoff owned by TL-08.
- Station reactivation, physical delete, generic lifecycle patch, MDM,
  fingerprint authority and invented telemetry.
- PR merge, deploy, infrastructure and unrelated cleanup.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`QUALITY_STRATEGY.md`](../quality/QUALITY_STRATEGY.md)
- [`DEFINITION_OF_DONE.md`](../delivery/DEFINITION_OF_DONE.md)
- [Owner-scoped CI runtime variability](../quality/evidence/owner-scoped-ci-runtime-variability/README.md)

## Risks

- Station trust changes must immediately deny PIN login and existing
  Operational Sessions without crossing persistence ownership boundaries.
- Admin authorization needs a branch-scoped control-plane path consistent with
  TL-06 and must remain fail-closed across tenants.
- Enrollment authority must be useful to TL-08 without exposing a production
  redemption endpoint in TL-07.
- The owner-scoped campaign must stay serial, preserve eight suites and remain
  within its unchanged 240-second outer budget.
- The historical hosted-runner timeout remains evidence and must not become an
  implicit retry-to-green policy.

## Plan

- [x] Preserve the original TL-07 history and checkpoint `8b75ba6724257044896b4c4ae26c09ef616c4d42`.
- [x] Complete the approved Station inventory, enrollment authority and lifecycle implementation.
- [x] Complete Admin HTTP/UI, authorization, audit and responsive product proof.
- [x] Fix the historical Access PIN schema fixture incompatibility.
- [x] Fix the historical Access Session schema fixture incompatibility.
- [x] Preserve TL-07 while the bounded CI-variability diagnosis was completed.
- [x] Integrate and close both owner-scoped Quality dependencies.
- [x] Merge authoritative `main` into the preserved TL-07 branch ordinarily.
- [x] Execute the exact verification path required by the current Harness.
- [~] Push the reconciled branch and complete authoritative PR review.

## Current

TL-07 product history is preserved and authoritative `main` has been merged
ordinarily. The canonical full verification passed once on reconciliation
merge `a6845e8e204e471db59abbe7396a6b5aaf698dd8`: stages 0–19, owner-scoped
`8/8`, TL-07 PostgreSQL `3/3`, 89 migrations, rerun `0 pending`, runtime
smokes, fingerprint and cleanup all passed. The subsequent readiness-only
checklist delta passed the exact `DOCS_ONLY` verifier and Work Unit promotion
checker.

## Next

Update existing Draft PR #72 through an ordinary push, observe authoritative
CI on its exact HEAD and complete the security/architectural review.

## Blockers

No semantic product/security conflict exists. Promotion remains contingent on
authoritative remote CI and final security/architectural review results.

## Important Discoveries

- TL-07 product implementation and product walkthrough were complete before
  the Quality dependencies; TL-08 redemption remains deliberately absent.
- The historical Access PIN and Access Session fixtures seed only columns
  available at their intentionally rolled-back schema versions.
- The Access Session fixture uses the approved legacy Station mapping,
  preserves the alternate credential as revoked and creates its second Station
  only after TL-07 is reapplied.
- The integrated child-diagnostics dependency preserves bounded, redacted
  failure context without changing the eight-suite serial campaign.
- The Owner accepts `CI_HOST_RESOURCE_VARIABILITY` for the specific historical
  PR #72 evidence. Available telemetry cannot distinguish VM performance tier,
  host contention or another hosted-runner resource cause.
- PR #72 attempt 1 remains a failed outer-wrapper timeout. Attempt 2 success
  does not erase that evidence or establish a general retry policy.
- The repository defines 89 migrations and the prior material migration rerun
  reported `0 pending`.
- `apps/dev-preview-web/src/.DS_Store` remains unrelated and untracked.

## Focused Verification

- [x] Prior TL-07 domain, application, authorization and UI proof completed.
- [x] Prior TL-07 PostgreSQL material proof: `3/3` PASS.
- [x] Prior Access PIN PostgreSQL historical fixture: `1/1` PASS.
- [x] Prior Access Session PostgreSQL historical fixture: `1/1` PASS.
- [x] Local product/full candidate `8b877a8c6999b9954d376c46bf64930ce67fa108`: stages 0–19 PASS.
- [x] Historical PR #72 attempt 2: owner-scoped `8/8`, TL-07 PostgreSQL `3/3`, comparison and promotion gate PASS.
- [x] One canonical `verify:full` on reconciliation merge `a6845e8e204e471db59abbe7396a6b5aaf698dd8`: stages 0–19 PASS.
- [x] Owner-scoped campaign in that run: `8/8` PASS, 115.010s campaign / 118.654s wrapper, below 240s.
- [x] TL-07 PostgreSQL in that run: `3/3` PASS; 89 migrations; second run `0 pending`.
- [x] Final docs-only readiness delta, Work Unit promotion checker and delta `git diff --check`.

## Promotion Gates

- [x] Approved TL-07 product scope implemented without TL-08 redemption.
- [x] Historical-schema fixture remediations preserved.
- [x] Owner-scoped Quality dependencies integrated and closed.
- [x] Timeout, suite inventory, serial isolation and fail-closed semantics unchanged.
- [x] Required local verification PASS on the reconciled candidate.
- [ ] Existing PR #72 updated and authoritative CI/review PASS.
- [ ] Owner merge authorization remains separate.

## Remote Actions / Authorization

- Owner authorized ordinary main reconciliation, required local checks,
  ordinary push to existing PR #72 and authoritative CI/review.
- PR #72 merge, deploy, TL-08 and unrelated cleanup remain unauthorized.
- No force push, rebase, squash, timeout change, retry policy or suite reduction
  is allowed.

## Handoff Notes

- Preserved TL-07 PR checkpoint before this reconciliation:
  `1e5335734920de8a0f47a929120dcdce0c4ea3c9`.
- Integrated Quality merge on `main`:
  `82c59813639f75f6123072c7d3c866077cdd22a7`.
- Preserve `apps/dev-preview-web/src/.DS_Store`; it is unrelated and untracked.
- Future bounded parent-level progress markers remain outside TL-07.
- TL-08 is explicitly not started and production redemption is forbidden.

## Closure Predicate

TL-07 closes only after this exact product snapshot is merged through an
authorized ordinary PR; authoritative exact-main CI, required PostgreSQL
material and promotion gate are GREEN; any required environment validation is
satisfied; and the governed closure ref targets the exact merge. TL-08 and
deploy retain separate authority.
