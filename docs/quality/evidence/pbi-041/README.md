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
- [UX-004 Catalog Operational Authorization Audit](../../../domain/PRICE_LIST_UX_004_CATALOG_OPERATIONAL_AUTHORIZATION_AUDIT.md)
- [UX-005 First Supplier Baseline Reconciliation Audit](../../../domain/PRICE_LIST_UX_005_FIRST_SUPPLIER_BASELINE_RECONCILIATION_AUDIT.md)
- [UX-005.2 Avicell Large-List Reanalysis Proof](../../../domain/PRICE_LIST_UX_0052_AVICELL_LARGE_LIST_REANALYSIS_PROOF.md)
- [UX-005.3 Exception-to-Source Correction Navigation](../../../domain/PRICE_LIST_UX_0053_EXCEPTION_TO_SOURCE_CORRECTION_NAVIGATION.md)
- [UX-005.4 Duplicate Winner Controls Preservation](../../../domain/PRICE_LIST_UX_0054_DUPLICATE_WINNER_CONTROLS_PRESERVATION.md)
- [UX-005.5 AviCell Post-Apply Integrity Verification](../../../domain/PRICE_LIST_UX_0055_AVICELL_POST_APPLY_INTEGRITY_VERIFICATION.md)
- [UX-005.6 Published Data Integrity and Pending Reference Governance](../../../domain/PRICE_LIST_UX_0056_PUBLISHED_DATA_INTEGRITY_AND_PENDING_REFERENCE_GOVERNANCE.md)
- [UX-005.6A Pending Brand Display Canonicalization](../../../domain/PRICE_LIST_UX_0056A_PENDING_BRAND_DISPLAY_CANONICALIZATION.md)
- [UX-005.7 AviCell Owner Data Remediation](../../../domain/PRICE_LIST_UX_0057_AVICELL_OWNER_DATA_REMEDIATION.md)
- [Final Closure & Readiness Audit](FINAL_CLOSURE_READINESS_AUDIT.md)
- [Verification Gate Remediation](FV_GATE_REMEDIATION.md)
- [UX-002A.1 Duplicate Input Resolution Audit](../../../domain/PRICE_LIST_UX_002A1_DUPLICATE_INPUT_RESOLUTION_AUDIT.md)

PBI-040 is `Done`, `Released: NO`. PBI-041 is the single WIP. The final
readiness audit found two required verification-gate blockers; their first
authorized remediation resolved both, and FV-GATE-REMEDIATION-2 resolved the
subsequent PostgreSQL inventory and Composer visual-foundation blockers. Base
`verify` is green. The single authorized `verify:full` then failed in Stage 4
Material PostgreSQL composite at `test/access-role-postgresql.test.mjs`;
cleanup and final fingerprint passed. `B-041-FV-005` therefore keeps the PBI
before Formal Verification and Owner Acceptance. Advanced Supplier
Reconciliation remains a deferred outcome without PBI ID, selection or
readiness.

## UX-005.1 — New Item Classification with Pending Reference Capture

The UX-005 audit preserves Avicell as historical evidence. For future `FULL`
analysis, safely capturable noncanonical Category/Brand values can remain
`NEW` until the existing authorized Apply path persists a pending reference.
Unsafe references, missing required values, duplicates, candidates and
`COMPACT` no-target rows remain attention; Analyze makes no durable writes.

## UX-005.2 — Avicell large-list reanalysis proof

The authorized no-Apply walkthrough records the real 744-row result after
UX-005.1: 739 `NEW`, one genuine pending Category and two effective duplicate
contradictions. It preserves Avicell v2 in `RECONCILING` with no publication,
Catalog, Resolution or Memory mutation, and records the concrete exception
correction/navigation and bulk-accept UX findings.

## UX-005.3 — Exception-to-source correction navigation

The local proof navigates duplicate and pending-reference exceptions by their
physical row identities. A correction starts only in browser memory; an
explicit save/review creates the linked successor version. The predecessor
remains evidence but is server-side stale for Analyze, decisions and Apply.
No AviCell value, version or Catalog effect was written during the walkthrough.

## UX-005.4 — Duplicate winner controls preservation

UX-005.4 restores the explicit winner action without removing UX-005.3 source
navigation. The isolated PostgreSQL proof verifies one selected prospective
`NEW / APPLY`, sibling `EXCLUDE`, reload/reanalysis persistence and no UUID;
the existing target-known proof retains required `titleDecision`. AviCell v3
remains unmodified with its two Owner business choices pending.

## UX-005.5 — AviCell post-Apply integrity verification

