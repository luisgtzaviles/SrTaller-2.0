# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-05 — Branch Management V1 + Tenant Activation
iteration: 1 - Readiness
type: DISCOVERY
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: feature/tl-05-branch-management-readiness
base_sha: 34029bd4c0a892aba1a202444603bfd9c3c05f96
status: ACTIVE
closure_mode: DERIVED
last_updated: 2026-09-21
-->

## Status Snapshot

Current PBI: NONE

- **Milestone:** Tenant Lifecycle MVP.
- **Sprint:** none selected.
- **Current PBI:** none; Work Unit `TL-05` is in readiness only.
- **Overall status:** `OWNER DECISIONS REQUIRED`.
- **Progress:** `8 / 10` readiness steps complete.
- **Current work:** readiness audit and implementation contract complete.
- **Next block:** Owner resolves `TL5D-001–004` and explicitly authorizes or
  rejects implementation.
- **Blockers:** four scoped Owner decisions; no technical/runtime blocker.
- **Last updated:** 2026-09-21.

## Objective

Audit and define an implementation-ready Branch Management V1 and authoritative ONBOARDING-to-ACTIVE Tenant transition without implementing product functionality.

## Why

To execute one authorized objective with a transferable repository-native handoff.

## In Scope

- Audit the existing Branch aggregate, schema, repositories and operational relationships.
- Define Branch V1 commands in Tenant Admin Context.
- Define atomic Tenant activation and last-active-Branch concurrency protection.
- Define authorization, Level-2 reauth, timezone, migration, audit and minimal Admin UI boundaries.
- Produce implementation blocks, material test plan and explicit Owner decisions.

## Out of Scope

- Product code, schema migrations or data mutation.
- TL-06, Station enrollment, billing, plans or Super Admin.
- Push, PR, merge, deploy or infrastructure changes.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`TENANT_LIFECYCLE_MVP.md`](../architecture/TENANT_LIFECYCLE_MVP.md)
- [`ADR-015`](../decisions/proposed/ADR-015-tenant-administrative-control-plane.md)
- [`MULTITENANCY_MODEL.md`](../architecture/MULTITENANCY_MODEL.md)
- [`DATA_ARCHITECTURE.md`](../architecture/DATA_ARCHITECTURE.md)
- [`TL-05 readiness`](../architecture-readiness/tenant-lifecycle/TL-05_BRANCH_MANAGEMENT_TENANT_ACTIVATION_READINESS.md)

## Risks

- Legacy Branch rows have no persisted name; no mapping may be invented.
- Last-active-Branch enforcement must survive concurrent deactivation.
- Operational Branch settings currently expose a conflicting mutation path.
- Reactivation sensitivity is not yet explicitly approved.

## Plan

- [x] Audit baseline Git, Work Unit and applicable contracts.
- [x] Audit Branch schema, repository, data and Station relationships.
- [x] Audit Tenant activation and starter capability bundle.
- [x] Define Branch V1 commands and Admin Context authority.
- [x] Define atomic activation and last-active-Branch locking.
- [x] Define timezone, migration/backfill and audit contracts.
- [x] Define minimal Admin UI/onboarding scope.
- [x] Define implementation blocks and material test plan.
- [~] Obtain Owner decisions `TL5D-001–004`.
- [ ] Receive explicit implementation authorization.

## Current

Readiness complete; waiting for the four scoped Owner decisions before implementation can be authorized.

## Next

Owner resolves `TL5D-001–004`; then authorize or reject the proposed implementation scope.

## Blockers

- `TL5D-001`: duplicate Branch-name policy.
- `TL5D-002`: explicit first-Branch timezone versus product default.
- `TL5D-003`: reactivation sensitivity level.
- `TL5D-004`: authoritative names for legacy Branch rows.

## Important Discoveries

- Branch already exists under `stations`; it must be extended, not duplicated.
- `active` and `admission_revision` already protect Station/Session admission.
- Starter Tenant Admin policy v1 already contains all three Branch capabilities.
- Local PostgreSQL has 81 migrations, two active unnamed Branches and no effective Tenant Admin; it remains correctly `ONBOARDING`.
- Current operational timezone mutation must not remain an alternate authority after TL-05.

## Focused Verification

- [x] Read-only PostgreSQL schema/data/relationship audit.
- [x] Documentation links, policy consistency and secret scan.
- [x] Architecture and repository structure checks.
- [x] `git diff --check`.
- [x] `work-unit:check --mode ACTIVE`.

## Promotion Gates

- Existing authoritative promotion policy remains unchanged.
- The current classifier requires `FULL` before promotion because the readiness
  contract lives under `docs/architecture-readiness/`; that gate has not been
  claimed or bypassed in this decision-blocked iteration.

## Remote Actions / Authorization

- No remote action is implied by checklist initialization.

## Handoff Notes

- Permanent readiness artifact:
  [`TL-05_BRANCH_MANAGEMENT_TENANT_ACTIVATION_READINESS.md`](../architecture-readiness/tenant-lifecycle/TL-05_BRANCH_MANAGEMENT_TENANT_ACTIVATION_READINESS.md).
- No product implementation or database write occurred in this iteration.
- Preserve `apps/dev-preview-web/src/.DS_Store` untracked.
- TL-06 remains unstarted.

## Closure Predicate

For this discovery Work Unit: Owner decisions recorded, implementation contract
authorized or explicitly rejected, required local documentation gates PASS, and
the resulting repository-native handoff promoted under the normal Work Unit
lifecycle. This iteration does not satisfy that predicate by itself.
