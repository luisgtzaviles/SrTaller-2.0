# Active Development Checklist

Milestone / Functional Goal: PBI-041 — UX-002A.2 Duplicate input resolution
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: local DUP-1/DUP-3 implementation complete; ready for Owner Review
WIP: 1/1
Progress: 58 / 58 current implementation blocks completed
Current: stop at the UX-002A.2 Owner Review checkpoint; AG v60 remains untouched.
Next: Owner accepts or changes DUP-1/DUP-3; UX-002B does not start automatically.
Blocked: None. AG v60 remains read-only and unreanalyzed; v52 remains intentionally unpublished, v53 historical APPLIED evidence, and the preexisting .DS_Store remains preserved.
Last updated: 2026-09-17 MST

## Current checkpoint — UX-002A.2 Duplicate input resolution

- [x] Preserve AG v60 and implement only DUP-1 exact and DUP-3 contradictory same-snapshot behavior.
- [x] Keep physical rows/provenance and form one effective observation from the existing supplier identity key without a migration.
- [x] Consolidate exact copies deterministically by lowest row number and show a non-blocking Owner notice.
- [x] Present contradictory values as an Owner row choice; hide UUID mapping when identity is already known.
- [x] Exclude unchosen physical rows traceably before Apply so only one target mutation can survive.
- [x] Preserve true identity mapping, PARTIAL/COMPLETE, baseline, coverage key, Memory and Resolution contracts.
- [x] Add focused contract/PostgreSQL coverage and reconcile PBI/evidence/docs; UX-002B remains not started.

## Current checkpoint — UX-002A.1 Duplicate input resolution audit

- [x] Preserve AG v60 and complete a read-only preflight: branch, local health, PostgreSQL 18.4, 72 migrations and no runtime/data mutation.
- [x] Trace duplicate key calculation from paste/grid, durable SupplierListing and RowDecision through Analyze, trusted history, DTO and generic conflict UI.
- [x] Demonstrate that v60 has one trusted historical target for both rows but a material price/cost contradiction and no Apply-side writes.
- [x] Separate identity conflict from same-snapshot value contradiction; cover DUP-1 through DUP-6, physical/effective coverage and FULL/COMPACT limits.
- [x] Record UX V1 direction and decisions DUP-001 through DUP-008 in the domain audit, PBI and evidence index without implementing behavior.

## Current checkpoint — UX-002 happy-path friction audit

- [x] Inspect the current branch, runtime provenance, local health, 71 PostgreSQL migrations and AG v49-v53 read-only material evidence.
- [x] Trace PARTIAL/COMPLETE, durable draft creation, analysis, publication, coverage, defaults and capture modes from UI through persistence.
- [x] Record the factual audit, automation boundaries and concrete Owner decisions without changing product behavior.

## Current checkpoint — UX-002A Review List orchestration

- [x] Reconfirm the current UI/API/service/repository trace, local health, 71 migrations and Owner fixture preservation.
- [x] Replace the new/draft happy-path sequence with one Review list orchestration while retaining secondary draft recovery.
- [x] Add focused causal-order, partial-failure, double-activation and result-first regressions.
- [x] Validate local new-load/draft/reanalyze paths without Apply or existing-fixture mutation.
- [x] Reconcile PBI-041, UX-002, evidence and checklist for Owner Review.

## Current checkpoint — Operator flow optimization UX-001

- [x] Audit how Composer enters, selects Sources, browses history and starts a new load without creating or modifying a Source/Version.
- [x] Trace `sourceId` from React state through first draft persistence, tenant-scoped backend validation and immutable Version ownership.
- [x] Model the states from automatic entry selection through unpersisted capture, Draft, reconciliation, Ready and Applied history.
- [x] Reproduce and classify the AG-history → supplier-B-list silent attribution scenario as a High operational risk.
- [x] Separate browse from capture and propose an explicit, one-action Supplier Selection Gate for a new load.
- [x] Record the initial UX-001 decisions, alternatives, accessibility/mobile constraints and unsaved-work protection.
- [x] Review AG v52 as a context/defaults observation only; do not infer or persist supplier defaults.
- [x] Publish the documentation-only audit and link it from PBI-041/evidence; no code, API, database, runtime or catalog data changed.
- [x] Record Owner acceptance of UX-001-D01..D10 and retain deferred supplier defaults outside this slice.
- [x] Separate browsing Source state from pending new-load Supplier ownership; Composer entry and historical browsing do not open the gate.
- [x] Replace inherited new-load entry points with an accessible, one-click supplier gate with local case-insensitive search.
- [x] Keep standalone supplier creation and add contextual creation that returns directly to the pending new-load workspace.
- [x] Make pending ownership visible, permit a pre-save change only, and preserve persisted Version ownership as immutable.
- [x] Add focused regressions for no inheritance, gate flow, search, contextual creation, meaningful-work guard and post-save boundary.
- [x] Validate typecheck, focused Composer/focus-trap regressions, production build, DEC-005 architecture and `git diff --check` without touching v52/v53.
- [x] Reconcile implementation evidence, PBI-041 and UX-001 audit with final QA result.

