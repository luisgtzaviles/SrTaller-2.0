# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-03 — Atomic Tenant Bootstrap + Starter Authority
iteration: 2 - Authorized Implementation
type: IMPLEMENTATION
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: feature/tl-03-atomic-tenant-bootstrap
base_sha: cca47e9204bfe0ad8c1cb78c08a506888b7b1535
status: ACTIVE
closure_mode: DERIVED
last_updated: 2026-09-21
-->

Milestone: Tenant Lifecycle MVP
Sprint: NONE
Current PBI: NONE
General State: Authorized implementation / Functional foundation
Progress: 1 / 8 implementation blocks complete
Current Work: Protected starter authority policy
Next Block: Transaction-aware owner persistence ports
Blocking: NONE
Last Updated: 2026-09-21

## Objective

Implement the atomic, idempotent server-side bootstrap foundation that establishes a newly verified Tenant and its first trusted administrative authority without exposing a public registration surface.

## Why

To execute one authorized objective with a transferable repository-native handoff.

## In Scope

- Audit current Tenant/User/Access/TL-02 persistence and transactions.
- Define the atomic/idempotent internal bootstrap contract.
- Define starter authority, schema delta, threat model and test plan.
- Identify Owner decisions before implementation.

## Out of Scope

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
- [x] Resolve Owner decisions TL3D-001–004.
- [x] Receive separate implementation authorization.
- [x] Block 1 — Tenant schema, trustworthy backfill and bootstrap journal.
- [~] Block 2 — Protected/versioned starter Role and capability policy.
- [ ] Block 3 — Transaction-aware owner persistence ports.
- [ ] Block 4 — Internal bootstrap domain/application contract.
- [ ] Block 5 — Atomic orchestration and sanitized audit.
- [ ] Block 6 — Idempotency, concurrency and failure injection.
- [ ] Block 7 — TL-02 login, isolation and operational-auth regression.
- [ ] Block 8 — Evidence, full verification and promotion handoff.

## Current

Implementing Block 2: protected starter Role metadata and exact administrative capability bundle.

## Next

Complete Block 2 with ordinary-mutation protection and focused regressions.

## Blockers

None.

## Important Discoveries

- TL-02 password verifiers are purpose-bound to Tenant + Admin Identity IDs;
  the Registration Attempt must reserve those IDs server-side before hashing.
- Current first-User, Role and Admin Identity repositories open independent
  transactions; TL-03 needs transaction-aware owner ports, not nested calls.
- Current capability catalog has no Tenant/Branch/Station lifecycle codes.
- Current Tenant schema has no display name, lifecycle, version or updated time.
- Existing workshop names have no authoritative source suitable for blind
  migration backfill.
- Block 1 materializes the only approved legacy mapping (`SR Taller`) and fails
  closed for every unexpected preexisting Tenant instead of fabricating a name.

## Focused Verification

- [x] Work Unit lifecycle check PASS in effective `BLOCKED` state.
- [x] Architecture policy, Markdown structure/relative links, documentation
  consistency, focused secret scan and `git diff --check` PASS.
- [x] Change classifier preserves `FULL` for a future promotion because the
  readiness contract is cross-module/high-risk; no gate was waived.
- [x] Block 1 typecheck/build and focused schema/ownership tests PASS.
- [x] PostgreSQL 18.4 applied the additive Tenant foundation migration; second
  execution reported `0 pending`.
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
