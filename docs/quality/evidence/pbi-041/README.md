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
- [UX-002A.1 Duplicate Input Resolution Audit](../../../domain/PRICE_LIST_UX_002A1_DUPLICATE_INPUT_RESOLUTION_AUDIT.md)

PBI-040 is `Done`, `Released: NO`. PBI-041 is the single WIP and stops at local
Owner Review. Advanced Supplier Reconciliation remains a deferred outcome
without PBI ID, selection or readiness.

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
behavior changed, and no data was saved during QA. The separate preexisting
PBI-041 PostgreSQL performance budget remains outstanding; this is not Owner
acceptance, integration or deployment evidence.