## Current checkpoint — Operator flow optimization UX-001B

- [x] Record Owner acceptance of UX-001B-D01..D07 without changing SupplierSource, Version ownership or domain workflow.
- [x] Audit the existing initial state: browsing can be selected without materializing a Version; the right CTA duplicates the navigation CTA.
- [x] Keep a single primary `Nueva carga` entry in Sources navigation and render an intentional empty workspace until a Version or pending Source is selected.
- [x] Move the Sources show/hide control into the persistent Composer shell and preserve focus safely when the panel is hidden.
- [x] Preserve hidden-panel presentation state across empty, pending-load and Version workspaces without auto-reopening it.
- [x] Add focused UX-001B regressions for entry, empty state, panel restore and keyboard behavior.
- [x] Validate Chrome desktop/768/640 and light/dark without Source, Version, Catalog or persistence writes; current UX-001C local walkthrough completed with a valid existing Station session and no credentials entered.
- [x] Reconcile UX-001 documentation, PBI-041 and implementation evidence with the implementation and current QA blocker.

## Current checkpoint — Operator flow optimization UX-001C

- [x] Record Owner acceptance of UX-001C-D01..D07 and preserve UX-001/UX-001B state logic.
- [x] Audit the rejected UX-001B affordance: its persistent square sits between Sources and workspace instead of belonging to Sources navigation.
- [x] Move the open-state collapse affordance into the Sources header with tertiary visual treatment and directional semantics.
- [x] Render the initial closed-state restore mechanism; superseded by the final compact tab below.
- [x] Preserve `sourcesOpen`, selected Version, pending supplier and workspace content through hide/restore with no reload.
- [x] Extend focused Composer/gate/focus regression coverage for open header semantics and closed rail availability.
- [x] Validate Chrome desktop/768/640 and light/dark with an existing trusted local Station session; no credentials or business writes were used.
- [x] Reconcile UX-001 documentation, PBI-041 and implementation evidence with UX-001C result.

## Current checkpoint — UX-001C collapsed restore-control polish

- [x] Record Owner rejection limited to the collapsed full-height rail; preserve the accepted open Sources header.
- [x] Remove the grid column/rail and attach a compact restore tab to the Composer workspace edge.
- [x] Preserve focus transfer, keyboard behavior, selected Version and pending supplier with no reload or request.
- [x] Verify neutral, new-load and historical Version workspaces at desktop/768/640 in light/dark.
- [x] Reconcile PBI-041, UX-001 evidence and checklist with the final local proof.

## Current checkpoint — UX-001C restore tab micro-polish

- [x] Align the closed tab with workspace content and keep a subtle neutral resting state.
- [x] Preserve the approved open control, keyboard focus and all Composer state.
- [x] Review neutral, pending-load and historical Version workspaces on desktop, 768 and 640 px in light/dark.
- [x] Run focused gates and reconcile the local evidence for Owner Review.

## Current checkpoint — Existing CatalogItem reactivation pre-Apply QA

- [x] Select a safe active CatalogItem with trusted AG history, stable SKU/barcode and no non-catalog operational references.
- [x] Retire exactly that synthetic local item through the normal Lista de precios administration UI; identity, identifiers and history remain preserved.
- [x] Preserve AG v52 in `FULL` / `PARTIAL`, `READY`, unpublished state as negative evidence: its omitted source brand yields `1 NEW` / `0 REACTIVATE` and no target.
- [x] Create and analyze AG v53 through the normal Composer flow with the complete historical observation: `PART`, `Pantallas`, `Apple`, exact title and unchanged price/cost.
- [x] Prove AG v53 is `INGESTED` / `READY`, unpublished and resolves exactly `1 REACTIVATE` / `APPLY` to CatalogItem `0223c4b4-3a68-4b88-a679-8a85aaff817e` through trusted historical identity.
- [x] Prove pre-Apply safety: target remains INACTIVE/version 5; CatalogItem count remains 45; SKU/barcode, revisions, supplier history and reconciliation memory remain unchanged; v53 has zero Resolution and zero Catalog audit writes.
- [x] Review UX: the resolved row says the recognized inactive item “se reactivará al aplicar”; it appears under Resueltas with zero attention and needs no redundant identity decision.
- [x] Record the later operator-flow observation only: a missing brand default changes the authoritative supplier signature; inherited/remembered capture context or a non-blocking historical-context warning could prevent this input omission. No matching or UX change was implemented.
- [x] Snapshot and apply only AG v53 through the normal Composer flow: `READY` / unpublished became `APPLIED` with a publication instant exactly once.
- [x] Prove post-Apply lifecycle and safety: the same UUID moved `INACTIVE` v5 → `ACTIVE` v6; CatalogItem total remained 45 and ACTIVE count changed 41 → 42 with unchanged SKU, barcode, canonical title and price/cost revision counts.
- [x] Prove provenance: v53 produced one `MATCHED` Supplier Resolution for the trusted signature while its RowDecision and Catalog audit record the `REACTIVATE` effect; reconciliation memory remained consistent for the same item.
- [x] Reload v53 and prove its historical Owner result (`Resultado aplicado`, `Lote aplicado`, `1 reactiva`, no Apply button); Lista de precios returns exactly one active matching item with expected price/cost and no duplicate.
- [x] Reconfirm AG v52 is still `READY`, unpublished and `1 NEW`; no unrelated Catalog resource or second Apply resulted from v53.

