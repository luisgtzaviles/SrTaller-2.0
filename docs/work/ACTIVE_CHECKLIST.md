# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-02 — Administrative Identity + Session Foundation
iteration: 4 - Post-Quality Reconciliation
type: PRODUCT
risk: SENSITIVE
shadow_risk: SENSITIVE
branch: feature/tl-02-admin-identity-session
base_sha: 5a0289f46e0c90bb85b49d4326dc786c2e37d50d
status: BLOCKED
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
- **Status:** `BLOCKED`; reconciliation and TL-02 material validation pass,
  but the governed PBI-041 transaction benchmark failed before FULL.
- **Progress:** `13 / 14` Work Unit blocks complete.
- **Current work:** preserve the reconciled candidate and the first focused
  failure without retrying or absorbing another Quality remediation.
- **Next block:** obtain Owner direction for a separate investigation of the
  environmentally unstable PBI-041 transaction benchmark; do not begin TL-03.
- **Blockers:** PBI-041 focused material measured a 20.534 s database
  transaction against its governed 15 s budget on native arm64 PostgreSQL.
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
- [!] Establish exact-candidate FULL PASS and promotion readiness.
- [ ] Remote promotion requires separate Owner authorization.

## Current

The completed TL-02 product candidate has been restored after the external
Quality dependency closed on `main`. The ordinary merge preserves the TL-02
Stage 8 loopback-readiness remediation and combines it with the native
architecture PBI-041 performance harness. Focused TL-02 and harness contract
checks pass, but the first material PBI-041 run exceeded its 15-second database
transaction budget while remaining inside the 30-second service budget.

## Next

Keep TL-02 paused on its reconciled history. A separately authorized Quality
investigation must explain the remaining benchmark variance before another
PBI-041 run or the authoritative FULL campaign. Do not push, open a PR or start
TL-03.

## Blockers

Classified `ENVIRONMENTAL_UNRESOLVED`: the native arm64 image and governed
thresholds are intact, TL-02 changes no catalog production path, and its
material suite passes. The focused PBI-041 transaction was 20.534 s against
15 s; publication was 20.534 s against 30 s. FULL was not started after this
failed prerequisite.

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
- [x] Ordinary merge and conflict reconciliation.
- [x] TL-02 focused identity/session/security/isolation package — 18 PASS.
- [x] TL-02 material PostgreSQL — 2 PASS; 76 migrations, second run 0 pending.
- [x] Stage 8 deterministic endpoint-readiness regressions — 4 PASS.
- [x] PBI-041 performance diagnostics/orchestration regressions — 12 PASS.
- [!] PBI-041 material PostgreSQL — 9 PASS, 1 FAIL; transaction 20.534 s /
  15 s, publication 20.534 s / 30 s.
- [x] Typecheck, build, architecture, Work Unit and diff checks.
- [!] Exact reconciled `verify:full` — not run after the failed focused
  prerequisite; no retry used as evidence.

## Promotion Gates

- Planning checkpoint reviewed and implementation authorized by Owner.
- TL-02 material PostgreSQL, security, isolation and abuse tests pass after the
  current-main reconciliation.
- The governed PBI-041 prerequisite does not pass reliably on this host, so the
  FULL promotion pipeline is blocked and readiness cannot be declared.
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
