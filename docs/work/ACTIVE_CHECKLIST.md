# Active Development Checklist

Milestone / Functional Goal: PBI-041 — COMPLETE baseline material QA and automatic absence visibility
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: material QA proven; focused documentation and final local checks pending
WIP: 1/1
Progress: 5 / 7 functional blocks completed
Current: reconcile evidence and run final focused checks
Next: leave B in review and prepare the Owner-visible local checkpoint
Blocked: None; AG history remains immutable and the preexisting .DS_Store is preserved
Last updated: 2026-09-16 MST

## Current checkpoint — automatic COMPLETE absence visibility

- [x] Create and audit AG v24 COMPLETE baseline with the known 37-item set.
- [x] Apply only clean v24 and capture zero-unexpected-mutation evidence.
- [x] Create and analyze AG v25 COMPLETE with exactly three intentional omissions; it remains READY and unapplied.
- [x] Prove 34 observed / 3 not observed and preserve all omitted CatalogItems active.
- [x] Materialize automatic latest previous APPLIED COMPLETE baseline behavior.
- [x] Prove no-baseline and PARTIAL states remain explicit and safe in focused PostgreSQL coverage.
- [ ] Complete focused tests, Chrome QA, documentation and local commits.

## Audit evidence

- `AG / v13` estaba `APPLIED` desde `2026-09-16 06:32:29.493+00`; no se
  republicó ni se cambió Catalog para fabricar esta revisión.
- v13 preservó los itemId existentes y títulos canónicos `Pantalla…`; sus
  Listings/Resolutions permiten probar búsqueda histórica después de migrar.
- `AG / v12` continúa `READY` y no publicada; `AG / v11` es el fixture local
  `READY` de las dos decisiones Owner sin Apply: fila 1 `KEEP_CURRENT` y fila
  2 `ADOPT_OBSERVED` contra los itemId candidatos ya existentes.
- `AG / v17` conserva 37 filas `FULL`, `READY` y sin publicar. Tras la
  remediación, sus 36 filas trusted siguen `UNCHANGED`; la fila 37 `Pantalla
  iPhone 16 Original` es `NEW/APPLY`, sin target, Resolution, Memory ni
  cambio a Catalog.
- El contraste de tokens protegidos sigue siendo evidencia bounded para filtrar
  candidatos; la similitud textual ya no puede elevar una fila a `CONFLICT`.
- El input técnico de UUID permanece sólo para conflictos de evidencia durable.
  Sustituirlo por un selector Catalog reutilizable requiere una iteración UX
  posterior y no bloquea este checkpoint.
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
  deploy. AG v11 y AG v17 pueden reanalizarse sólo mediante el flujo gobernado.