## Current checkpoint — Small COMPLETE-list reinforced confirmation QA

- [x] Confirm material state read-only: AG v50 is COMPLETE/APPLIED with 39 rows; AG v51 is COMPLETE/READY with 4 rows and no publication instant.
- [x] Prove Coverage against v50: 4 received, 3 continued, 36 not observed and 1 additional; all four row decisions are resolved (3 UPDATE, 1 UNCHANGED).
- [x] Prove the additional listing is historical supplier coverage, not a new CatalogItem: its trusted consistent signature resolves to the existing active iPhone 11 Calidad RJ CatalogItem.
- [x] Confirm backend plausibility policy: baseline at least 20 rows and current list at most 25%; v51 is 4/39 (89.74% reduction), so acknowledgment is required.
- [x] Prove no-acknowledgment Apply is rejected as `CATALOG_COVERAGE_REVIEW_REQUIRED` before publication; focused PBI-041 PostgreSQL material test PASS.
- [x] Open and cancel the Owner confirmation UI without publication; it states the 39/4/36 consequence, absence safety and future baseline effect.
- [x] Prove post-cancel safety: v51 remains READY with null publication, zero Resolution/audit rows; Catalog remains 45 total / 42 ACTIVE and all 36 not-observed items remain ACTIVE.
- [x] Confirm AG v50 remains the latest COMPLETE/APPLIED baseline; no v51 Apply replay, migration, reset, product change or integration action.

## Current checkpoint — Combined real-world supplier update, post-Apply QA

- [x] Confirm AG v49 is the material automatic baseline: COMPLETE/APPLIED, 40 rows; do not alter v48 or v49.
- [x] Create AG v50 as COMPLETE/READY with 39 rows: three omissions, two new items and three price/cost updates.
- [x] Prove Coverage against v49: 39 received, 37 continued, 3 not observed and 2 additional.
- [x] Prove Reconciliation: 2 NEW, 3 UPDATE, 34 UNCHANGED and zero unresolved/candidate/pending/ambiguous/conflict/invalid rows.
- [x] Prove omissions remain ACTIVE and observational only; no RowDecision, retirement, Resolution, Catalog revision or Memory learning comes from absence.
- [x] Prove new items remain absent from Catalog pre-Apply and use the honest pre-Apply copy.
- [x] Apply AG v50 exactly once through the normal product UI; it is COMPLETE/APPLIED with 39 processed rows and a non-null publication instant.
- [x] Prove post-Apply material effects: two active CatalogItems created, the three intended price/cost updates materialized, and no mutation of the three not-observed active items.
- [x] Reload v50 and prove its historical result: `2 nuevo · 3 actualiza · 34 sin cambio`, Coverage remains against AG v49, and Apply is unavailable.
- [x] Prove both new items and all changed/unchanged safety cases through Lista de precios; latest COMPLETE/APPLIED baseline selection now resolves to AG v50.
- [x] Stop after post-Apply proof; do not replay Apply, create v51, retire items or begin an integration gate without new Owner authority.

## Current checkpoint — Operational UX polish for coverage + post-apply result

- [x] Classify the missing additional-item state as `STALE_PROJECTION`; preserve the null pre-Apply `NEW` target.
- [x] Project post-Apply item/status/provenance from immutable Resolution without changing matching, baseline or Apply semantics.
- [x] Prioritize additional and not-observed coverage; retain continued rows as accessible audit detail and omit zero-count CTAs.
- [x] Keep terminology distinct: Supplier Coverage uses continuations, absence and additions; Catalog reconciliation retains `Nuevo`.
- [x] Keep APPLIED result primary; move `CREATED`-only retirement into secondary batch actions without changing capability or Level 2 controls.
- [x] Make historical comparison collapsed by default with keyboard-accessible disclosure semantics.
- [x] Prove AG v45 reload: 39 rows, 38 continued, 0 not observed, 1 additional, ACTIVE created detail and Price List search.
- [x] Prove disposable PostgreSQL pre-Apply `NEW` and post-Apply `CREATED` coverage projection.
- [x] Pass focused typecheck, build, contracts, PostgreSQL, architecture, docs validation and diff checks; await Owner Review only.

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
