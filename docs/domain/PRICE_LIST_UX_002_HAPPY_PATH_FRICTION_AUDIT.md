# UX-002 — Bulk Catalog Happy-Path Friction Audit

**PBI:** PBI-041
**Status:** UX2-002/UX2-003 implemented locally for Owner Review; remaining decisions remain audit-only
**Date:** 2026-09-17 MST

## 1. Executive finding

**Primary classification:** `MECHANICAL_STATE_TRANSITION_FRICTION`.

The Composer is safe because it separates durable supplier snapshot,
reconciliation, and Catalog publication. A normal listing still makes the
operator drive two mechanical transitions — `Guardar borrador` and `Analizar
versión` — before the first real result. The evidence supports combining only
mechanical work after a deliberate durable intent; it does not support removing
semantic boundaries.

### Preflight and evidence boundary

- Branch/HEAD: `feature/pbi-041-bulk-catalog-composer` at
  `71cc113f1ac67337239c3f29450b63877c5bae46`.
- The only pre-existing worktree artifact is untracked
  `apps/dev-preview-web/src/.DS_Store`; it is preserved and not added.
- Local health was `200` for `livez`, `readyz`, and frontend. Runtime
  provenance reported a dirty local source (`a85a6b3…`), so it is not used as
  candidate proof.
- PostgreSQL 18.4 was inspected read-only with 71 migrations. AG `v49` is
  `COMPLETE/APPLIED`, 40 rows, published `2026-09-17 02:14:21 UTC`; `v50` is
  `COMPLETE/APPLIED`, 39 rows; `v51` is `COMPLETE/READY`, 4 rows; `v52` is
  `PARTIAL/READY`, 1 row; and `v53` is `PARTIAL/APPLIED`, 1 row.
- No SupplierSource, Version, Batch, CatalogItem, Resolution, Memory, audit,
  migration, or runtime data was written.

## 2. Current flow map

### Minimum current happy path

1. `Nueva carga` opens the Supplier Selection Gate.
2. The operator explicitly chooses a SupplierSource.
3. The operator pastes or edits rows, selects capture mode, and declares
   `PARTIAL` or `COMPLETE`.
4. `Guardar borrador` creates the first immutable-source snapshot, or replaces
   an unanalysed draft.
5. `Analizar versión` calculates reconciliation and moves the Batch to `READY`
   when every row is resolved.
6. The operator resolves only attention rows, if any.
7. `Aplicar lote` publishes supplier observation and atomically applies accepted
   Catalog effects. A materially small complete list needs acknowledgement.

Steps 1–3 establish input meaning. Steps 4–5 are mechanical but durable today.
Step 6 is conditional human judgment. Step 7 remains a publication boundary
even when Catalog values do not change.

## 3. PARTIAL / COMPLETE audit

`PARTIAL` and `COMPLETE` are closed, required values on create and replace. The
Composer defaults to `PARTIAL`, but transmits an explicit value; missing, null,
or unknown values are rejected. It persists in
`catalog_supplier_catalog_versions.completeness`, is part of the create
fingerprint, and becomes immutable once Analyze ingests the Version.

| Phase | `PARTIAL` | `COMPLETE` |
| --- | --- | --- |
| Save | Same snapshot mechanics; records no absence authority. | Same snapshot mechanics; records a durable absence declaration. |
| Analyze | Reconciles received rows; coverage is `NOT_APPLICABLE`. | Also compares with latest same-tenant, same-source `COMPLETE/APPLIED` baseline. |
| Apply | Publishes received observations; no coverage acknowledgement. | Publishes observations; a baseline of at least 20 retaining 25% or less needs acknowledgement. |
| After Apply | No absence semantics or complete-baseline authority. | Eligible as the automatic future complete baseline. |

The meaning of a present row does not change. Only omission meaning changes.

- A real complete list called `PARTIAL` loses absence signal and future
  baseline authority, but does not harm Catalog.
- A partial update called `COMPLETE` can falsely report `NOT_OBSERVED` rows and
  create a misleading future baseline if confirmed. It never automatically
  retires or modifies absent CatalogItems.

