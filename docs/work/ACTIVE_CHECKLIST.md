# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-07 — Station Inventory + Enrollment Authority
iteration: 1 - Readiness and Owner decisions
type: PRODUCT
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: feature/tl-07-station-inventory-enrollment-readiness
base_sha: 74fe2b5fd5b66ee48428953f3e027f2815c839ca
status: ACTIVE
closure_mode: DERIVED
last_updated: 2026-09-22
-->

## Objective

Audit and define implementation-ready Station inventory and enrollment authority contracts without implementing product functionality.

## Why

To execute one authorized objective with a transferable repository-native handoff.

## In Scope

- Audit the current Station, binding, credential and trusted-context runtime.
- Inspect legacy local Station data without writes or secret exposure.
- Define Station Inventory V1, enrollment authority, lifecycle, relink,
  authorization, audit, migration, UI and test contracts.
- Identify the minimum Owner decisions required before implementation.

## Out of Scope

- Product/runtime/schema implementation.
- Device redemption, activation or operational handoff owned by TL-08.
- Push, PR, merge, deploy, infrastructure and unrelated cleanup.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)

## Risks

- Existing Station persistence does not materialize the append-only binding
  history already required by the accepted PBI-024 design.
- Station trust changes must immediately deny PIN login and existing
  Operational Sessions without crossing persistence ownership boundaries.
- Admin authorization currently resolves only tenant-wide capabilities; TL-07
  needs a branch-scoped control-plane path consistent with TL-06.
- Legacy Station rows have no persisted display name and cannot receive an
  invented name during migration.

## Plan

- [x] Initialize the governed Work Unit from exact synchronized `main`.
- [x] Audit accepted Station, Tenant, Branch, Admin and Session contracts.
- [x] Audit current code, persistence, HTTP/UI surfaces and trust writers.
- [x] Inspect local legacy Station inventory read-only.
- [x] Materialize the implementation-ready TL-07 readiness contract.
- [x] Reconcile PBI-031 and the documentation index.
- [x] Run proportional architecture, link, secret, diff and lifecycle checks.
- [!] Obtain the Owner decisions required before implementation.

## Current

Readiness contract and PBI-031 reconciliation are complete; the Work Unit is
stopped before implementation for six explicit Owner decisions.

## Next

Owner resolves `TL7D-001`–`TL7D-006`; a later explicitly authorized iteration
may then implement TL-07. TL-08 remains unstarted.

## Blockers

- Owner must define the legacy local Station display name.
- Owner must approve the visible enrollment artifact and the exact semantics
  of unlink/relink before product implementation begins.

## Important Discoveries

- Current production runtime has no Station administration or enrollment
  endpoint. `POST /api/stations/local-bootstrap` is development-only and only
  sets the cookie derived from the governed local fixture.
- Station trust is currently `(Station active + binding current + Branch
  active + credential current)` with monotonic admission revisions.
- Credential, binding, Station or Branch revocation/state change denies a new
  trusted context; stale Operational Sessions cannot regain validity.
- Current `station_bindings` primary key allows one row per Station and the
  local seed overwrites `branch_id`; this does not satisfy the accepted
  append-only relink history and must be migrated in implementation.
- Local PostgreSQL 18.4 contains one active Station, one active credential and
  one current binding to `SR Taller Fixture — Hermosillo`; no display-name
  field exists for the Station. The inspection made zero writes.
- The repository currently defines 88 migrations; local data has 87 applied.
  No migration was run in this readiness iteration.

## Focused Verification

- [x] Markdown local links.
- [x] `verify:architecture`.
- [x] Focused Station/Operational Session tests: 33/33 PASS.
- [x] Secret-pattern scan of added lines.
- [x] `git diff --check`.
- [x] `work-unit:check --mode ACTIVE`.

## Promotion Gates

- Existing authoritative promotion policy remains unchanged.

## Remote Actions / Authorization

- No remote action is implied by checklist initialization.

## Handoff Notes

- Branch creation/switching is explicit and occurred before this command.
- Preserve `apps/dev-preview-web/src/.DS_Store`; it is unrelated and remains
  untracked.
- No product, schema, runtime or local data write is authorized in iteration 1.

## Closure Predicate

TL-07 readiness is reviewable when the current implementation and legacy data
are truthfully audited, the V1 command/security/migration/UI/test contracts are
implementation-ready, all unresolved Owner decisions are explicit, and the
documentation-only gates pass. This does not authorize implementation.
