# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Real Supplier Paste + Spreadsheet Ergonomics
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Owner iteration complete — ready for Owner Review; Owner Acceptance pending
WIP: 1/1
Progress: 5 / 5 blocks completed
Current: Owner Review of the persisted 36-row synthetic Supplier Draft in Chrome
Next: Wait for Owner decision; do not run functional freeze or start another PBI
Blocked: None
Last updated: 2026-09-14 MST

## Current checkpoint

- [x] Reconcile the Owner iteration with the clean PBI-041 candidate and its authorities.
- [x] Add focused contracts for trailing-empty trimming, Batch Context, title proposal and grid interactions.
- [x] Implement the real `Título | Costo | Precio` paste flow and spreadsheet ergonomics.
- [x] Re-run focused gates and measure 1,500/10,000-row behavior without `verify:full`.
- [x] Prepare the exact 36-row synthetic Owner case in Chrome and reconcile evidence.

## Guardrails

- No PBI-042 or Advanced Supplier Reconciliation.
- No Inventory, Procurement, Caja, Repair Concepts, CSV/XLSX adapter or supplier API.
- No authoritative `verify:full` before Owner Acceptance.
- No matching, publish or version-comparison semantics change in this Owner iteration.
- Classifier and verified-tree remain shadow-only; no gates are omitted.
- No push, PR, merge, deploy, Production or inferred Owner Acceptance.
