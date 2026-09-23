# Active Work Unit Checklist

Current PBI: NONE

<!-- WORK_UNIT_METADATA
work_unit: TL-07 — Station Inventory + Enrollment Authority
iteration: 2 - Authorized implementation
type: PRODUCT
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: feature/tl-07-station-inventory-enrollment-readiness
base_sha: 74fe2b5fd5b66ee48428953f3e027f2815c839ca
status: BLOCKED
closure_mode: DERIVED
last_updated: 2026-09-22
-->

## Objective

Implement Tenant-administered Station inventory and enrollment authority while preserving the existing trusted Station/PIN boundary and reserving redemption for TL-08.

## Why

Materialize the approved TL-07 authority, lifecycle and administrative UX with fail-closed tenancy and trust semantics.

## In Scope

- Station Inventory V1 reads and rename.
- Enrollment issue/cancel with immutable Branch/name authority, ten-minute TTL,
  one-time secret presentation and digest-only persistence.
- Unlink, initiate relink and terminal revoke with trust/session invalidation.
- Branch-scoped Admin authorization, tenant isolation, audit and concurrency.
- Admin HTTP/UI `Dispositivos`, QR/manual-code presentation and Level-2 UX.
- Additive migration/backfill for the exact approved legacy Station mapping.

## Out of Scope

- Device redemption, activation or operational handoff owned by TL-08.
- Station reactivation, physical delete, generic lifecycle patch, MDM,
  fingerprint authority and invented telemetry.
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
- Enrollment authority must be useful to TL-08 without implementing or
  accidentally exposing a production redemption endpoint in TL-07.

## Plan

- [x] Initialize the governed Work Unit from exact synchronized `main`.
- [x] Audit accepted Station, Tenant, Branch, Admin and Session contracts.
- [x] Audit current code, persistence, HTTP/UI surfaces and trust writers.
- [x] Inspect local legacy Station inventory read-only.
- [x] Materialize the implementation-ready TL-07 readiness contract.
- [x] Record Owner decisions `TL7D-001`–`TL7D-006`.
- [x] Implement Station domain, additive schema and exact legacy backfill.
- [x] Implement inventory/enrollment/lifecycle application services and ports.
- [x] Implement Branch-scoped authorization and Admin HTTP surface.
- [x] Implement `Dispositivos` Admin UI and secure one-time presentation.
- [x] Prove PostgreSQL concurrency, tenancy, trust invalidation and regressions.
- [!] Complete responsive/accessibility proof and canonical `verify:full`.
- [ ] Reconcile evidence/checklist and freeze a promotion-ready local candidate.

## Current

TL-07 implementation and local product proof are complete. The one authorized
canonical `verify:full` failed in the owner-scoped PostgreSQL campaign because
the historical Operational Session fixture still crossed the TL-07 Station
schema boundary incorrectly. That fixture is remediated and its focused
PostgreSQL test passes; a fresh canonical full gate has not been authorized or
executed on the remediated HEAD.

## Next

Await explicit Owner authorization for one fresh canonical `verify:full` on
the remediated exact HEAD. Do not promote and do not start TL-08.

## Blockers

Canonical `verify:full` has not passed on the remediated exact HEAD. The prior
run is a real failed gate and cannot be reused or retried automatically.

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
- The repository now defines 89 migrations; local PostgreSQL 18.4 applies all
  89 and a second migration run reports `0 pending`.
- Owner fixed the exact legacy mapping `...0401` to
  `SR Taller Fixture — Dispositivo 1`; any other unnamed legacy row must fail
  closed rather than receive an invented value.
- Challenge cancellation is Level 1; issue, unlink, relink and terminal revoke
  remain Level 2 through TL-02 reauthentication.
- The Admin UI proof used a synthetic local Admin identity, emitted then
  canceled one synthetic challenge, and did not mutate the existing Station.
- Chrome desktop/768/640, light/dark, focus trap, Tab/Shift+Tab, Escape and
  restore focus pass without horizontal page overflow.
- The historical PIN fixture and Operational Session fixture must seed only
  columns present at their intentionally rolled-back schema. The Session
  fixture now uses the single Owner-approved legacy Station mapping, preserves
  the alternate credential as revoked, and creates its second Station only
  after TL-07 is reapplied.

## Focused Verification

- [x] Readiness baseline: links, architecture, secrets, diff, lifecycle and
  focused Station/Session tests 33/33 PASS.
- [x] Domain/schema and migration rerun proof: 89 migrations, `0 pending`.
- [x] Application/HTTP/authorization focused tests.
- [x] PostgreSQL concurrency and Alpha/Beta proof: TL-07 `3/3` PASS.
- [x] UI desktop/768/640, keyboard/a11y and light/dark proof.
- [x] Station/PIN/Operational Session regression suites.
- [!] Canonical `verify:full`: the authorized run failed in Stage 4 at the
  historical Operational Session fixture; its focused remediation now passes,
  but no fresh full run has been authorized.

## Promotion Gates

- Implementation, focused verification, material TL-07 PostgreSQL and UI proof
  pass. Promotion remains blocked until canonical `verify:full` passes on the
  remediated exact HEAD.

## Remote Actions / Authorization

- Owner authorized local implementation and logical local commits.
- Push, PR, merge and deploy remain unauthorized.

## Handoff Notes

- Branch creation/switching is explicit and occurred before this command.
- Preserve `apps/dev-preview-web/src/.DS_Store`; it is unrelated and remains
  untracked.
- TL-08 remains explicitly unstarted and production redemption is forbidden.

## Closure Predicate

TL-07 becomes `READY_FOR_PROMOTION` only when all approved inventory,
enrollment-authority, lifecycle, authorization, audit, HTTP and Admin UI blocks
are implemented; material PostgreSQL/concurrency, trust/PIN/session regressions,
responsive accessibility and canonical `verify:full` pass on one exact HEAD;
the tracked tree is clean; and TL-08 remains unstarted.
