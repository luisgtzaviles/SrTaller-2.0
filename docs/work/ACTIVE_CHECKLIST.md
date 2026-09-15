# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Catalog Reset + Applied Batch Reversibility
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Owner Review preparation — Owner Acceptance pending
WIP: 1/1
Progress: 5 / 6 blocks completed
Current: Prepare the governed local runtime and final Chrome Owner Review state
Next: Owner reviews Historical/Virgin scenarios and both retirement actions
Blocked: None for Owner Review; Acceptance and integration remain unauthorized
Last updated: 2026-09-14 MST

## Current checkpoint

- [x] Run Development Preflight and restore exact local runtime provenance.
- [x] Audit current CatalogItem relations, append-only guards, capabilities and applied-batch evidence.
- [x] Promote Owner decisions for lifecycle semantics and ADR-013 classification.
- [x] Correct the grid label from `Proveedor:` to `Original:`.
- [x] Implement the approved retirement boundaries and focused coverage.
- [~] Prepare the governed local runtime and Chrome scenario.

## Guardrails

- No PBI-042 or Advanced Supplier Reconciliation.
- No Inventory, Procurement, Caja, Repair Concepts, CSV/XLSX adapter or supplier API.
- No authoritative `verify:full` before Owner Acceptance.
- No hard delete, CASCADE, trigger bypass or false applied-batch reversal.
- Classifier and verified-tree remain shadow-only; no gates are omitted.
- No push, PR, merge, deploy, Production or inferred Owner Acceptance.
