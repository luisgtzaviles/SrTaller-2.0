# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Catalog Reset + Applied Batch Reversibility
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Blocked — Owner Decision required; Owner Acceptance pending
WIP: 1/1
Progress: 2 / 6 blocks completed
Current: Audit proved that physical CatalogItem deletion and applied-batch reversal are not safe under the current append-only model
Next: Owner decides lifecycle semantics, ADR-013 level/control and batch compensation boundary
Blocked: No approved safe-deletion model or sensitive-action policy exists for the requested mass operation
Last updated: 2026-09-14 MST

## Current checkpoint

- [x] Run Development Preflight and restore exact local runtime provenance.
- [x] Audit current CatalogItem relations, append-only guards, capabilities and applied-batch evidence.
- [!] Obtain Owner decisions for deletion/lifecycle semantics and ADR-013 classification.
- [ ] Correct the grid label from `Proveedor:` to `Original:` after the authorized iteration resumes.
- [ ] Implement only the approved reset/compensation boundary and focused coverage.
- [ ] Run the requested gates and prepare the governed Chrome scenario.

## Guardrails

- No PBI-042 or Advanced Supplier Reconciliation.
- No Inventory, Procurement, Caja, Repair Concepts, CSV/XLSX adapter or supplier API.
- No authoritative `verify:full` before Owner Acceptance.
- No hard delete, CASCADE, trigger bypass or false applied-batch reversal without
  an explicit Owner decision and reconciled architecture.
- Classifier and verified-tree remain shadow-only; no gates are omitted.
- No push, PR, merge, deploy, Production or inferred Owner Acceptance.
