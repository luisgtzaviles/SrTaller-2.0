# Active Development Checklist

Milestone / Functional Goal: PBI-040 Owner iteration — unified catalog reconciliation
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-040 — Owner Review
Status: Ready for Owner Review; Owner Acceptance remains pending
WIP: 1/1
Progress: 5 / 5 implementation blocks complete
Current: Owner can compare the three pending-reference surfaces in Chrome
Next: Owner review and explicit acceptance decision
Blocked: None
Last updated: 2026-09-13 MST

## Unified catalog reconciliation

- [x] Reconcile current authority, branch state, Repairs pattern and Price List divergence
- [x] Implement captured Category/Brand references, canonical resolution and traceability
- [x] Reuse the Repairs canonical/pending administration pattern in Price List
- [x] Add governed fixtures and validate both resolution modes and regressions
- [x] Run governed gates and leave Chrome prepared for Owner Review

## Required outcome

- Inline Category/Brand values remain captured pending references until resolved.
- Resolution associates an existing compatible canonical or creates a new canonical.
- Raw value, applicability, usage, timestamps, actor and resolution remain traceable.
- Only active canonical references feed commercial filters.
- Repairs and Price List keep separate bounded-context ownership while sharing the
  same reconciliation language and interaction primitives.

## Boundaries

- [x] PBI-040 only; Owner Acceptance is not inferred
- [x] No PBI-041/PBI-042, import, Inventory, Caja or downstream implementation
- [x] No push, PR, merge to `main`, Preview deploy or Production
- [x] PBI-039/PBI-043 remain authoritative and are not reopened

The completed PBI-043 checklist remains preserved by Git history and its
closure evidence. The prior PBI-039 checklist remains in
[`history/PBI-039_ACTIVE_CHECKLIST.md`](history/PBI-039_ACTIVE_CHECKLIST.md).
