# PBI-041 — Evidence Index

PBI-041 historical Catalog reactivation is `Owner Review ready — Owner
Acceptance pending`. This directory contains readiness and local implementation
evidence. It does not grant acceptance, integration, deployment or release
authority.

- [Implementation Evidence](IMPLEMENTATION_EVIDENCE.md)
- [Definition of Ready](DEFINITION_OF_READY.md)
- [Threat Model](THREAT_MODEL.md)
- [Test Strategy](TEST_STRATEGY.md)
- [Persistence and Migration Design](PERSISTENCE_DESIGN.md)
- [PBI](../../../backlog/pbis/PBI-041.md)
- [Price List Architecture](../../../architecture/PRICE_LIST_ARCHITECTURE.md)
- [Bulk Composer Discovery](../../../domain/PRICE_LIST_BULK_IMPORT_AUDIT_AND_DOMAIN_DESIGN.md)
- [UX-001 Supplier Selection Gate Audit](../../../domain/PRICE_LIST_UX_001_SUPPLIER_SELECTION_GATE_AUDIT.md)
- [UX-002 Happy-Path Friction Audit](../../../domain/PRICE_LIST_UX_002_HAPPY_PATH_FRICTION_AUDIT.md)
- [UX-002E Batch Context Defaults Friction Audit](../../../domain/PRICE_LIST_UX_002E_BATCH_CONTEXT_DEFAULTS_FRICTION_AUDIT.md)
- [UX-003 Bulk Catalog Field Policy Audit](../../../domain/PRICE_LIST_UX_003_BULK_CATALOG_FIELD_POLICY_AUDIT.md)
- [UX-002A.1 Duplicate Input Resolution Audit](../../../domain/PRICE_LIST_UX_002A1_DUPLICATE_INPUT_RESOLUTION_AUDIT.md)

PBI-040 is `Done`, `Released: NO`. PBI-041 is the single WIP and stops at local
Owner Review. Advanced Supplier Reconciliation remains a deferred outcome
without PBI ID, selection or readiness.

## UX-002E / UX-002E.1 missing-data context

The audit preserved AG `v52`/`v53` and confirmed the identity boundary around
missing Brand. UX-002E.1 implements only the safe presentation consequence:
an empty, collapsed `Completar datos faltantes` disclosure for editable FULL
loads. Its action is explicit, empty-only and never overwrites supplied data;
it has no Source/history preference, Save, Analyze or Catalog side effect.

## UX-003 Bulk Catalog Field Policy — audit only

UX-003 traces the current fixed FULL/COMPACT contracts, field inventory, Tenant
ownership, authorization, persistence and the Nueva reparación configuration
pattern. It recommends a Tenant-owned effective-value policy separate from
Composer presentation, so COMPACT identified updates do not fail merely because
a supplier omits a value already known safely by Catalog. The audit records
`UX3-001..017`; none is accepted or implemented. It made zero DB writes and no
product, API, migration, SupplierSource, fixture or Catalog change. See the
[UX-003 audit](../../../domain/PRICE_LIST_UX_003_BULK_CATALOG_FIELD_POLICY_AUDIT.md).

## UX-001 Supplier Selection Gate — local Owner Review

UX-001 is implemented locally under the accepted D01..D10 decisions. The
Composer now separates unrestricted history browsing from the explicit
supplier selection required for a new load. The local proof opened AG `v53`,
cancelled the gate with that historical view intact, selected AG explicitly,
changed it again before any save, and exercised Escape/focus restoration and
case-insensitive search. No Source, Version, draft, analysis, Catalog record,
`v52`, or `v53` was mutated during that proof. See the
[UX-001 audit and result](../../../domain/PRICE_LIST_UX_001_SUPPLIER_SELECTION_GATE_AUDIT.md).

## UX-002 Happy-Path Friction Audit

UX-002 is a read-only product-flow audit. It inspected current local health,
71 PostgreSQL migrations, AG `v49`–`v53`, and the UI-to-persistence contracts
without creating a Version, analyzing, applying, or writing Catalog data. Its
result separates automatable mechanical transitions from explicit semantic and
publication decisions; it does not grant implementation authority. See the
[UX-002 audit](../../../domain/PRICE_LIST_UX_002_HAPPY_PATH_FRICTION_AUDIT.md).

## UX-002A Review List orchestration — local Owner Review candidate

The approved UX2-002/UX2-003 implementation makes **Revisar lista** the
deliberate primary transition: one durable Save through the existing endpoint,
then Analyze of the exact authoritative Save response. Focused regressions
prove Save → Analyze causal ordering, no Analyze after Save failure, and
durable draft recovery after Analyze failure. Local Chrome proof created the
isolated `QA UX-002A Local` source and its `v1` with one valid row; it reached
`En revisión` with one resolved `NEW` and zero attention, was reanalyzed, and
was not applied. No AG `v50`–`v57` version or Catalog record was modified.
`typecheck`, focused UI/model contracts, a production build, disposable
PostgreSQL PBI-041 material checks (72 migrations), and DEC-005 architecture
policy all passed. No full verification, remote action, push, PR, merge, or
deployment was performed.

## UX-002A.1 Duplicate input resolution — audit only

