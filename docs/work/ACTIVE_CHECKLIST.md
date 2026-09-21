# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-02 — Administrative Identity + Session Foundation
iteration: 3 - Implementation
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
- **Status:** `BLOCKED`; the authorized Stage 8 readiness remediation is
  complete and focused-green, but the exact FULL campaign cannot pass Stage 7.
- **Progress:** `13 / 14` Work Unit blocks complete.
- **Current work:** preserve the focused-green Stage 8 remediation and the
  failed exact-candidate FULL evidence without changing PBI-041.
- **Next block:** obtain separate Owner direction for the PBI-041 performance
  gate/host instability, then rerun FULL; do not begin TL-03.
- **Blockers:** PBI-041 publish measured 35.46s inside FULL and 34.53s in the
  single isolated diagnostic, above its governed 30s budget.
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
the connection used by the migrator. The bounded endpoint probe, focused
regressions and material TL-02 suite pass, and the coherent remediation is
committed. The exact-candidate FULL campaign is now blocked earlier by the
PBI-041 performance gate. No remote promotion is allowed yet.

## Next

Request a separate quality/harness decision for PBI-041's current 10k publish
performance instability. Do not patch that unrelated gate, promote remotely or
begin TL-03 under the Stage 8 authorization.

## Blockers

The exact remediation candidate passed Stages 0–6 but failed Stage 7 because
PBI-041 publish measured 35.46 seconds against its governed 30-second budget.
The single isolated diagnostic also failed at 34.53 seconds. Stage 8 therefore
did not run inside FULL. Its focused material suite passes 2/2 with 76
migrations and 0 pending on the second run; no migration or gate was weakened.

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
- [!] Exact `verify:full` — FAIL at Stage 7; Stages 0–6 PASS, PBI-041 publish
  35.46s / 30s, cleanup and final fingerprint PASS. Stage 8 was not reached.
- [!] Isolated PBI-041 diagnostic — FAIL at 34.53s / 30s; no PBI-041 change is
  authorized in this Work Unit.

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
