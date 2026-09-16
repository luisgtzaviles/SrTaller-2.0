# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Supplier version completeness semantics
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: PARTIAL/COMPLETE implementation materially validated; Owner Review pending
WIP: 1/1
Progress: 5 / 7 functional blocks completed
Current: local Composer walkthrough and runtime provenance
Next: focused final review, logical local commits and Owner Review handoff
Blocked: None; historic AG fixtures remain preserved and are never reclassified retrospectively
Last updated: 2026-09-16 MST

## Current checkpoint — Supplier version completeness

- [x] Audit v18/v19 and establish that absence never mutates CatalogItem.
- [x] Add independent `PARTIAL` / `COMPLETE` version coverage contract with conservative historical default.
- [x] Expose Owner-facing scope choice in new/draft Composer workspace.
- [x] Make comparison absence-aware by current coverage and same-source complete baselines.
- [x] Apply migration and prove historical versions read `PARTIAL`.
- [x] Prove COMPLETE absence is informational while Catalog identity/history remain intact.
- [~] Complete Chrome Owner Review walkthrough and focused gates.

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
