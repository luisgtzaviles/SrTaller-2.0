# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-02 — Administrative Identity + Session Foundation
iteration: 5 - Final Main Reconciliation
type: PRODUCT
risk: SENSITIVE
shadow_risk: SENSITIVE
branch: feature/tl-02-admin-identity-session
base_sha: 5a0289f46e0c90bb85b49d4326dc786c2e37d50d
status: ACTIVE
closure_mode: DERIVED
last_updated: 2026-09-21
-->

## Identity

- **Milestone:** Tenant Lifecycle MVP.
- **Work Unit:** TL-02 — Administrative Identity + Session Foundation.
- **Sprint:** none; no product Sprint was started.
- **Current PBI:** `NONE`; Tenant Lifecycle is proceeding through governed
  Work Units.
Current PBI: NONE
- **Status:** `ACTIVE`; the preserved TL-02 branch is reconciled with current
  `main` and all focused gates are green.
- **Progress:** `13 / 14` Work Unit blocks complete.
- **Current work:** run the single authoritative `verify:full` on the exact
  reconciled candidate.
- **Next block:** derive `READY_FOR_PROMOTION` only if that exact-candidate
  FULL gate is green, then stop before every remote action.
- **Blockers:** none. Both external PBI-041 Quality dependencies are closed.
- **Last updated:** 2026-09-21, America/Hermosillo.

## Objective

Implement the minimum secure administrative identity and stateful Admin
Session foundation required by ADR-015, preserving strict separation from
Station/PIN/Operational Sessions.

## Why

Tenant Lifecycle needs a secure control-plane identity before public
registration/bootstrap can be implemented, without weakening the operational
Station + PIN boundary. Reconciliation must also retain the integrated Quality
gate that makes the shared FULL campaign deterministic on this host.

## In Scope

- Verified administrative email identity bound to one Tenant User/Tenant.
- Non-reversible password credential and secure verification.
- Stateful concurrent Admin Sessions: idle 30m, absolute 12h, no remember-me.
- Login/logout, individual/global revocation and recent password reauth 10m.
- Internal recovery foundation, abuse controls and secret-free audit.
- Two-tenant negative tests and strict separation from operational auth.
- Reconciliation with the integrated PBI-041 governed performance harness.

## Out of Scope

- Public registration/email delivery, Tenant bootstrap and starter authority.
- Branch/Station management or enrollment, admin product shell and TL-03.
- PIN/Operational Session redesign, Super Admin, billing, MFA/SSO/passkeys.
- Push, PR, remote merge, deploy, infrastructure or GitHub configuration.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`TL-02 Readiness`](../architecture-readiness/tenant-lifecycle/TL-02_ADMIN_IDENTITY_SESSION_READINESS.md)
- [`TENANT_LIFECYCLE_MVP.md`](../architecture/TENANT_LIFECYCLE_MVP.md)
- [`ADR-015`](../decisions/proposed/ADR-015-tenant-administrative-control-plane.md)
- [`IDENTITY_ACCESS_AND_PERMISSIONS.md`](../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md)
- [`SECURITY_BASELINE.md`](../architecture/SECURITY_BASELINE.md)
- [`MULTITENANT_ISOLATION_TESTING.md`](../quality/MULTITENANT_ISOLATION_TESTING.md)

## Risks

- Credential/session confusion could bypass Station/PIN boundaries.
- Global email lookup could disclose or cross Tenant scope.
- KDF/rate-limit choices can create enumeration, stuffing or availability risk.
- Revocation/recovery races could leave stale authority.
- Secret-bearing values could leak through HTTP, logs, fixtures or audit.
- Harness reconciliation could accidentally weaken either Stage 8 readiness or
  the governed PBI-041 performance measurement.

## Plan

- [x] Revalidate TL-01 closure, main baseline and initialize TL-02 branch.
- [x] Audit identity, User/Tenant, PIN, Sessions, authorization, HTTP and DB.
- [x] Define reuse/new boundaries, owner modules and proposed data model.
- [x] Complete threat model selections and migration/test plan.
- [x] Obtain Owner authorization to cross the planning checkpoint.
- [x] Implement administrative identity/session/recovery domain contracts.
- [x] Implement password cryptography/configuration and focused tests.
- [x] Implement migration/repositories and material PostgreSQL tests.
- [x] Implement use cases, HTTP boundary and authorization executor.
- [x] Complete local proof, hardening and documentation.
- [x] Preserve TL-02 while the separate Quality dependency was remediated.
- [x] Reconcile current `main` and validate the combined TL-02 mechanics.
- [ ] Establish exact-candidate FULL PASS and promotion readiness.
- [ ] Remote promotion requires separate Owner authorization.

