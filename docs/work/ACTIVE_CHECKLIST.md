# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-03 — Atomic Tenant Bootstrap + Starter Authority
iteration: 1 - Discovery and Readiness
type: DISCOVERY
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: feature/tl-03-atomic-tenant-bootstrap
base_sha: cca47e9204bfe0ad8c1cb78c08a506888b7b1535
status: BLOCKED
closure_mode: DERIVED
last_updated: 2026-09-21
-->

Milestone: Tenant Lifecycle MVP
Sprint: NONE
Current PBI: NONE
General State: Discovery / Owner decisions required
Progress: 7 / 9 readiness blocks complete
Current Work: Resolve TL3D-001–004
Next Block: Implementation authorization, if Owner decisions are approved
Blocking: Starter bundle, initial currency and legacy Tenant naming policy
Last Updated: 2026-09-21

## Objective

Audit and define the atomic, idempotent server-side bootstrap contract that establishes a newly verified Tenant and its first trusted administrative authority without implementing product functionality.

## Why

To execute one authorized objective with a transferable repository-native handoff.

## In Scope

- Audit current Tenant/User/Access/TL-02 persistence and transactions.
- Define the atomic/idempotent internal bootstrap contract.
- Define starter authority, schema delta, threat model and test plan.
- Identify Owner decisions before implementation.

## Out of Scope

- Product implementation, migrations and database writes.
- Public registration/email delivery (TL-04).
- Branch lifecycle/activation (TL-05), Users UI (TL-06) and Station enrollment.
- Admin UI, push, PR, merge or deploy.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`TENANT_LIFECYCLE_MVP.md`](../architecture/TENANT_LIFECYCLE_MVP.md)
- [`ADR-015`](../decisions/proposed/ADR-015-tenant-administrative-control-plane.md)
- [`DEC-049`](../decisions/dec-049-persistence-ownership/DECISION_PROPOSAL.md)
- [`TL-03 readiness`](../architecture-readiness/tenant-lifecycle/TL-03_ATOMIC_TENANT_BOOTSTRAP_READINESS.md)

## Risks

- Cross-owner atomicity must preserve single-owner persistence boundaries.
- Client-controlled elevation or pre-verification authority is forbidden.
- Credential material, IDs and idempotency must survive ambiguous retries
  without exposing secrets or creating orphan data.

## Plan

- [x] Revalidate repository/workflow and initialize TL-03.
- [x] Audit Tenant/User/Role/Capability/Admin Identity persistence.
- [x] Audit transaction and idempotency infrastructure.
- [x] Define bootstrap grant, result and cross-owner orchestration.
- [x] Define schema/migration requirements.
- [x] Define threat model and failure semantics.
- [x] Define incremental implementation blocks and test plan.
- [~] Resolve Owner decisions TL3D-001–004.
- [ ] Receive separate implementation authorization.

## Current

Readiness audit complete; waiting on four bounded Owner decisions.

## Next

Owner resolves TL3D-001–004; then implementation may be authorized without
restarting discovery.

## Blockers

- [!] Exact starter Tenant Admin capability bundle is not yet approved.
- [!] Initial currency and legacy Tenant display-name migration policy are not
  yet approved.
- [!] Workshop display-name uniqueness is not yet explicit.

## Important Discoveries

- TL-02 password verifiers are purpose-bound to Tenant + Admin Identity IDs;
  the Registration Attempt must reserve those IDs server-side before hashing.
- Current first-User, Role and Admin Identity repositories open independent
  transactions; TL-03 needs transaction-aware owner ports, not nested calls.
- Current capability catalog has no Tenant/Branch/Station lifecycle codes.
- Current Tenant schema has no display name, lifecycle, version or updated time.
- Existing workshop names have no authoritative source suitable for blind
  migration backfill.

## Focused Verification

- [x] Documentation/readiness: links, architecture consistency, secret scan and
  `git diff --check` selected.
- [ ] Implementation authorization will require unit/contracts, PostgreSQL
  18.4 migration/atomicity/concurrency/failure injection, TL-02 regressions,
  architecture, full promotion verification and security review.

## Promotion Gates

- Existing authoritative promotion policy remains unchanged.

## Remote Actions / Authorization

- No remote action is implied by checklist initialization.

## Handoff Notes

- Branch creation/switching is explicit and occurred before this command.

## Closure Predicate

Owner decisions approved, implementation completed on this branch, required
local verification PASS, checklist reconciled to `READY_FOR_PROMOTION`, one
authorized PR merged ordinarily, exact-main CI GREEN, closure ref published;
Preview/deploy are N/A unless separately authorized.
