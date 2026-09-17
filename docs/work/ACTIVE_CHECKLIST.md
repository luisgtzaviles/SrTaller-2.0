# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Complete baseline plausibility + coverage explainability
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Owner Review ready — local functional proof complete
WIP: 1/1
Progress: 8 / 8 current functional blocks completed
Current: preserve the local checkpoint for Owner Review
Next: Owner review/acceptance only; no integration gate without new Owner authority
Blocked: None; v44 is applied as the local final baseline and the preexisting .DS_Store remains preserved
Last updated: 2026-09-16 MST

## Current checkpoint — Complete baseline plausibility + coverage explainability

- [x] Extend coverage with continued, not-observed and additional detail without changing supplier-listing identity.
- [x] Keep automatic same-Tenant/same-Source latest `COMPLETE/APPLIED` baseline selection.
- [x] Classify a materially smaller complete list as `REVIEW_REQUIRED` through a deterministic backend policy.
- [x] Require an explicit Apply acknowledgment for an anomalous complete list; preserve idempotency.
- [x] Preserve absence as observational: no retirement, deletion, rename, identifier, revision, Resolution or Memory write by absence.
- [x] Render human coverage copy and accessible expandable continued/additional details.
- [x] Prove normal, anomalous, partial, Tenant and SupplierSource scenarios with focused contracts and PostgreSQL.
- [x] Record accepted BA-001..004 and focused local proof; stop at Owner Review.

## Current checkpoint — Completeness contract + applied result state

- [x] Require explicit `PARTIAL` or `COMPLETE` at Create and Replace boundaries.
- [x] Preserve completeness through Analyze, Apply, API reload and coverage selection.
- [x] Render READY/resolved as ready to apply and APPLIED as a historical result.
- [x] Add focused regression coverage for missing/invalid completeness and applied copy.
- [x] Materially prove AG v42 COMPLETE through Save → Analyze → Apply → reload.
- [x] Materially prove AG v43 PARTIAL remains a non-published draft.
- [x] Reconfirm AG v41 remains unchanged as pre-hardening historical evidence.

## Current checkpoint — Exception-first reconciliation UX

- [x] Open Requieren atención by default and show a compact `Todo resuelto`
  state when no decision is pending; resolved rows remain audit-only tabs.
- [x] Show bulk actions only when unresolved rows match their operation, with
  accurate result-oriented counts.
- [x] Remove redundant Include from APPLY rows; make Exclude secondary and
  show only `Volver a incluir` for EXCLUDE rows.
- [x] Keep title choice contextual as `Cambiar nombre`; retain existing
  KEEP_CURRENT / ADOPT_OBSERVED semantics.
- [x] Hide technical diagnostics from the normal Owner surface while retaining
  human explanations where they add operational value.
- [x] Prove AG v35 (34 resolved / 0 attention), AG v10 (35 attention), and
  exclude → include without white screen or Apply/Publish.
- [x] Pass typecheck, production build, Composer contract, PostgreSQL PBI-041,
  architecture, responsive light/dark QA and diff validation.

## Previous checkpoint — Row decision JSON shape hardening

- [x] Inventory all `RowDecision.errors` writes; `decide()` was the sole
  ambiguous JSONB serialization path.
- [x] Normalize every read to the canonical `readonly string[]` contract.
- [x] Serialize errors explicitly as JSON for create, analyze and decide paths.
- [x] Defend Composer rendering against malformed historical response data.
- [x] Prove exclusion/inclusion and historical malformed-row normalization in
  the isolated PostgreSQL material suite.
- [x] Prove AG v35 local visual reload and reconciliation tabs without crash;
  no Apply/Publish.

## Previous checkpoint — Post-analysis result-first workspace

- [x] Keep grid visibility as transient presentation state; no persistence or migration.
- [x] Open a new load and `DRAFT` edit-first, with the spreadsheet grid visible.
- [x] Keep grid state unchanged on Guardar borrador.
- [x] Collapse after successful Analyze/Reanalyze and when opening `INGESTED` history.
- [x] Provide accessible Mostrar/Ocultar lista without unmounting grid data or spreadsheet behavior.
- [x] Expand and focus a cell error; keep candidates, coverage, no-observed and comparison independent.
- [x] Prove `AG v3` Draft, `AG v31` Partial and `AG v29` Complete locally; focused checks and PostgreSQL PASS.

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
- AG v42 is material `COMPLETE/APPLIED` evidence: 1 `UNCHANGED` row, coverage
  1 observed / 33 not observed and the historical `Lote aplicado` result; v43
  remains `PARTIAL/DRAFT`, without Apply. v41 remains `PARTIAL/APPLIED` with
  38 rows, 1 `CREATED` and 37 `MATCHED`.

## Guardrails

- No PBI-042 or reusable group transformations from Advanced Supplier Reconciliation.
- No Inventory, Procurement, Caja, Repair Concepts, CSV/XLSX adapter or supplier API.
- No authoritative `verify:full` before Owner Acceptance.
- No hard delete of CatalogItem, published Supplier history, mappings, memory or revisions.
- Classifier and verified-tree remain shadow-only; no gates are omitted.
- No automatic batch apply, DB reset, push, PR, merge, Preview, Production or
  deploy. AG v11 y AG v17 pueden reanalizarse sólo mediante el flujo gobernado.
