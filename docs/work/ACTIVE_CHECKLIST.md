# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Historical Reactivation Semantics
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Historical reactivation ready for Owner Review — Acceptance pending
WIP: 1/1
Progress: 6 / 6 blocks completed
Current: Owner may review the applied AG result and active price list side by side
Next: Owner decision only; integration gates remain unauthorized
Blocked: None; Acceptance and integration remain unauthorized
Last updated: 2026-09-14 MST

## Current checkpoint — historical reactivation

- [x] Preserve and audit the existing 36-conflict AG fixture, itemIds, mappings and revisions.
- [x] Promote `REACTIVATE` semantics in PBI-041 architecture and evidence contracts.
- [x] Implement deterministic analysis, atomic publication and comprehensible UI.
- [x] Add positive, negative, concurrency, rollback and idempotency coverage.
- [x] Run focused/domain/PostgreSQL/build/typecheck/preflight/provenance gates.
- [x] Apply the material AG batch and prepare both final Chrome surfaces.

## Owner Review evidence

- Historical Tenant: 1,539 active items retired in two governed operations;
  active list at zero while identifiers, revisions, mappings, batches and
  reconciliation memory remain.
- Historical re-intake: `AG / Versión 1.2` reanalizó como 0 New / 36 Reactiva,
  sin UUID manual, y se aplicó sobre los mismos 36 itemId/SKU/barcode.
- El Tenant conserva 1,539 identidades: 36 activas y 1,503 inactivas; se
  anexaron exactamente 36 revisiones de precio, costo, Resolution MATCHED y
  audit events de reactivación.
- Virgin Tenant: isolated PostgreSQL fixture proves a true first intake of 36
  New rows without deleting or altering the historical Tenant.
- Build/typecheck, 33 contratos focalizados y PostgreSQL material con 67
  migraciones son PASS. `verify:full` permanece deliberadamente sin ejecutar.

## Guardrails

- No PBI-042 or Advanced Supplier Reconciliation.
- No Inventory, Procurement, Caja, Repair Concepts, CSV/XLSX adapter or supplier API.
- No authoritative `verify:full` before Owner Acceptance.
- No hard delete, CASCADE, trigger bypass or false applied-batch reversal.
- Classifier and verified-tree remain shadow-only; no gates are omitted.
- No push, PR, merge, deploy, Production or inferred Owner Acceptance.