The post-Apply, read-only verification confirms AviCell v3 as the first
`COMPLETE / APPLIED` baseline: 744 physical observations reconcile to 742
created CatalogItems, two explicit duplicate sibling exclusions, 742
Resolution/Memory records and 742 publication audit events. It also records
two closure blockers without repair: row 411 published with price/cost zero,
and new Brand values remain pending rather than canonical. See the
[full verification](../../../domain/PRICE_LIST_UX_0055_AVICELL_POST_APPLY_INTEGRITY_VERIFICATION.md).

## UX-005.6 — Published data integrity and pending Brand governance

The forward rule now rejects a zero effective base price at Analyze and repeats
the rejection in Apply. Reference cost remains optional/essential unless the
Tenant policy makes it required. Pending Brand governance is Tenant-wide and
uses configuration read/manage authority: exact canonical reuse is allowed,
fuzzy promotion is not, and a resolution relinks its item group atomically
without rewriting Supplier history. En ese checkpoint, AviCell v3 y su fila
411 permanecían read-only hasta una decisión Owner separada. See
[UX-005.6](../../../domain/PRICE_LIST_UX_0056_PUBLISHED_DATA_INTEGRITY_AND_PENDING_REFERENCE_GOVERNANCE.md).

## UX-005.6A — Pending Brand display canonicalization

Pending Brand governance now derives a human-readable proposal without changing
raw supplier provenance or normalized grouping. Exact canonical spelling wins;
uniform casing is conservative, short acronyms and meaningful mixed casing are
preserved, and no fuzzy inference is introduced. The resolver starts a new
Brand proposal from that display name but remains an explicit authorized
mutation. The AviCell review at that point was read-only: its 16 pending Brand
groups and 618 items remained untouched. See
[UX-005.6A](../../../domain/PRICE_LIST_UX_0056A_PENDING_BRAND_DISPLAY_CANONICALIZATION.md).

## UX-005.7 — AviCell Owner data remediation

Con autorización Owner explícita, las 16 Brands pendientes de AviCell se
promovieron y religaron atómicamente a sus 618 CatalogItems. El grupo sintético
no-AviCell `Aple` permanece pendiente. La fila 411 se desactivó mediante el
lifecycle individual, sin inferir precio/costo desde v1 `DRAFT` ni reescribir
Supplier history. AviCell v3 sigue `COMPLETE/APPLIED` con 744 observaciones.
Ver [UX-005.7](../../../domain/PRICE_LIST_UX_0057_AVICELL_OWNER_DATA_REMEDIATION.md).

## UX-002E / UX-002E.1 missing-data context

The audit preserved AG `v52`/`v53` and confirmed the identity boundary around
missing Brand. UX-002E.1 implements only the safe presentation consequence:
an empty, collapsed `Completar datos faltantes` disclosure for editable FULL
loads. Its action is explicit, empty-only and never overwrites supplied data;
it has no Source/history preference, Save, Analyze or Catalog side effect.

## UX-003 Bulk Catalog Field Policy

UX-003 traces the current fixed FULL/COMPACT contracts, field inventory, Tenant
ownership, authorization, persistence and the Nueva reparación configuration
pattern. It recommends a Tenant-owned effective-value policy separate from
Composer presentation, so COMPACT identified updates do not fail merely because
a supplier omits a value already known safely by Catalog. The audit records
`UX3-001..017`. UX-003.1 materializa la autoridad Tenant-wide versionada y
UX-003.2 su configuración. UX-003.3 hace que Composer consuma únicamente la
proyección operacional autorizada: `Esenciales` deriva REQUIRED/ESSENTIAL y
`Todas` conserva los campos autorizados; Costo se redacta server-side sin su
capability. Enforcement, FULL/COMPACT, Review, Analyze, Apply, SupplierSource,
Version y CatalogItem no cambian. El proof Chrome de UX-003.3 pasó a `768 px`
y `640 px` en ambos temas, sin overflow y con teclado; la policy final quedó
en `v6` con Descripción Opcional, Marca Esencial y Costo Esencial. UX-003.3A
corrigió una regresión local de redimensionamiento: los anchos fraccionales del
navegador se normalizan por clave canónica antes de llegar al grid. El cambio
de vistas o policy conserva dimensiones válidas y Chrome pasó arrastres
repetidos en escritorio, `768 px` y `640 px`, claro/oscuro, sin mutar Catalog,
versiones ni ejecutar Save/Analyze/Apply.
See the
[UX-003 audit](../../../domain/PRICE_LIST_UX_003_BULK_CATALOG_FIELD_POLICY_AUDIT.md).

## UX-004 Catalog operational authorization foundation

UX-004 first audited the authorization boundary, then UX-004.1 materialized
four bounded capabilities, the session allowlist, a capability-derived
backfill and server-side transitional guards. The migration grants only item
successors to existing `catalog.manage` roles and history read to existing
prepare roles; it grants no sensitive authority and has no CatalogItem or
SupplierCatalogVersion effect. Price-list UI redesign and a new role matrix
remain outside this checkpoint. The decisions and compatibility mapping are in
the
[UX-004 audit](../../../domain/PRICE_LIST_UX_004_CATALOG_OPERATIONAL_AUTHORIZATION_AUDIT.md).

