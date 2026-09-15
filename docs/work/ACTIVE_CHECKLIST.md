# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Composer Workspace + Actionable Validation
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Composer workspace and actionable validation ready for Owner Review; Owner Acceptance pending
WIP: 1/1
Progress: 6 / 6 blocks completed
Current: Owner Review of the 36-row synthetic case with three navigable validation errors in Chrome
Next: Wait for Owner decision; do not run functional freeze or start another PBI
Blocked: None
Last updated: 2026-09-14 MST

## Current checkpoint

- [x] Reconcile the Owner iteration with the active PBI-041 candidate and authorities.
- [x] Reproduce and classify the exact generic save failure before changing the UX.
- [x] Add structured, deterministic batch/cell/global validation contracts.
- [x] Implement the compact grid-first workspace, Toast feedback and navigable errors.
- [x] Run focused UI, typecheck, build and PostgreSQL gates without `verify:full`.
- [x] Validate 1280/768/640, light/dark, keyboard and virtualized error navigation; prepare Chrome and evidence.

## Guardrails

- No PBI-042 or Advanced Supplier Reconciliation.
- No Inventory, Procurement, Caja, Repair Concepts, CSV/XLSX adapter or supplier API.
- No authoritative `verify:full` before Owner Acceptance.
- No matching, reconciliation, publish, pricing or version-comparison semantics change in this Owner iteration.
- Classifier and verified-tree remain shadow-only; no gates are omitted.
- No push, PR, merge, deploy, Production or inferred Owner Acceptance.
