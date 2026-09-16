# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Trusted history + bounded candidate matching
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Owner decisions approved — bounded implementation in progress
WIP: 1/1
Progress: 1 / 7 implementation blocks completed
Current: Schema and matching contracts
Next: Trusted exact auto-resolution, bounded candidates and exception-first UI
Blocked: None; AG v11 must remain unapplied
Last updated: 2026-09-15 MST

## Current checkpoint — Trusted history + bounded candidate matching

- [x] Record Owner decisions `CM-001..CM-009` and preserve the AG v11 baseline.
- [~] Add the minimum Tenant-safe persistence and matching contracts.
- [ ] Implement trusted exact auto-resolution and publish-only learning.
- [ ] Implement bounded read-only candidates and Owner decisions.
- [ ] Implement exception-first UI with inspectable resolved rows.
- [ ] Pass focused contracts, PostgreSQL, performance, typecheck/build and browser QA.
- [ ] Reanalyze AG v11 to `34 resolved / 2 attention` without applying it.

## Audit evidence

- `AG / v11`: Version `INGESTED`, Batch `RECONCILING`, unpublished.
- Stable outcome: `2 NEW/APPLY`, `34 UNCHANGED/UNRESOLVED`, every other classification `0`.
- The 34 exact rows have one consistent Source-scoped signature mapping and no correction; policy, not missing evidence, keeps them pending.
- `(liquidacion)` and `DISPLAY` create new title-bearing signatures; without supplier code/SKU/barcode and without candidate matching they become `NEW`.
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
