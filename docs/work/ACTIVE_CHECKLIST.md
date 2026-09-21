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
last_updated: 2026-09-20
-->

## Identity

- **Milestone:** Tenant Lifecycle MVP.
- **Work Unit:** TL-02 — Administrative Identity + Session Foundation.
- **Sprint:** none; no product Sprint was started.
- **Current PBI:** `NONE`; Tenant Lifecycle is proceeding through governed
  Work Units.
Current PBI: NONE
- **Status:** `ACTIVE` in authorized implementation.
- **Progress:** `7 / 14` Work Unit blocks complete.
- **Current work:** administrative identity/session domain contracts complete.
- **Next block:** administrative password cryptography and external configuration.
- **Blockers:** none.
- **Last updated:** 2026-09-20, America/Hermosillo.

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
- [~] Implement password cryptography/configuration and focused tests.
- [ ] Implement migration/repositories and material PostgreSQL tests.
- [ ] Implement use cases, HTTP boundary and authorization executor.
- [ ] Complete local proof, hardening, documentation and promotion gates.

## Current

Administrative email/password and session/recovery temporal contracts are
implemented with focused domain tests.

## Next

Implement the separate administrative Argon2id purpose, pepper configuration,
dummy verification and bounded work. Do not begin TL-03.

## Blockers

None.

## Important Discoveries

- Existing User lifecycle and role composition are reusable; email/password
  identity is absent and belongs to Access, not the User row.
- Existing PIN/Operational Session code provides patterns, not shared
  credentials, cookies, guards or audience.
- No capability registry change is necessary for self-session foundation.
- Current schema has 75 migrations; TL-02 can be additive without backfill.
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
- [ ] Focused TL-02 domain/application/HTTP/PostgreSQL tests during implementation.
- [x] TL-02 domain tests — 3 PASS.
- [ ] Typecheck, build and architecture checks during implementation.
- [ ] Current risk pipeline plus `verify:full` before promotion.

## Promotion Gates

- Planning checkpoint reviewed and implementation authorized by Owner.
- Material PostgreSQL, security, isolation and abuse tests pass.
- Full promotion pipeline/review required by the final classified diff passes.
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
