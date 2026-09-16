# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Supplier coverage UX, exception-first visibility
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: local Owner Review ready; acceptance pending
WIP: 1/1
Progress: 7 / 7 functional blocks completed
Current: preserve the local checkpoint for Owner Review
Next: Owner Review only; no new PBI or integration action is authorized
Blocked: None; AG history remains immutable and the preexisting .DS_Store is preserved
Last updated: 2026-09-16 MST

## Current checkpoint — Supplier coverage UX

- [x] Preserve `AG v28` as the local 37-item `COMPLETE` / `APPLIED` baseline.
- [x] Reuse `AG v29` (`COMPLETE`, 34 rows, `READY`) to prove 34 observed / 3 not observed without Apply.
- [x] Keep all three omitted CatalogItems active; no absence mutates Catalog, history or lifecycle.
- [x] Make supplier coverage visible immediately after the change summary and before Reconciliación.
- [x] Provide an accessible, information-only list of canonical title, current status and observed baseline for the three omissions.
- [x] Keep COMPLETE-without-baseline distinct from zero omissions, and PARTIAL as absence not evaluated.
- [x] Prove local Chrome behavior on `AG v29` and `AG v30`, focused contracts, PostgreSQL, typecheck and build.

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
