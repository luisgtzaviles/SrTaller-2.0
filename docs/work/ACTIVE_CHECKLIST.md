# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Canonical title + Supplier observed title history
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Canonical title/history ready for Owner Review
WIP: 1/1
Progress: 8 / 8 implementation blocks completed
Current: Owner Review of the two AG title choices
Next: Owner may choose KEEP/ADOPT; no Acceptance inferred and no Apply Batch performed
Blocked: None; AG review fixture must remain unapplied
Last updated: 2026-09-16 MST

## Current checkpoint — Canonical title + observed-title history

- [x] Audit Catalog title, Supplier evidence, Resolution/Memory, search and AG state.
- [x] Separate stable identity, canonical current title and observed-title history.
- [x] Add explicit KEEP/ADOPT decision with safe default and provisional UI.
- [x] Apply rename only inside the atomic publish transaction with audit provenance.
- [x] Add indexed, deduplicated, Tenant-scoped historical-title search.
- [x] Cover failure, replay, concurrency, reactivation and multiple Suppliers.
- [x] Pass focused contracts, PostgreSQL, performance, typecheck/build and architecture.
- [x] Prepare Chrome without applying a batch or changing canonical AG titles.

## Audit evidence

- `AG / v13` estaba `APPLIED` desde `2026-09-16 06:32:29.493+00`; no se
  republicó ni se cambió Catalog para fabricar esta revisión.
- v13 preservó los itemId existentes y títulos canónicos `Pantalla…`; sus
  Listings/Resolutions permiten probar búsqueda histórica después de migrar.
- `AG / v12` continúa `READY` y no publicada; `AG / v11` continúa disponible
  como fixture de las dos decisiones Owner sin Apply.
- Antes de Apply, KEEP/ADOPT sólo cambia `title_decision` en la fila del Batch;
  CatalogItem, Resolution y Memory permanecen sin cambio.
- Schema final reutiliza Listing + Resolution + Audit y agrega sólo una
  decisión nullable y dos índices explícitos; no existe alias global.
- Canonical outputs: Price List Architecture, PBI-041, Domain Decision Log,
  Glossary, Persistence, Threat Model, Test Strategy e Implementation Evidence.

## Guardrails

- No PBI-042 or reusable group transformations from Advanced Supplier Reconciliation.
- No Inventory, Procurement, Caja, Repair Concepts, CSV/XLSX adapter or supplier API.
- No authoritative `verify:full` before Owner Acceptance.
- No hard delete of CatalogItem, published Supplier history, mappings, memory or revisions.
- Classifier and verified-tree remain shadow-only; no gates are omitted.
- No automatic batch apply, DB reset, push, PR, merge, Preview, Production or
  deploy. AG v11 may be reanalyzed only after the focused gates are green.
