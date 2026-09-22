# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-06 — Tenant Administration Users/Roles Integration
iteration: 2 - Implementation
type: PRODUCT
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: feature/tl-06-admin-users-roles-readiness
base_sha: 81b57994c69ed3584776ff080253f9a772e6425b
status: ACTIVE
closure_mode: DERIVED
last_updated: 2026-09-21
-->

## Status Snapshot

Current PBI: NONE

- **Milestone:** Tenant Lifecycle MVP.
- **Sprint:** none selected.
- **Current PBI:** none; Work Unit `TL-06` is implementing its authorized scope.
- **Overall status:** `ACTIVE` implementation.
- **Progress:** readiness `8 / 8`; implementation `3 / 8`.
- **Current work:** Block 4 — Admin Users/Roles authorization and HTTP surface.
- **Next block:** Block 5 — last-effective-admin coordinator and Level-2 actions.
- **Blockers:** none.
- **Last updated:** 2026-09-21.

## Objective

Design and prepare the minimum Tenant Administration Users/Roles capability for verified invitations, explicit administrative authority delegation, context separation and last-effective-admin safety.

## Why

To execute one authorized objective with a transferable repository-native handoff.

## In Scope

- Audit the current Tenant User, Admin Identity, PIN, Role and assignment model.
- Define verified-email invitations and invitee-owned password establishment.
- Define custom Role/assignment administration from Admin Context.
- Define the transaction-safe last-effective-Tenant-Admin invariant.
- Define Level-2 boundaries, cross-tenant isolation, migrations and tests.

## Out of Scope

- TL-07, Station enrollment, Super Admin, billing and Production email setup.
- Push, PR, merge and deploy.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`ADR-012`](../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md)
- [`ADR-015`](../decisions/proposed/ADR-015-tenant-administrative-control-plane.md)
- [`Tenant Lifecycle MVP`](../architecture/TENANT_LIFECYCLE_MVP.md)
- [`TL-06 Readiness`](../architecture-readiness/tenant-lifecycle/TL-06_TENANT_ADMIN_USERS_ROLES_INTEGRATION_READINESS.md)

## Risks

- Concurrent authority removal could leave a Tenant without an effective Admin.
- Invitation replay or stale issuer authority could elevate a recipient.
- Reusing Operational UI/guards could couple Admin Context to Station/PIN.
- IDs or email lookup could leak or mutate another Tenant.

## Plan

- [x] Initialize the governed Work Unit from clean `main`.
- [x] Audit User, credentials, Roles, assignments and current local material.
- [x] Define the identity/context relationship without a second User aggregate.
- [x] Threat-model invitation, acceptance, resend, replay and concurrency.
- [x] Select the minimum Role Management V1 boundary.
- [x] Define last-admin serialization and Level-2 actions.
- [x] Reconcile TL-04 email delivery reuse and Access ownership.
- [x] Define migrations, audit, HTTP/UI blocks and test plan.
- [x] Complete focused documentary validation and Owner handoff.
- [x] Receive explicit Owner implementation authorization.
- [x] Block 1 — invitation persistence, domain and audit foundation.
- [x] Block 2 — TL-04 email transport reuse and durable dispatch.
- [x] Block 3 — atomic invitation acceptance and password establishment.
- [~] Block 4 — Admin Users/Roles authorization and HTTP surface.
- [ ] Block 5 — last-effective-admin coordinator and Level-2 actions.
- [ ] Block 6 — Admin UI Users/Roles/invitation acceptance.
- [ ] Block 7 — material PostgreSQL, isolation, concurrency and regression QA.
- [ ] Block 8 — browser/accessibility proof, docs and full candidate freeze.

## Current

Issue/resend/revoke/accept use server IDs, digest-only challenges, immutable
grant intent and TL-02 Argon2id password protection in SERIALIZABLE storage.

## Next

Expose tenant-derived Admin Users/Roles/invitation commands through the Admin
Session authority boundary and a safe public acceptance endpoint.

## Blockers

None.

## Important Discoveries

- A single User already supports admin-only, operational-only and combined identities.
- Local material has 4 Users: 3 operational-only and 1 combined; no fabricated backfill is required.
- The legacy Users/Roles surface is Operational Context and cannot be reused as the TL-06 authorization boundary.
- The protected `tenant_admin` Role already rejects content edits; assignment removal still needs the last-admin guard.
- TL-04 provider infrastructure is reusable, but invitation dispatch persistence must remain Access-owned.

## Focused Verification

- [x] Markdown local links.
- [x] Architecture and dependency contracts.
- [x] Secret-pattern scan.
- [x] `git diff --check`.
- [x] Read-only PostgreSQL material audit; 84 migrations, no writes.

## Promotion Gates

- Existing authoritative promotion policy remains unchanged.

## Remote Actions / Authorization

- No push, PR, merge or deploy is authorized.

## Handoff Notes

- Branch creation/switching is explicit and occurred before this command.
- `.DS_Store` remains an unrelated untracked Owner artifact.
- Owner authorized all eight implementation blocks in this Work Unit.

## Closure Predicate

All eight authorized blocks are implemented and evidenced; focused and full
verification pass on one exact local HEAD; tracked tree is clean except the
preserved Owner `.DS_Store`; Work Unit is `READY_FOR_PROMOTION`. Remote actions
remain separately unauthorized.