AG `v60` is preserved as `PARTIAL/INGESTED/RECONCILING` with two physical
observations that share a trusted historical CatalogItem but disagree on
price/cost. Read-only inspection confirmed two `CONFLICT/UNRESOLVED` rows,
zero Resolution/audit writes for v60 and unchanged trusted Memory. The audit
separates value contradiction from identity conflict and records Owner choices
without implementing a remedy, changing AG v60, reanalyzing, applying, or
writing Catalog data. See the
[UX-002A.1 audit](../../../domain/PRICE_LIST_UX_002A1_DUPLICATE_INPUT_RESOLUTION_AUDIT.md).

## UX-002A.2 Duplicate input resolution — local Owner Review candidate

DUP-1 exact duplicates now leave one deterministic effective observation and
one traceable excluded physical row. DUP-3 contradictory values remain blocked
until an Owner selects a physical row; the known-identity UI compares values
and does not request a Catalog UUID. Focused contract and disposable PostgreSQL
material coverage prove no generic exact conflict, explicit contradiction,
Apply blocking, one surviving target after selection and stable reanalysis. AG
`v60` was not mutated.

## UX-002A.3 Duplicate resolution card — local Owner Review candidate

The contradictory duplicate UI now groups physical members as one Owner-facing
decision, counts it as one attention unit, foregrounds only differences, and
keeps details accessible. Focused contracts cover grouping, resolved state and
the retained mapping path; no backend or PostgreSQL semantics changed.

## UX-002B.1 Two-panel New Load modal — ready for Owner Review

The existing New Load gate is now a wide two-panel dialog: the supplier picker
and contextual supplier creation are on the left, while the existing explicit
load intent choices are on the right. Cancel and Continue remain global dialog
actions; a fresh gate has no inferred supplier or intent, and Continue remains
disabled until both are selected. The existing pre-save Change and contextual
creation flows retain their deliberate semantics.

Focused contracts, typecheck, production build and architecture validation pass
at `794a3ba` / `e766a99`. Authenticated Chrome QA passed fresh blank state,
both choice paths, pre-save Change, contextual-create cancel, dialog keyboard
behavior and desktop/768/640 responsive light/dark presentation. No domain,
API, database, migration, matching, coverage, Analyze, Apply or Catalog
behavior changed, and no data was saved during QA. The current PBI-041
PostgreSQL material run passes; this remains local Owner Review evidence, not
acceptance, integration or deployment evidence.

## UX-002A.4 Duplicate winner remediation — ready for Owner Review

AG `v64` was preserved read-only after the Owner-visible failure. Its two
trusted duplicate rows and `RECONCILING` Batch were unchanged by the failed
click; Catalog, Resolution, Memory, audit and publication writes remained zero.
The root cause was an omitted Analyze-persisted `KEEP_CURRENT` title decision
in the grouped-card request, which hit the repository title-decision guard and
rolled back atomically. The card now forwards that persisted decision only;
the backend retains the authoritative target and group-atomic winner/sibling
transition without UUID mapping or title inference in UI.

Focused Composer contracts, typecheck, production build, DEC-005 architecture
and the disposable PostgreSQL PBI-041 suite passed (72 migrations). PostgreSQL
coverage exercises first/second/three-member winners, stale and invalid target
rejection, exact duplicate preservation, reanalysis/reload and pre-Apply
absence of Catalog/Resolution/Memory/publication writes. Chrome local passed
fresh AG `v65` row 1 and AG `v66` row 2 fixtures: each changed `1 attention`
to `0`, showed the compact resolved state after reload, and was not applied.
The New Load supplier-and-intent gate also remained explicit. No push, PR,
merge, deployment or remote action occurred.

## UX-002C Primary review action + secondary draft save — ready for Owner Review

The capture toolbar now gives `Revisar lista` the primary happy-path position;
`Guardar para después` is a quiet, dirty-state-only draft escape path. Review
continues to persist before Analyze, while Save for later writes only a
recoverable editable draft. Isolated QA UX-002A Local `v3` was reviewed without
Apply and `v4` persisted/reloaded as a draft. No Catalog, reconciliation,
memory, publication, migration or remote state changed before Apply.

Focused model/UI contracts, typecheck, production build, architecture policy
and the PBI-041 disposable PostgreSQL material suite pass locally. Chrome
passed desktop, 768 and 640 light plus 640 dark. This is Owner Review evidence,
not acceptance, PR, merge or deployment evidence.

## UX-002D Capture mode friction audit — Owner decision ready

Read-only evidence traces persisted FULL/COMPACT semantics and distinguishes
their one material difference: FULL may create sufficiently described new rows;
COMPACT requires an identifier and blocks unmatched rows. No product, database
or fixture mutation occurred. The audit recommends a future default-plus-
advanced design, subject to Owner decisions; it does not implement it. See the
[domain audit](../../../domain/PRICE_LIST_UX_002D_CAPTURE_MODE_FRICTION_AUDIT.md).

## UX-002D.1 Advanced capture-mode option — ready for Owner Review

Fresh loads use FULL without a visible mode choice. COMPACT is an accessible
advanced restricted-update option whose copy states its identifier requirement
and prohibition on new items. `replaceDraft` persists the requested validated
mode atomically; disposable PostgreSQL proves FULL → COMPACT → FULL and reload
authority. No migration, matching, completeness, duplicate, Apply or Catalog
semantics changed. Local-only Owner Review; no remote action occurred.