Existing protections: same-Source baseline selection, absence outside
RowDecision, no lifecycle mutation by absence, deterministic plausibility
review, acknowledgement in the idempotent publication request, and explicit
selection. The current missing protection is post-paste contextual guidance.

**Safe default: `PARTIAL`.** It is the only safe state when absence is unknown.
After paste, current data can merely suggest a question from baseline size,
overlap/continued percentage, source size history, description, and cadence.
No heuristic may silently promote to `COMPLETE`. No current signal is
authoritative enough to classify a list automatically as complete.

## 4. Save Draft audit

### Actual trace and durable effects

`BulkCatalogComposerPage.save()` validates client rows and calls
`createSupplierDraft` or `replaceSupplierDraft`. `BulkCatalogService` parses
mode and rows, requires completeness and column signature, validates raw size,
and creates request identifiers/fingerprints before calling the repository.

The first valid save locks the active SupplierSource and atomically:

1. allocates its next monotonic `vN`;
2. creates a `SupplierCatalogVersion` in `DRAFT` with fixed `source_id`, mode,
   completeness, description, signature, and row count;
3. stores the raw paste in `catalog_supplier_version_raw_payloads` under the
   90-day retention policy;
4. creates `CatalogUpdateBatch` in `DRAFT` with zero counts;
5. creates Supplier Listings and draft RowDecisions.

Save creates no CatalogItem, price/cost revision, Resolution,
ReconciliationMemory, or Catalog audit. It enables reload/recovery of Version,
rows, raw payload while retained, Source ownership, and lock versions.
`replaceDraft` requires `expectedVersion`, keeps Source immutable, replaces
Listings/RowDecisions, resets Batch analysis, replaces raw payload, and
increments locks. Create retry is idempotent for the same request ID and hash;
changed replay and stale writers fail closed.

| Model | Assessment |
| --- | --- |
| A. save immediately after paste | Unsafe by default: accidental/incomplete snapshot, `vN` consumption, fixed Source. |
| B. debounced server autosave | Weak recovery/feedback; repeated locks and durable updates while editing. |
| C. save on blur | Blur is not a meaningful supplier-snapshot intent. |
| D. local-only draft then durable save before review | Best fit: preserves local editing and one intentional snapshot boundary. |
| E. server draft at Source selection | Allocates a Version before usable content; not justified. |
| F. explicit Save | Safest current behavior, but adds a mechanical click. |

Recommended direction: keep local work, then make one explicit **Review list**
intent persist exactly one draft and continue into mechanical analysis. This
needs orchestration/recovery design; it is not a visual-only change.

## 5. Analyze Version audit

`analyzeSupplierVersion` calls `BulkCatalogService.analyze` with a Version ID
and optimistic lock. The repository locks Version/Batch; loads Listings,
Catalog identifiers, active and pending references, prices/costs, same-source
memory, published supplier history, and candidate index; then calculates
duplicate/identity/reference errors, trusted matches, candidates, `NEW`,
`UPDATE`, `REACTIVATE`, `UNCHANGED`, pending references, and conflicts.

Analyze upserts RowDecisions including classifications, evidence, warnings and
expected target versions; records Batch counts/analysis hash; and transitions
Batch to `READY` or `RECONCILING`. Its first run freezes the snapshot as
`INGESTED` with content hash/time. It creates no Resolution or Memory, changes
no CatalogItem or revision, and makes no publication audit write. Reanalysis is
allowed before `APPLIED`; draft replacement invalidates derived analysis.

This is mechanical relative to Catalog, but not read-only relative to the
supplier workflow: it writes derived reconciliation and freezes input.
Optimistic locks reject stale callers. Existing disposable PostgreSQL evidence
measured about 388 ms analysis for 10,000 rows, so progress/failure behavior
still matters.

Recommendation: analyze immediately after a deliberate durable **Review list**
request, then interrupt only for exceptions. Debouncing after each edit is not
appropriate because it repeats durable transitions and competes with locks.
Background precomputation requires equivalent version/cancellation discipline.

## 6. No-op Apply audit

An all-`UNCHANGED`, all-`APPLY` Batch does not change Catalog fields,
lifecycle, or price/cost revisions. Apply still produces a material supplier
publication:

