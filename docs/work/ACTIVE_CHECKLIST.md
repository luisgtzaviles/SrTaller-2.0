# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Candidate contrast vs durable identity conflict
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: New-item identity remediation ready for Owner Review
WIP: 1/1
Progress: 6 / 6 remediation blocks completed
Current: Owner Review of AG v17, with row 37 classified `NEW` and no batch applied
Next: Owner may accept or reject the v17 new-item result and the prepared v11 KEEP/ADOPT choices; no Acceptance inferred
Blocked: None; AG v17 and v11 review fixtures must remain unapplied
Last updated: 2026-09-16 MST

## Current checkpoint — New item identity classification

- [x] Audit AG v17 row 37 and identify textual candidate contrast as the only route to its false conflict.
- [x] Separate bounded candidate contrasts from durable identity conflicts; no fuzzy identity write was added.
- [x] Preserve strong conflicts for contradictory identifiers and corrected durable mappings.
- [x] Add focused contracts for protected token differences and PostgreSQL material for strong conflicts.
- [x] Reanalyze AG v17 through localhost without applying its batch.
- [x] Leave Chrome on AG v17 with `36 UNCHANGED`, `1 NEW`, `0 CONFLICT`.

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
