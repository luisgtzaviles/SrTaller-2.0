# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-02 — Administrative Identity + Session Foundation
iteration: 4 - Post-Quality Reconciliation
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
- **Status:** `ACTIVE`; the Quality dependency is integrated into `main` and
  the preserved TL-02 candidate is being reconciled against that baseline.
- **Progress:** `13 / 14` Work Unit blocks complete.
- **Current work:** validate the ordinary `main` merge, focused TL-02/Quality
  interaction and exact reconciled promotion candidate.
- **Next block:** run the authoritative FULL gate on the exact reconciled HEAD;
  stop before any remote promotion.
- **Blockers:** none currently; promotion readiness remains contingent on the
  exact-candidate FULL result.
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
- [~] Reconcile current `main` and validate the exact combined candidate.
- [ ] Establish exact-candidate FULL PASS and promotion readiness.
- [ ] Remote promotion requires separate Owner authorization.

## Current

The completed TL-02 product candidate has been restored after the external
Quality dependency closed on `main`. The ordinary merge preserves the TL-02
Stage 8 loopback-readiness remediation and combines it with the native
architecture PBI-041 performance harness. The only expected semantic adjustment
is the PBI-041 material runner's schema expectation from 75 to 76 migrations.

## Next

Run focused interaction checks, material PostgreSQL proof and the authoritative
FULL campaign. If and only if every required gate passes on the unchanged final
candidate, reconcile this Work Unit to `READY_FOR_PROMOTION` and stop before
push or PR.

## Blockers

None at reconciliation start. Any real TL-02 regression, Stage 8 readiness
failure or governed PBI-041 benchmark failure blocks promotion and requires a
new scoped remediation decision.

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
- The Quality Work Unit changed the PBI-041 test harness, not product behavior;
  its native image selection, timing boundaries and threshold remain intact.

## Focused Verification

- [x] Preserved TL-02 HEAD `bda3a70d63dcc7c37e15ec2c8c419941c9731790`
  confirmed before reconciliation.
- [x] Quality dependency merge `4f3cf8c4ecf4827d7a92ed80386cf7738e6e4cc5`
  confirmed as local and `origin/main` baseline with exact-main CI GREEN.
- [x] Tracked worktree clean before the merge; unrelated `.DS_Store` preserved.
- [~] Ordinary merge and conflict reconciliation.
- [ ] TL-02 focused identity/session/security/isolation package.
- [ ] TL-02 material PostgreSQL: 76 migrations and second run 0 pending.
- [ ] Stage 8 deterministic endpoint-readiness regressions.
- [ ] PBI-041 performance diagnostics and material PostgreSQL suite.
- [ ] Typecheck, architecture, Work Unit and diff checks.
- [ ] Exact reconciled `verify:full`.

## Promotion Gates

- Planning checkpoint reviewed and implementation authorized by Owner.
- Material PostgreSQL, security, isolation and abuse tests must pass after the
  current-main reconciliation.
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