- Batch becomes `APPLIED` with `published_at`, publisher, and idempotent
  publication request data.
- Included Listings receive `MATCHED` Supplier Listing Resolutions.
- ReconciliationMemory is created/refreshed for confirmed matches.
- Per-row Catalog audit evidence is written even though item version is stable.
- Published observed titles become future recognition history.
- `COMPLETE` can become a future automatic baseline; `PARTIAL` preserves
  observation/history without absence authority.

**Classification: D — `MIXED_BY_PARTIAL_COMPLETE`.** Apply is required for a
durable observation in both modes; `COMPLETE` adds baseline authority. It is
not currently unnecessary just because Catalog is unchanged. UI should say
“No hay cambios en Catalog; la observación del proveedor está lista para
publicar,” not imply there is nothing to publish.

## 7. Context/defaults audit

The Composer reads kind/category/brand from browser `sessionStorage` key
`srtaller:bulk-composer:batch-context:v1`. These are not SupplierSource
properties and do not come from source history. They apply only to a new/empty
row during paste/row creation or through explicit **Aplicar sólo a vacíos**;
changing a default never rewrites captured rows. Saved row values then become
Listing snapshot data.

Kind, category, and brand participate in the supplier signature when no
supplier item code exists, so they are identity-sensitive. Read-only AG evidence
shows `v52` missing Brand classified `NEW`, whereas `v53` with `Apple`
classified trusted-history `REACTIVATE` for the inactive existing item.

Recommendation: keep per-load defaults visible/explicit. A future profile may
offer source-scoped, provenance-labelled suggestions, with pasted values taking
precedence and an explicit apply-to-empty action. It must not silently fill all
rows: a Supplier can legitimately carry Apple, Samsung, and Motorola.

## 8. Capture-mode audit

`FULL` (“Alta y actualización”) requires kind, title, category, and base price;
it can create a new CatalogItem after reconciliation. `COMPACT` (“Actualización
compacta”) requires supplier code, SKU, or barcode plus optional price/cost;
it cannot create a targetless item, which becomes `INVALID` with
`COMPACT_ROW_TARGET_NOT_FOUND`.

Mode changes parser invariants, column signature, matching behavior, and
permitted outcome. Clipboard shape may suggest a mode, but cannot choose it:
an identifier-only list might still need the full creation workflow. Keep it
explicit, while allowing a non-binding contextual recommendation after paste.

## 9. Safety boundaries

These remain explicit: Supplier choice; `PARTIAL` as unknown-safe state and a
durable complete confirmation; immutable Source after first save; backend
tenant/session/station authorization; optimistic locks; human resolution of
candidate/ambiguity/conflict/invalid/governance; title choice; Apply and its
complete-list acknowledgement; no Catalog/Resolution/Memory learning on
Analyze; and observational-only absence.

## 10. Automation opportunities

1. Keep `PARTIAL` default and offer a non-binding post-paste complete-list
   question using baseline size/overlap/history.
2. Replace visible Save → Analyze with one intentional Review list transition
   that saves then analyzes with recoverable failure handling.
3. Route zero-attention results directly to a concise ready result.
4. Explain no-op publication as supplier provenance, not “nothing happened.”
5. Offer source-context suggestions only with provenance and explicit
   apply-to-empty confirmation.
6. Offer, never infer, FULL/COMPACT from paste shape.

## 11. Proposed target flows

| Flow | Operator actions | Automatic work | Interruption / Apply |
| --- | --- | --- | --- |
| A. small partial update | New load → Source → paste 5 → Review list → Apply. | Save and analyze. | Resolve exceptions only; publish without absence evaluation. |
| B. full list | New load → Source → paste ~40 → contextual complete confirmation → Review list → Apply. | Save/analyze, coverage/plausibility. | Resolve exceptions; acknowledge only anomalous size; Apply grants baseline authority. |
| C. mixed full update | As B. | Reconcile update/new/unchanged plus coverage. | New/candidate/conflict/reference judgment remains human; missing is observational. |
| D. all unchanged | New load → Source → paste → Review list → Publish observation. | Save/analyze; zero attention. | Apply remains explicit for provenance, Resolution/Memory, and possible baseline. |
| E. ambiguous/conflict | New load → Source → paste → Review list. | Save/analyze, isolate attention. | Human selects/excludes/governs; Apply waits. |
| F. reactivation | New load → Source → complete identity → Review list → Apply. | Trusted history can preselect reactivation. | Review effect; Apply changes lifecycle atomically. |

