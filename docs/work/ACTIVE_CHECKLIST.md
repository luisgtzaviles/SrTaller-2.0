# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Trusted history + bounded candidate matching
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Trusted history + bounded candidates ready for Owner Review
WIP: 1/1
Progress: 7 / 7 implementation blocks completed
Current: Owner Review of AG v11 exceptions
Next: Owner decision; no Acceptance inferred and no Apply Batch performed
Blocked: None; AG v11 must remain unapplied
Last updated: 2026-09-15 MST

## Current checkpoint — Trusted history + bounded candidate matching

- [x] Record Owner decisions `CM-001..CM-009` and preserve the AG v11 baseline.
- [x] Add the minimum Tenant-safe persistence and matching contracts.
- [x] Implement trusted exact auto-resolution and publish-only learning.
- [x] Implement bounded read-only candidates and Owner decisions.
- [x] Implement exception-first UI with inspectable resolved rows.
- [x] Pass focused contracts, PostgreSQL, performance, typecheck/build and browser QA.
- [x] Reanalyze AG v11 to `34 resolved / 2 attention` without applying it.

## Audit evidence

- `AG / v11`: Version `INGESTED`, Batch `RECONCILING`, unpublished.
- Baseline preserved before reanalysis: `2 NEW/APPLY`, `34 UNCHANGED/UNRESOLVED`.
- Result after governed reanalysis: `34 UNCHANGED/APPLY/TRUSTED_HISTORY` and
  `2 CANDIDATE/UNRESOLVED`, batch still `RECONCILING` and unpublished.
- Row 1 proposes the historical screen with `liquidacion` as observed-only;
  row 2 proposes `Pantalla` for the `Display` observation. Both retain null
  target until the Owner chooses.
- CatalogItems `39`, Resolutions `108` and ReconciliationMemory `36` remained
  unchanged; no learning or publication occurred.
- Recommended boundary: trusted exact identity may auto-resolve but never auto-publish; non-exact matching remains read-only and human-confirmed.
- Canonical output: `docs/domain/PRICE_LIST_CANDIDATE_MATCHING_AND_TRUSTED_HISTORY_AUDIT.md`.

## Guardrails

- No PBI-042 or reusable group transformations from Advanced Supplier Reconciliation.
- No Inventory, Procurement, Caja, Repair Concepts, CSV/XLSX adapter or supplier API.
- No authoritative `verify:full` before Owner Acceptance.
- No hard delete of CatalogItem, published Supplier history, mappings, memory or revisions.
- Classifier and verified-tree remain shadow-only; no gates are omitted.
- No automatic batch apply, DB reset, push, PR, merge, Preview, Production or
  deploy. AG v11 may be reanalyzed only after the focused gates are green.
