# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-06 — Tenant Administration Users/Roles Integration
iteration: 3 - Main Reconciliation and Remote Revalidation
type: PRODUCT
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: feature/tl-06-admin-users-roles-readiness
base_sha: 81b57994c69ed3584776ff080253f9a772e6425b
status: PROMOTION
closure_mode: DERIVED
last_updated: 2026-09-22
-->

Current PBI: NONE

## Objective

Deliver the minimum Tenant Administration Users/Roles capability for verified
invitations, explicit administrative authority delegation, context separation
and last-effective-admin safety.

## Why

Complete the authorized Tenant Lifecycle administrative identity boundary
without coupling Admin Context to Station/PIN or weakening tenant isolation.

## In Scope

- Verified-email invitations and invitee-owned password establishment.
- Tenant-managed Roles and multiple assignments from Admin Context.
- Admin-only, operational-only and combined User modes.
- Transaction-safe last-effective-Tenant-Admin protection.
- Level-2 reauthentication for sensitive authority/lifecycle mutations.
- Cross-tenant isolation, durable sanitized audit and reusable email delivery.
- Reconciliation with the integrated owner-scoped PostgreSQL harness.

## Out of Scope

- TL-07, Station enrollment, Super Admin, billing and Production email setup.
- Changes to the 240-second owner-scoped budget, retries or suite parallelism.
- Merge of PR #69, deploy and unrelated cleanup.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`ADR-012`](../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md)
- [`ADR-015`](../decisions/proposed/ADR-015-tenant-administrative-control-plane.md)
- [`Tenant Lifecycle MVP`](../architecture/TENANT_LIFECYCLE_MVP.md)
- [`TL-06 Readiness`](../architecture-readiness/tenant-lifecycle/TL-06_TENANT_ADMIN_USERS_ROLES_INTEGRATION_READINESS.md)

## Risks

- Concurrent authority removal could leave a Tenant without an effective Admin.
- Invitation replay, expiry or stale issuer authority could elevate a recipient.
- Reusing Operational guards could couple Admin Context to Station/PIN.
- IDs or email lookup could leak or mutate another Tenant.
- Reconciliation could accidentally restore the obsolete per-suite PostgreSQL
  container lifecycle or weaken the material eight-suite campaign.

## Plan

- [x] Complete readiness and Owner decisions.
- [x] Implement invitation persistence, email dispatch and atomic acceptance.
- [x] Implement Admin Users/Roles APIs and UI.
- [x] Implement last-effective-admin and Level-2 protections.
- [x] Prove tenant isolation, concurrency and responsive accessibility.
- [x] Complete the original focused and full candidate verification.
- [x] Remediate invitation expiry/resend lifecycle on the preserved branch.
- [x] Preserve the reviewed TL-06 checkpoint during the external Quality work.
- [x] Confirm the Quality Work Unit is closed and current `main` is authoritative.
- [~] Merge current `main` ordinarily and audit the combined state.
- [ ] Run focused TL-06 and integrated PostgreSQL verification.
- [ ] Run one canonical `verify:full` on the reconciled exact HEAD.
- [ ] Push normally, require fresh PR #69 CI and review the exact final HEAD.

## Current

TL-06 has resumed on its preserved branch. Its previous remote promotion found
the invitation expiry/resend lifecycle defect, which is fixed at the preserved
checkpoint. The external owner-scoped PostgreSQL Quality dependency is now
integrated and closed; current `main` is being merged ordinarily into TL-06.

## Next

Complete the checklist conflict resolution, audit the combined product and
harness contracts, then execute focused TL-06 verification.

## Blockers

None. PR #69 remains open and unmerged while the reconciled candidate is
revalidated.

## Important Discoveries

- A single User supports admin-only, operational-only and combined identities.
- The legacy Users/Roles surface is Operational Context and is not the TL-06
  authorization boundary.
- The protected `tenant_admin` Role rejects content edits; assignments remain
  subject to the serialized last-effective-admin invariant.
- TL-04 email provider infrastructure is reused while invitation persistence
  remains Access-owned.
- Expired invitations transition durably to `EXPIRED`, release pending-email
  uniqueness, expire the active challenge and cannot have their original
  deadline extended by resend.
- The integrated Quality harness uses one governed PostgreSQL container, eight
  exact serial suites and a fresh random database with deterministic drop and
  absence verification per suite.

## Focused Verification

- [x] Original TL-06 domain/application/UI and material PostgreSQL proof.
- [x] Invitation lifecycle remediation focused proof.
- [ ] Reconciled invitation, identity, User-mode, Role and last-admin suites.
- [ ] Reconciled Level-2, tenancy, email and audit suites.
- [ ] TL-06 PostgreSQL 3/3 with current migrations and zero pending on rerun.
- [ ] Owner-scoped PostgreSQL campaign 8/8 under the unchanged budget.
- [ ] Typecheck, build, architecture, links, secret scan and `git diff --check`.
- [ ] Canonical `verify:full` on one exact reconciled HEAD.

## Promotion Gates

- [x] Existing PR #69 and prior remote promotion are preserved.
- [x] External Quality dependency integrated and closed on `main`.
- [~] Ordinary `main` reconciliation in progress.
- [ ] Local focused and full gates on the reconciled candidate.
- [ ] Fresh authoritative run-1, run-2, comparison and promotion gate.
- [ ] Exact-HEAD security/architectural review without material findings.
- [ ] Merge/exact-main closure — not authorized.

## Remote Actions / Authorization

- Normal push to the existing TL-06 branch and reuse of Draft PR #69 are
  authorized after local verification.
- Merge, deploy, TL-07 and force push remain unauthorized.

## Handoff Notes

- Preserve the invitation-lifecycle remediation at the reviewed checkpoint.
- Preserve `apps/dev-preview-web/src/.DS_Store` as unrelated Owner material.
- Do not reopen Quality merely because a passing owner-scoped run is near its
  unchanged 240-second contract.

## Closure Predicate

The reconciled TL-06 branch preserves all authorized product and invitation
semantics; focused and canonical full verification pass on one exact HEAD;
fresh PR #69 run-1/run-2 materially execute owner-scoped 8/8 and TL-06 3/3,
comparison and promotion gate pass; security/architectural review has no
material findings; merge and exact-main closure remain separately authorized.