## Current

The completed TL-02 product candidate is resumed after both external Quality
dependencies closed on `main`. The authorized ordinary merge brought in native
PostgreSQL architecture selection and the corrected PBI-041 transaction
capacity diagnostic while preserving the TL-02 Stage 8 loopback-readiness
remediation. The combined harness audit and all focused gates are green.

## Next

Run exactly one authoritative `verify:full` on the exact reconciled candidate.
If green, derive `READY_FOR_PROMOTION` without creating a commit merely to copy
verification output, and stop before push, PR, merge, deploy or TL-03.

## Blockers

None. The former native-image and transaction-budget blockers are resolved by
the two integrated PBI-041 Quality Work Units. Any new material failure must be
classified from the exact reconciled candidate without blind retry.

## Important Discoveries

- Existing User lifecycle and role composition are reusable; email/password
  identity is absent from the legacy model and belongs to Access.
- Existing PIN/Operational Session code provides patterns, not shared
  credentials, cookies, guards or audience.
- No capability registry change is necessary for self-session foundation.
- Current schema has 76 migrations after the additive TL-02 foundation; no
  backfill was required.
- Recovery transport/provider remains TL-04 and does not block the internal
  recovery contract.
- The first Quality Work Unit integrated native host-architecture PostgreSQL
  selection without changing product behavior or performance thresholds.
- The second Quality Work Unit preserved publish above 30 seconds as a hard
  failure, retained mandatory transaction timing and correctly treats one
  observation above 15 seconds as
  `TRANSACTION_CAPACITY_TARGET_EXCEEDED`, pending future calibrated p95 work.

## Focused Verification

- [x] Preserved TL-02 checkpoint
  `6ea9d15874acce1c006c204ee70933f15cb5dec1` confirmed before reconciliation.
- [x] Quality dependency merges `4f3cf8c4ecf4827d7a92ed80386cf7738e6e4cc5`
  and `aaccbf61f54b3b7cb3560ae422bc0906019a40ea` confirmed integrated with
  exact-main CI GREEN.
- [x] Tracked worktree clean before the merge; unrelated `.DS_Store` preserved.
- [x] Ordinary merge and checklist conflict reconciliation.
- [x] Combined verification-harness audit; no competing readiness abstraction,
  image/platform conflict, stale single-run 15-second assertion or weakened
  gate found.
- [x] TL-02 focused identity/session/security/isolation package: 72/72 PASS.
- [x] TL-02 material PostgreSQL: 2/2 PASS, 76 migrations and second run 0
  pending.
- [x] Stage 8 deterministic endpoint-readiness and orchestration regressions:
  combined harness package 38/38 PASS.
- [x] PBI-041 corrected performance contract and material PostgreSQL suite:
  10/10 PASS; publish 1325.0 ms, transaction 1324.6 ms, no capacity-target
  diagnostic emitted.
- [x] Typecheck, build, architecture, Work Unit and diff checks.
- [ ] Exact reconciled `verify:full`; one canonical run only.

## Promotion Gates

- Planning checkpoint reviewed and implementation authorized by Owner.
- TL-02 material PostgreSQL, security, isolation and abuse tests must pass
  after the final current-main reconciliation.
- PBI-041 publish above 30 seconds remains blocking; transaction timing remains
  mandatory and a single observation above 15 seconds is diagnostic rather
  than an independently blocking p95 verdict.
- Full promotion pipeline/review remains required by the final classified diff.
- No remote action, merge to `main` or deploy is implied by local readiness.

## Remote Actions / Authorization

- The ordinary local merge of current `origin/main` is authorized.
- No push, PR, merge to `main`, deploy or remote/infrastructure change is
  authorized.

## Handoff Notes

- Preserve `apps/dev-preview-web/src/.DS_Store` as unrelated Owner artifact.
- Preserve both parents of the reconciliation merge; do not rebase or rewrite.
- TL-03 remains unstarted.

## Closure Predicate

TL-02 closes only after its implementation/evidence is promoted through one
authorized PR, merged by the approved method, exact-main CI is GREEN and any
environment proof required by the final scope passes. Closure does not start
TL-03 automatically.
