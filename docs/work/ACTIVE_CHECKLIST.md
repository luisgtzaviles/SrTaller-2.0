# Active Development Checklist

Milestone / Functional Goal: PBI-040 final closure
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-040 — Owner Accepted; Functional Freeze
Status: Final Verification in progress
WIP: 1/1 — PBI-041 remains Ready, not selected or started
Progress: 2 / 8 closure blocks complete
Current: Formal UI Verification of the frozen candidate
Next: High-risk review and authoritative full verification
Blocked: None
Last updated: 2026-09-13 MST

## Closure blocks

- [x] Reconcile branch, baseline, PBI-043 ancestry and PBI-041 documentation-only boundary
- [x] Record explicit Owner Acceptance and Functional Freeze
- [~] Execute formal real-browser UI verification and remediate permitted findings
- [ ] Run authoritative governed full verification without critical skips
- [ ] Complete independent high-risk review with no open Critical/High/Medium findings
- [ ] Publish PR and obtain exact-head CI run-1/run-2/comparison PASS
- [ ] Merge, verify exact main and deploy/validate Preview without touching Production
- [ ] Reconcile closure authorities, archive checklist and remove absorbed branch

## Functional freeze

- PBI-040 may receive only corrections, hardening, accessibility, regression,
  security, consistency, performance, review findings and closure evidence.
- PBI-041 is documentation/readiness only: no Composer, SupplierSource,
  SupplierCatalogVersion, SupplierListing, batch engine, migration, endpoint,
  UI or job implementation.
- Production, Inventory, Procurement, Caja, Repair Concepts and all subsequent
  PBIs remain outside this goal.

## Owner decision

Owner Acceptance was explicitly granted on 2026-09-13 for the material
PBI-040 surface, including individual create/edit, Catalog governance,
identifiers, pricing/cost protection, pending reconciliation, safe lifecycle and
canonical merge. This acceptance does not make the PBI Done before the remaining
technical, integration and Preview gates pass.

The completed PBI-043 and PBI-039 checklists remain preserved in Git history and
`docs/work/history/`.
