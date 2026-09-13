# Active Development Checklist

Milestone / Functional Goal: PBI-040 Owner iteration — catalog Type filter + unified safe delete
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-040 — Owner Review
Status: Ready for Owner Review; Owner Acceptance remains pending
WIP: 1/1
Progress: 5 / 5 implementation blocks complete
Current: Owner Review of Type filtering and safe-delete lifecycle
Next: Owner decides acceptance; no later gate is inferred
Blocked: None
Last updated: 2026-09-13 MST

## Catalog governance iteration

- [x] Audit authorities, real references and current lifecycle contracts by catalog
- [x] Add the governed Type filter to canonical and pending Price List references
- [x] Implement shared lifecycle actions and owner-specific transactional safe delete
- [x] Add synthetic fixtures and material/concurrent regression coverage
- [x] Run governed gates and leave Chrome prepared for Owner Review

## Required outcome

- Category and Brand administration derive Type filtering from the same
  applicability used by Nuevo artículo, including pending references.
- A canonical reference can be deleted only after the owner revalidates that no
  business or structural reference requires integrity; concurrent use wins.
- Used active references deactivate, used inactive references reactivate, and
  pending captures continue to resolve through reconciliation.
- Repairs and Price List keep separate bounded-context ownership while sharing
  lifecycle derivation, confirmation, conflict feedback and visual primitives.

## Boundaries

- [x] PBI-040 only; Owner Acceptance is not inferred
- [x] No PBI-041/PBI-042, import, Inventory, Caja or downstream implementation
- [x] No push, PR, merge to `main`, Preview deploy or Production
- [x] PBI-039/PBI-043 remain authoritative and are not reopened

The completed PBI-043 checklist remains preserved by Git history and its
closure evidence. The prior PBI-039 checklist remains in
[`history/PBI-039_ACTIVE_CHECKLIST.md`](history/PBI-039_ACTIVE_CHECKLIST.md).
