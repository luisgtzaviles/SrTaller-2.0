# Active Development Checklist

Milestone / Functional Goal: PBI-040 final closure
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-040 — Done candidate after Preview PASS
Status: Archived after functional integration, exact-main CI and authenticated Preview validation
WIP: 0/1 — PBI-041 remains Ready, not selected or started
Progress: 9 / 9 closure blocks complete
Current: Closure evidence reconciled on `ops/pbi-040-roadmap-advance`
Next: Merge the documentary closure PR and require exact-main CI; do not start PBI-041
Blocked: None
Last updated: 2026-09-13 MST

## Closure blocks

- [x] Reconcile branch, baseline, PBI-043 ancestry and PBI-041 documentation-only boundary
- [x] Record explicit Owner Acceptance and Functional Freeze
- [x] Execute formal real-browser UI verification and remediate permitted findings
- [x] Run authoritative governed full verification without critical skips
- [x] Complete independent high-risk review with no open Critical/High/Medium findings
- [x] Publish PR #49 and obtain exact-head CI run-1/run-2/comparison PASS
- [x] Merge the accepted feature candidate and verify its exact-main CI
- [x] Remediate Preview migration chronology and bounded SPA routing through PR #50/#51
- [x] Deploy exact integrated `main` `09e14c8`, validate Preview and reconcile closure authorities

## Final material state

- Owner Acceptance was explicitly granted on 2026-09-13.
- PR #49 integrated Catalog/Pricing; PR #50 corrected only the still-pending
  migration chronology; PR #51 corrected the bounded SPA route allowlist.
- Authoritative exact-main CI `34809054770` passed run-1, run-2 and comparison
  on `09e14c89892f5770977c5028a899714b7a30d6d5`.
- Preview reports that exact clean revision and passes `/`, `/livez`, `/readyz`,
  direct Price List/Catalog routes and authenticated PBI-040 behavior.
- The Preview Administrator role has the six approved PBI-040 capabilities;
  both PBI-041 import capabilities remain disabled.
- PBI-039 Repair Detail and the PBI-043 concurrent-session baseline remain
  protected. Production was not changed.
- PBI-041 has no Composer, SupplierSource, SupplierCatalogVersion,
  SupplierListing, batch runtime, table, migration, endpoint or job.

## Closure semantics

This archived checklist records a `Done candidate`. Per the delivery workflow,
the merge of its documentary closure PR plus GREEN exact-main CI materializes
PBI-040 as `Done`; no additional PR is required merely to rewrite that wording.
`Done` remains distinct from `Released`: Production was not authorized.
