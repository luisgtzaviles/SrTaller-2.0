# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Synthetic Demo fixture cleanup
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Ready for Owner Review — Demo removed from LOCAL; Acceptance pending
WIP: 1/1
Progress: 5 / 5 blocks completed
Current: Owner may verify that LOCAL contains AG and no persistent Proveedor Demo
Next: Owner decision only; `verify:full` and integration remain unauthorized
Blocked: None; Owner Acceptance remains pending
Last updated: 2026-09-15 MST

## Current checkpoint — Synthetic Demo fixture cleanup

- [x] Remove `Caso Owner · 36`, `Demo V1 · 1500` and `Demo V2 · 1500` from the operational UI while retaining deterministic internal QA coverage.
- [x] Prove that Source `1dbec1cf-eb2e-4f96-b3f0-caab42316855`, its three Versions and 1,500 CatalogItems form an isolated synthetic genealogy.
- [x] Execute one fail-closed, serializable LOCAL cleanup without changing productive Supplier delete guards.
- [x] Verify PostgreSQL, FK/orphans, API, Lista de precios and Composer reload: AG remains, Demo is absent and 36 active items survive.
- [x] Pass focused Composer/cleanup contracts, architecture, typecheck, build and PBI-041 PostgreSQL material.

## Owner Review state

- `AG`: 8 Versions with published history; hard delete is blocked.
- `Proveedor Demo`: absent after governed LOCAL fixture cleanup; 3 Versions, 4,500 Listings and 1,500 exclusive synthetic items were removed together.
- `CatalogItem`: 39 remain; 36 active AG items and 3 inactive non-Demo seed items.
- `SKU`/barcode: 39 of each remain; AG keeps its 36 exact item identities and reconciliation memory.
- Composer reload and authenticated API return only AG; Lista de precios returns 36 active commercial items.
- Productive Supplier deletion remains unchanged: published/dependent history is still blocked and the cleanup has no HTTP endpoint or capability bypass.
- Local database migrated in place from 67 to 69 migrations; no reset or volume replacement occurred.
- Cleanup/Composer contracts: 23 PASS. Architecture, typecheck and build: PASS. PBI-041 PostgreSQL material: 1 PASS with 69 migrations.

## Guardrails

- No PBI-042 or Advanced Supplier Reconciliation.
- No Inventory, Procurement, Caja, Repair Concepts, CSV/XLSX adapter or supplier API.
- No authoritative `verify:full` before Owner Acceptance.
- No hard delete of CatalogItem, published Supplier history, mappings, memory or revisions.
- Classifier and verified-tree remain shadow-only; no gates are omitted.
- No DB reset, push, PR, merge, Preview, Production or deploy.
