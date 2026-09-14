# Active Development Checklist

Milestone / Functional Goal: PBI-041 Bulk Catalog Composer architecture + readiness
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-040 — Owner Review
Status: PBI-041 architecture/readiness PASS; implementation remains unauthorized
WIP: 1/1 — PBI-041 is Candidate/Ready, not selected or started
Progress: 6 / 6 readiness blocks complete
Current: Ready for Owner review of architecture/readiness
Next: Owner reviews readiness and separately completes PBI-040 acceptance/closure
Blocked: None
Last updated: 2026-09-13 MST

## PBI-041 architecture and readiness

- [x] Reconcile mandatory authorities and preserve PBI-040 Owner Review/WIP
- [x] Promote Owner decisions OD-BI-001..010 into canonical decision/architecture docs
- [x] Separate SupplierSource/Version/Listing/Resolution/Memory from CatalogUpdateBatch
- [x] Define ownership, identity, lifecycles, matching, retention and performance budgets
- [x] Refine PBI-041 and create Persistence Design, Threat Model, Test Strategy and DoR
- [x] Verify links, states, structure, diff hygiene and zero product/migration changes

## Ready outcome

- PBI-041 is **Initial Bulk Catalog Composer + Versioned Supplier Intake**.
- Composer is primary; CSV/XLSX/API remain adapters to the same future engine.
- CatalogItem remains permanent SR Taller identity; SupplierListing is external evidence.
- Exact historical mappings may be preselected only when unique/consistent and
  remain visible in preview until batch confirmation.
- Raw evidence expires after 90 days; the approved structured subset, mappings,
  Catalog diffs and audit remain permanent with cost protection.
- Advanced Supplier Reconciliation remains a deferred outcome without PBI ID,
  selection or readiness.

## Boundaries

- [x] Documentation/governance only; no product code, migration, endpoint, UI, job or DB change
- [x] PBI-040 remains Owner Review; Owner Acceptance/Done not inferred
- [x] PBI-041 is Ready but not selected, implemented or accepted
- [x] PBI-042 and Advanced Supplier Reconciliation are not started
- [x] No Inventory, Procurement, Caja, Repair Concepts or downstream implementation
- [x] No push, PR, merge, Preview deploy or Production change

The completed PBI-043 checklist remains preserved by Git history and its
closure evidence. The prior PBI-039 checklist remains in
[`history/PBI-039_ACTIVE_CHECKLIST.md`](history/PBI-039_ACTIVE_CHECKLIST.md).