## UX-004.2 Price List + item authority integration

UX-004.2 connects the materialized granular registry to Price List. Ordinary
`price_list.read` remains list/detail read only; it does not serialize cost or
grant create, update, individual lifecycle or bulk retirement. Creation,
metadata, lifecycle, prices, cost and Branch overrides each compose their own
current capability. Direct new-item and item-detail routes reproduce these
boundaries, while the server remains authoritative. Bulk read/prepare UX is
explicitly deferred to UX-004.3. See [implementation evidence](IMPLEMENTATION_EVIDENCE.md)
and the [UX-004 audit](../../../domain/PRICE_LIST_UX_004_CATALOG_OPERATIONAL_AUTHORIZATION_AUDIT.md).

## UX-004.3 Bulk Read / Prepare / Apply separation

Bulk history is independently available through `catalog.import.read` in a
read-only Composer surface. Preparation remains `catalog.import.prepare`; a
READY batch can be applied by a separately authorized `catalog.import.publish`
user only with the item/price/cost effects it actually needs. The disposable
PostgreSQL handoff evidence preserves the publisher as audit actor. No
mandatory preparer/publisher separation, Owner-batch Apply, remote action or
deployment occurred.

## UX-004.4 Role matrix and authorization proof

Disposable PostgreSQL proves role-derived capability union, Branch/Tenant
isolation and immediate role-capability removal for Attention, Encargado,
Publisher and Cost Viewer fixtures. Direct protected-operation contracts prove
ordinary read, reference-cost read, preparation and publication remain
independent. Chrome reviewed the existing human-labelled Role editor at
desktop/768/640 in both themes and keyboard navigation without saving a role or
touching Owner Catalog data. The result is local Owner Acceptance ready; no
PIN, push, PR, merge or deploy occurred.

UX-003.4 now enforces `REQUIRED` from the effective resulting value rather
than raw supplier cells. Analyze records typed attention; Apply rereads the
current policy to reject a stale or direct bypass. Explicit incoming data or a
safely resolved preserved CatalogItem can satisfy a requirement; no history,
SupplierSource default or title inference can. The QA version was not applied
and the final local policy is `v8`: Descripción Opcional, Marca Esencial and
Costo Esencial.

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

## UX-004.5 Supplier history selection consistency

The local Composer history now follows only the selected **Explorar
proveedor** source. It retains a real zero-version state, does not fall back to
AG after explicit selection and leaves a pending new-load supplier independent.
The New Load gate remains explicit. See
[implementation evidence](IMPLEMENTATION_EVIDENCE.md) and the
[UX-001 supplier-selection boundary](../../../domain/PRICE_LIST_UX_001_SUPPLIER_SELECTION_GATE_AUDIT.md).

## UX-004.6 Composer grid action toolbar consolidation

The three transient grid-edit actions are now grouped once in the workspace
toolbar immediately before the primary review action. Their editable-lifecycle
and disabled predicates are unchanged; no persistence or product flow changed.
The local 1280/768/640, theme and keyboard proof is recorded in the
[implementation evidence](IMPLEMENTATION_EVIDENCE.md).

### Gridlines / Cuadrícula extension

The optional spreadsheet-style gridlines are an accessible, session-local view
preference. They use real cell borders, remain available for historical
read-only presentation, and do not make a draft dirty or trigger persistence.
The local proof is recorded in the [implementation evidence](IMPLEMENTATION_EVIDENCE.md).

## UX-004.7 Capture Cleanup Ergonomics

Brand capture now prefers an existing active canonical reference and otherwise
normalizes only safe whitespace/uniform casing at paste, manual commit and
missing-data completion. The raw supplier spelling remains available in the
captured raw payload and is shown as `Original` whenever it differs from the
effective Brand. Draft-only removal is available both from the toolbar and an
active-row contextual control; Undo restores the local row snapshot. The
evidence distinguishes this pre-Analyze physical removal from the retained
post-Analyze **Excluir del lote** decision flow.

## UX-005 First Supplier Baseline Reconciliation Audit

The read-only Avicell v2 audit distinguishes `NO_BASELINE` Coverage from row
classification. Its documented 124/616 split is caused by canonical Brand
availability, not missing Supplier history or a missing CatalogItem target;
four separate physical observations form two duplicate-conflict units. No
Avicell, Catalog, Resolution, Memory, policy or audit record was changed. See
the [domain audit](../../../domain/PRICE_LIST_UX_005_FIRST_SUPPLIER_BASELINE_RECONCILIATION_AUDIT.md).