## 12. Owner decisions

| ID | Question / current behavior | Evidence, risk, options | Recommended option | Requires domain / persistence / migration | Independent? |
| --- | --- | --- | --- | --- | --- |
| UX2-001 | Completeness is currently a permanent upfront selector. | Complete is durable absence/baseline authority. Options: keep upfront; post-paste question; silent heuristic. | Default PARTIAL; prompt contextually; never silently promote. | No domain change for prompt; existing explicit persistence; no migration expected. | Yes. |
| UX2-002 | Save is a separate first durable action that allocates `vN`. | Autosave risks version spam/incomplete snapshots. Options A–F in section 4. | Local draft plus one intentional Review list save/analyze transition. | Application/API orchestration; no schema change proven. | No; pair with UX2-003. |
| UX2-003 | Analyze is explicit and writes derived state/freezes snapshot. | Mechanical relative Catalog, but durable workflow state. Options: explicit, immediate, debounce, review, background. | Run after deliberate Review list, never on arbitrary edit debounce. | Application/API/UI; no migration expected. | Coupled to UX2-002. |
| UX2-004 | All-unchanged Apply presently publishes observations/learning. | Removing it loses provenance; auto-publish can grant complete baseline. Options A–E. | D: `MIXED_BY_PARTIAL_COMPLETE`; retain explicit publish and clarify no Catalog change. | Copy/read model independent; auto-publish changes semantics. | Copy yes; automation no. |
| UX2-005 | Defaults are session-only, empty-cell only. | v52/v53 prove brand/context can change identity. Options: session, profile, suggestion, inference, mixed. | Source-scoped labelled suggestions; explicit apply to empty cells; no silent profile. | Real profile needs policy/persistence; migration unknown. | No. |
| UX2-006 | FULL/COMPACT is currently upfront and changes invariants. | Silent inference can block valid creation/misstate intent. | Keep explicit; optional paste-shape suggestion. | UI only if semantics unchanged; no migration expected. | Yes. |
| UX2-007 | Current system only protects implausibly small complete lists at Apply. | Signals can help but cannot prove completeness. | Size only; multiple signals; manual only. | Multiple existing signals to ask, persist only user answer. | UI/read-model; no new persistence. | Yes, after UX2-001. |

## 13. Recommended sequencing

1. Decide UX2-001/007 first: they govern absence authority.
2. Clarify no-op publication and current Save/Analyze semantics (UX2-004).
3. If approved, design UX2-002/003 recovery, retry, and lock behavior before
   implementation.
4. Treat source profile/defaults (UX2-005) as separate domain work.
5. Consider capture-mode presentation (UX2-006) only without loosening parser
   rules.

## 14. UX-002A implementation record — Review list orchestration

The approved UX2-002/UX2-003 slice is implemented locally in the Composer
only. **Revisar lista** is now the primary deliberate transition for a new or
modified draft. It validates first, saves exactly one durable snapshot through
the existing create/replace contract, and passes the authoritative
`versionId`/optimistic version returned by that Save response directly to
Analyze. It neither creates a parallel draft nor infers a version identifier.

- A save rejection makes no Analyze request.
- An Analyze failure retains and reopens the successfully saved snapshot for
  recovery/retry; it does not lose the operator's draft.
- A synchronous in-flight guard and the normal busy state prevent a second
  Review/Analyze activation while the first is running.
- **Guardar borrador** remains a secondary recovery action.
- An already analyzed, unpublished version continues to expose **Reanalizar
  versión**; **Aplicar lote** remains a separate, explicit action.

Local Chrome proof used isolated source `QA UX-002A Local` and one valid row.
The resulting `v1` reached `En revisión` with one resolved `NEW` result and
zero attention rows; it was reanalyzed once and was **not applied**. No AG
version (`v50`–`v57`) was altered and no Catalog write occurred. Focused
regression tests cover success ordering, Save failure without Analyze, and
Analyze failure preserving the durable snapshot.

