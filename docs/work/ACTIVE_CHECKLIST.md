# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-05 — Branch Management V1 + Tenant Activation
iteration: 2 - Implementation
type: PRODUCT
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
- **Current PBI:** none; Work Unit `TL-05` is implementing its authorized scope.
- **Overall status:** `IMPLEMENTATION IN PROGRESS`.
- **Progress:** `8 / 9` implementation blocks complete.
- **Current work:** canonical docs, verification topology and candidate freeze.
- **Next block:** authoritative `verify:full` on the frozen candidate.
- **Blockers:** none.
- **Last updated:** 2026-09-21.

## Objective

Implement Branch Management V1 and the authoritative ONBOARDING-to-ACTIVE
Tenant transition through the Tenant Admin Context.

## Why

To execute one authorized objective with a transferable repository-native handoff.

## In Scope

- Audit the existing Branch aggregate, schema, repositories and operational relationships.
- Define Branch V1 commands in Tenant Admin Context.
- Define atomic Tenant activation and last-active-Branch concurrency protection.
- Define authorization, Level-2 reauth, timezone, migration, audit and minimal Admin UI boundaries.
- Produce implementation blocks, material test plan and explicit Owner decisions.
- Materialize the approved schema, commands, HTTP surface, Admin UI and audit.
- Prove concurrency, authorization, tenant isolation and regression safety.

## Out of Scope

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

- Legacy mapping is exact-ID-only and must fail closed for any extra unnamed row.
- Last-active-Branch enforcement must survive concurrent deactivation.
- Operational Branch settings currently expose a conflicting mutation path.
- The operational timezone mutation must be retired without breaking reads.

## Plan

- [x] Audit baseline Git, Work Unit and applicable contracts.
- [x] Audit Branch schema, repository, data and Station relationships.
- [x] Audit Tenant activation and starter capability bundle.
- [x] Define Branch V1 commands and Admin Context authority.
- [x] Define atomic activation and last-active-Branch locking.
- [x] Define timezone, migration/backfill and audit contracts.
- [x] Define minimal Admin UI/onboarding scope.
- [x] Define implementation blocks and material test plan.
- [x] Record `TL5D-001–004` and explicit implementation authorization.
- [x] Block 2 — Branch V1 schema, migration and persistence.
- [x] Block 3 — transactional commands and Tenant activation.
- [x] Block 4 — Admin authorization and cross-Tenant protection.
- [x] Block 5 — Admin HTTP and operational-authority retirement.
- [x] Block 6 — Admin login/session shell.
- [x] Block 7 — Branch onboarding and management UI.
- [x] Block 8 — PostgreSQL concurrency, regression and browser QA.
- [~] Block 9 — canonical docs, full verification and candidate freeze.

## Current

The separate Admin Session gate, responsive shell, first-Branch onboarding,
list/create/edit and Level-2 lifecycle UX passed material local QA. Block 9 is active.

## Next

Reconcile canonical evidence and verification manifests, then freeze and run
the single authoritative full gate.

## Blockers

- None.

## Important Discoveries

- Branch already exists under `stations`; it must be extended, not duplicated.
- `active` and `admission_revision` already protect Station/Session admission.
- Starter Tenant Admin policy v1 already contains all three Branch capabilities.
- Local PostgreSQL has 84 migrations, two active fixture Branches and no effective Tenant Admin; it remains correctly `ONBOARDING`.
- Current operational timezone mutation must not remain an alternate authority after TL-05.
- Both legacy rows belong to Tenant `SR Taller`; Branch `...0101` has one
  active linked Station and Branch `...0102` has none.
- Approved mapping is exact-ID-only and identifies development fixtures, not
  Avicell business data or physical locations.
- Material Chrome QA found and corrected two integration defects before freeze:
  the Admin CSRF header name was inconsistent across session/Branch surfaces,
  and the first-Branch editor could flash for a Tenant with existing Branches.

## Focused Verification

- [x] Read-only PostgreSQL schema/data/relationship audit.
- [x] Documentation links, policy consistency and secret scan.
- [x] Architecture and repository structure checks.
- [x] `git diff --check`.
- [x] `work-unit:check --mode ACTIVE`.
- [x] Branch V1 schema tests and typecheck.
- [x] Local PostgreSQL migration apply plus second run `0 pending`.
- [x] Upgrade-safe Branch command snapshot migration on the already-migrated local database.
- [x] TL-05 PostgreSQL Branch command suite `3 / 3`.
- [x] Concurrent two-Branch deactivation leaves exactly one active Branch.
- [x] Focused Admin capability and Level-2 route contract tests `3 / 3`.
- [x] Admin UI contract tests `4 / 4`, typecheck and production build.
- [x] Material Admin login, duplicate-name create, edit/reload, deactivate and reactivate proof.
- [x] Desktop, 768 px, 640 px, light/dark and keyboard proof; no page-level horizontal overflow.

## Promotion Gates

- Existing authoritative promotion policy remains unchanged.
- The current classifier requires `FULL` before promotion because the readiness
  contract lives under `docs/architecture-readiness/`; it will run once on the
  frozen implementation candidate and is not bypassed.

## Remote Actions / Authorization

- No remote action is implied by checklist initialization.

## Handoff Notes

- Permanent readiness artifact:
  [`TL-05_BRANCH_MANAGEMENT_TENANT_ACTIVATION_READINESS.md`](../architecture-readiness/tenant-lifecycle/TL-05_BRANCH_MANAGEMENT_TENANT_ACTIVATION_READINESS.md).
- Product implementation is authorized locally; no remote action is implied.
- Preserve `apps/dev-preview-web/src/.DS_Store` untracked.
- TL-06 remains unstarted.

## Closure Predicate

For this product Work Unit: authorized scope implemented, focused and full
verification PASS, Owner-reviewable browser proof complete, candidate promoted,
merged under explicit authority, exact-main CI GREEN and deterministic closure
ref published. This local iteration does not satisfy that predicate by itself.
