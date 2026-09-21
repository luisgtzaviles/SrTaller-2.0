# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-02 — Administrative Identity + Session Foundation
iteration: 3 - Implementation
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
- **Status:** `ACTIVE`; implementation is complete and the authorized Stage 8
  PostgreSQL readiness remediation is in progress.
- **Progress:** `13 / 14` Work Unit blocks complete.
- **Current work:** make Stage 8 prove the published PostgreSQL endpoint is
  reachable before migrations begin.
- **Next block:** focused regression and material TL-02 verification, one
  logical commit, then exact-candidate `verify:full`.
- **Blockers:** none while the narrowly authorized harness remediation is in
  progress; remote promotion remains unavailable until FULL passes.
- **Last updated:** 2026-09-21, America/Hermosillo.

## Objective

Plan and, after the explicit planning checkpoint, implement the minimum secure
administrative identity and stateful Admin Session foundation required by
ADR-015, preserving strict separation from Station/PIN/Operational Sessions.

## Why

Tenant Lifecycle needs a secure control-plane identity before public
registration/bootstrap can be implemented, without weakening the operational
Station + PIN boundary.

## In Scope

- Verified administrative email identity bound to one Tenant User/Tenant.
- Non-reversible password credential and secure verification.
- Stateful concurrent Admin Sessions: idle 30m, absolute 12h, no remember-me.
- Login/logout, individual/global revocation and recent password reauth 10m.
- Internal recovery foundation, abuse controls and secret-free audit.
- Two-tenant negative tests and strict separation from operational auth.

## Out of Scope

- Public registration/email delivery, Tenant bootstrap and starter authority.
- Branch/Station management or enrollment, admin product shell and TL-03.
- PIN/Operational Session redesign, Super Admin, billing, MFA/SSO/passkeys.
- Push, PR, merge, deploy, infrastructure or GitHub configuration.

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

## Plan

- [x] Revalidate TL-01 closure, main baseline and initialize TL-02 branch.
- [x] Audit identity, User/Tenant, PIN, Sessions, authorization, HTTP and DB.
- [x] Define reuse/new boundaries, owner modules and proposed data model.
- [x] Complete threat model selections and migration/test plan.
- [x] Identify remaining Owner decisions and readiness status.
- [x] Obtain Owner authorization to cross the planning checkpoint.
- [x] Implement administrative identity/session/recovery domain contracts.
- [x] Implement password cryptography/configuration and focused tests.
- [x] Implement migration/repositories and material PostgreSQL tests.
- [x] Implement use cases, HTTP boundary and authorization executor.
- [x] Complete local proof, hardening, documentation and promotion gates.

## Current

The eight authorized product blocks are complete. PBI-041 now passes inside
FULL. Stage 8 exposed a separate harness race: Docker can report PostgreSQL
healthy inside the container before its published loopback endpoint accepts
the connection used by the migrator. The bounded endpoint probe and focused
regressions now pass; the coherent remediation is ready to commit before the
required exact-candidate FULL campaign. No remote promotion is allowed yet.

## Next

Add deterministic, bounded readiness for the exact Stage 8 loopback endpoint,
prove it with focused tests and the TL-02 PostgreSQL suite, commit the coherent
remediation, then rerun the exact full campaign. Do not begin TL-03.

## Blockers

No active implementation blocker. The superseding failure occurred at Stage 8:
container-internal health passed, but the migrator raced Docker's published
loopback endpoint and failed with `DATABASE_MIGRATION_INVALID_STATE`. An
immediate isolated TL-02 run passed 2/2 with 76 migrations and 0 pending on the
second run. The readiness fix must not weaken, skip or retry the migration.

## Important Discoveries

- Existing User lifecycle and role composition are reusable; email/password
  identity is absent and belongs to Access, not the User row.
- Existing PIN/Operational Session code provides patterns, not shared
  credentials, cookies, guards or audience.
- No capability registry change is necessary for self-session foundation.
- Current schema has 76 migrations after the additive TL-02 foundation; no
  backfill was required.
- Recovery transport/provider remains TL-04 and does not block the internal
  recovery contract.

## Focused Verification

- [x] `work-unit:check` — PASS.
- [x] Markdown relative links — PASS, 173 checked across changed docs.
- [x] Documentation policy consistency — PASS; Current PBI `NONE`.
- [x] Secret-pattern scan — PASS, 6 governed patterns.
- [x] `verify:architecture` — PASS, DEC-005 policy 9.
- [x] `git diff --check` — PASS.
- [x] Current classifier: `CROSS_MODULE_HIGH_RISK` / `FULL`; shadow:
  `SENSITIVE` / `FULL_PLUS_OWNER_AND_DOMAIN_SECURITY_REVIEW`, no gates reduced.
- [x] Docs-only gate — correctly rejected as not applicable because the
  security/readiness contract classifies `FULL`.
- [x] Focused TL-02 domain/application/HTTP/PostgreSQL tests — PASS.
- [x] TL-02 focused domain/security/application/HTTP/authorization/provisioner
  package — 17 PASS.
- [x] TL-02 domain tests — 3 PASS; password/token tests — 2 PASS.
- [x] TL-02 application use-case tests — 4 PASS.
- [x] TL-02 PostgreSQL persistence — PASS; 76 migrations, second run 0 pending.
- [x] TL-02 HTTP/session audience tests — 4 PASS, including infrastructure
  failure preservation during revocation.
- [x] TL-02 administrative authorization tests — 3 PASS.
- [x] Local provisioner guard/input tests — 2 PASS.
- [x] Material TL-02 PostgreSQL proof — 2 PASS; concurrent sessions, abuse,
  recovery and audit covered.
- [x] Local runtime — `/livez` 200 and unauthenticated `/api/admin/session`
  returns a distinct login-CSRF challenge with `no-store` and no Station.
- [x] Typecheck and architecture checks — PASS through implementation block 4.
- [x] Current base `verify` — PASS: 975 pass, 32 governed material skips, zero
  failures.
- [x] PBI-041 inside the latest FULL campaigns — PASS twice; publish 1.98s and
  2.07s, below the governed 30s budget.
- [x] Published PostgreSQL endpoint readiness regression — 4 PASS; delayed
  availability, bounded failure, migration failure propagation and cleanup.
- [x] Affected orchestration plus readiness tests — 12 PASS.
- [x] Remediated TL-02 material PostgreSQL — 2 PASS; 76 migrations, second run
  0 pending.
- [x] Focused typecheck, architecture and Work Unit checks — PASS.
- [~] Exact `verify:full` — Stage 8 readiness remediation and revalidation in
  progress; the prior candidate reached Stage 8 with all earlier stages PASS.

## Promotion Gates

- Planning checkpoint reviewed and implementation authorized by Owner.
- Material PostgreSQL, security, isolation and abuse tests pass.
- Full promotion pipeline/review required by the final classified diff remains
  pending; remote promotion is blocked until an exact campaign passes.
- No remote action, merge or deploy is implied.

## Remote Actions / Authorization

- No push, PR, merge, deploy or remote/infrastructure change is authorized.

## Handoff Notes

- Preserve `apps/dev-preview-web/src/.DS_Store` as unrelated Owner artifact.
- Base is the exact merged TL-01 main SHA recorded in metadata.
- Planning document contains the transferable implementation contract.

## Closure Predicate

TL-02 closes only after its implementation/evidence is promoted through one
authorized PR, merged by the approved method, exact-main CI is GREEN and any
environment proof required by the final scope passes. Closure does not start
TL-03 automatically.