This slice deliberately does **not** change completeness inference,
PARTIAL/COMPLETE semantics, capture mode, context/default behavior, identity,
backend contracts, migrations, or Apply/publication semantics. UX2-001 and
UX2-004 through UX2-007 remain pending Owner decisions.

## 15. Explicit non-goals

- No product, UI, API, domain, persistence, test, migration, or runtime change.
- No Version creation, Analyze, Apply, retirement/reactivation, fixture change,
  PostgreSQL write, push, PR, merge, deployment, CI, or `verify:full`.
- No change to absence safety, baseline selection, trusted history, candidate
  governance, Source ownership, or Catalog authority.

## 16. UX-002B.1 implementation record — two-panel New Load modal

The New Load gate has been refined as a layout-only interaction surface. Its
wide dialog separates the two independent decisions without creating a second
workflow: the left panel contains supplier search, selection and contextual
supplier creation; the right panel presents the existing `PARTIAL` and
`COMPLETE` choices with their owner-facing descriptions. The footer remains
global, so Cancel and disabled-until-complete Continue are read as dialog
actions rather than panel actions.

A fresh gate deliberately starts with no supplier and no intent. The existing
predicate remains the authority for enabling Continue. A pre-save Change opens
the same gate with both current choices preserved; contextual source creation
returns with the created source selected and the intent deliberately blank.
The implementation keeps the existing dialog focus trap, keyboard semantics,
server authority and the durable `PARTIAL` / `COMPLETE` values. It changes no
domain, API, persistence, migration, matching, coverage, Analyze or Apply
behavior.

Focused static contracts cover the two panels, headings, shared footer,
explicit radios and the responsive collapse. Typecheck, production build and
the architecture policy pass locally. Authenticated Chrome QA passed for fresh
blank state, both explicit choices, pre-save Change, contextual-create cancel,
Escape, Tab/Shift+Tab and visible desktop/768/640 light plus 640 dark states.
No draft, Source, Version, analysis, Apply or Catalog write occurred. This
record is ready for Owner Review, not Owner acceptance.

## 17. Follow-up audit — duplicate input semantics

UX-002A.1 traces the separate case of duplicate observations inside a single
snapshot. It documents why AG `v60` has a known historical identity but a
material price/cost contradiction, and why UUID mapping is not a valid remedy
for that situation. It records decisions only; no Composer, persistence or
Catalog behavior changed. See
[Duplicate Input Resolution Audit](PRICE_LIST_UX_002A1_DUPLICATE_INPUT_RESOLUTION_AUDIT.md).

## 18. UX-002C implementation record — primary Review, optional draft save

The approved capture hierarchy is explicit: **Revisar lista** is the ordinary
operator action after paste/edit. It keeps the existing durable Save → Analyze
orchestration rather than making persistence implicit. A save failure prevents
Analyze; an Analyze failure leaves the saved snapshot available for recovery.

**Guardar para después** is the quiet, optional escape path. It is exposed only
when meaningful editable work is dirty, performs draft persistence only, and
then hides again until another edit. It neither analyzes nor writes Catalog,
reconciliation, memory or publication state. Capture controls disappear after
Analyze so result workflows continue to use their existing reanalyze/apply
actions.

The local proof used an isolated source and two non-applied versions: one
reached reviewed results through the primary action; the other stayed a
recoverable draft across reload. Responsive Chrome checks covered desktop,
768 and 640 light, plus 640 dark. This is local Owner Review evidence only.

## Conclusion

The subsequent [UX-002D Capture Mode Friction Audit](PRICE_LIST_UX_002D_CAPTURE_MODE_FRICTION_AUDIT.md)
traces FULL/COMPACT as persisted safety policy rather than Owner load intent;
its recommendation is pending Owner decision and is not implemented.

UX-002 supports a result-first review flow, not silent automation. The system
can reduce operator work by composing mechanical save/analyze after a deliberate
review intent and by giving contextual suggestions. It must retain explicit
semantics for completeness, identity, exceptions, and durable publication.
