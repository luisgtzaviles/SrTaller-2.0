# Active Development Checklist

Milestone / Functional Goal: PBI-040 Owner iteration — canonical merge + edit reference parity
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-040 — Owner Review
Status: In progress; Owner Acceptance remains pending
WIP: 1/1
Progress: 3 / 5 implementation blocks complete
Current: Run governed regression and migration gates
Next: Validate browser/runtime and reconcile final evidence
Blocked: None
Last updated: 2026-09-13 MST

## Canonical merge + edit reference parity iteration

- [x] Audit Catalog/Repairs dependencies, merge invariants and shared primitives
- [x] Implement transactional Catalog Category/Brand merge with history
- [x] Give item editing the same inline reference behavior as creation
- [~] Cover concurrency, isolation, lifecycle, filters and responsive UX
- [ ] Run governed gates, reconcile evidence and prepare Chrome

## Required outcome

- Two or more compatible Catalog canonical references merge explicitly into a
  selected survivor without losing item links, pending history or audit.
- Category merge remains same Tenant + same Type; Brand merge unions valid
  applicability. Merged sources never reappear as ordinary or deletable canon.
- Edit item reuses the creation combobox/contract for existing, exact, expansion
  and new pending Category/Brand references.
- Repairs catalogs are audited before any reuse; no domain semantics are inferred.

## Boundaries

- [x] PBI-040 only; Owner Acceptance is not inferred
- [x] No PBI-041/PBI-042, import, Inventory, Caja or downstream implementation
- [x] No push, PR, merge to `main`, Preview deploy or Production
- [x] PBI-039/PBI-043 remain authoritative and are not reopened

The completed PBI-043 checklist remains preserved by Git history and its
closure evidence. The prior PBI-039 checklist remains in
[`history/PBI-039_ACTIVE_CHECKLIST.md`](history/PBI-039_ACTIVE_CHECKLIST.md).
