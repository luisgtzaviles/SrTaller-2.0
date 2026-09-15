# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Catalog Reset + Applied Batch Reversibility
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Ready for Owner Review — Owner Acceptance pending
WIP: 1/1
Progress: 6 / 6 blocks completed
Current: Owner Review of the governed Historical/Virgin evidence and local UI
Next: Owner decides Acceptance; no integration gate is authorized yet
Blocked: None for Owner Review; Acceptance and integration remain unauthorized
Last updated: 2026-09-14 MST

## Current checkpoint

- [x] Run Development Preflight and restore exact local runtime provenance.
- [x] Audit current CatalogItem relations, append-only guards, capabilities and applied-batch evidence.
- [x] Promote Owner decisions for lifecycle semantics and ADR-013 classification.
- [x] Correct the grid label from `Proveedor:` to `Original:`.
- [x] Implement the approved retirement boundaries and focused coverage.
- [x] Prepare the governed local runtime and Chrome scenario.

## Owner Review evidence

- Historical Tenant: 1,539 active items retired in two governed operations;
  active list at zero while identifiers, revisions, mappings, batches and
  reconciliation memory remain.
- Historical re-intake: the same 36 AG rows are 0 New / 36 Conflict and require
  explicit reactivation; `Original:` is visible.
- Virgin Tenant: isolated PostgreSQL fixture proves a true first intake of 36
  New rows without deleting or altering the historical Tenant.
- Build, 71 focused contracts, the 885-test base campaign and PostgreSQL
  material are green. `verify:full` remains deliberately unexecuted.

## Guardrails

- No PBI-042 or Advanced Supplier Reconciliation.
- No Inventory, Procurement, Caja, Repair Concepts, CSV/XLSX adapter or supplier API.
- No authoritative `verify:full` before Owner Acceptance.
- No hard delete, CASCADE, trigger bypass or false applied-batch reversal.
- Classifier and verified-tree remain shadow-only; no gates are omitted.
- No push, PR, merge, deploy, Production or inferred Owner Acceptance.
