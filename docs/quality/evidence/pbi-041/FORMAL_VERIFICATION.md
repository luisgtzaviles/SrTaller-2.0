# PBI-041 — Independent Formal Verification

## Status after PR #55 review

The PASS below is preserved as historical evidence for implementation
`690282abb73c71f67a4e4d00530b2bc58207d2eb`. Independent review of PR #55
subsequently recorded `REVIEW-041-001`, and the authorized local remediation
changed product code in commits `f5551be` and `1d113e8`.

**Current status: STALE — the changed candidate requires a new independent
Formal Verification.** REVIEW-REMEDIATION-1 passes local base `verify` and one
authoritative `verify:full`, but that does not carry this historical verdict
forward. See
[`REVIEW_REMEDIATION_1.md`](REVIEW_REMEDIATION_1.md).

## Historical formal verdict

**PASS** — candidate implementation
`690282abb73c71f67a4e4d00530b2bc58207d2eb` satisfies the authoritative
PBI-041 acceptance contract, architecture, security, PostgreSQL, data-integrity
and performance gates. No blocker or condition remains.

This evidence was produced independently from the prior readiness conclusion.
No product code, test, migration, verification infrastructure or Owner data was
changed during Formal Verification. Promotion, PR, merge, deploy, Owner
Acceptance, `Done` and `Released` remain separate governed states.

## Candidate and repository state

| Check | Verified result |
|---|---|
| Branch | `feature/pbi-041-bulk-catalog-composer` |
| Candidate implementation | `690282abb73c71f67a4e4d00530b2bc58207d2eb` |
| `origin/main` | `100eb9abc8b8b3b01da5dcc312777b59bf01a615` |
| Divergence | 166 ahead / 0 behind |
| Upstream | none |
| Remote PR | none |
| Candidate drift | none |
| Tracked working tree before FV | clean |
| Allowed untracked Owner artifact | `apps/dev-preview-web/src/.DS_Store` only |

## Contract reconstruction

The verified outcome is the initial Bulk Catalog Composer and versioned
Supplier intake: paste-oriented capture from a supplier list, durable immutable
Supplier Version/Listing evidence, exact and human-governed reconciliation,
explicit atomic Apply, stable Catalog identity, append-only price/cost/history,
and tenant-scoped audit and authorization.

The verification found no implementation of the explicitly deferred Advanced
Supplier Reconciliation outcome, supplier APIs, CSV/XLSX adapters,
Procurement/Inventory/Caja/Repair Concepts, bulk cost revocation, Branch
override mutation, fuzzy automatic merge, or unsupported 50k publication.

## Acceptance matrix

| Criterion | Result | Independent evidence |
|---|---|---|
| AC-01 | PASS | Paste/ingest contracts and governed 1.5k/10k material paths create Source and initial Version without mandatory supplier codes. |
| AC-02 | PASS | Draft reload, optimistic versioning and concurrent-owner conflict contracts pass. |
| AC-03 | PASS | Server identifiers, duplicate grouping and explicit winner tests reject last-row-wins. |
| AC-04 | PASS | Preview DTO/model separates observations, proposal, evidence, before/after, pending/unresolved and preserves Branch overrides. |
| AC-05 | PASS | PostgreSQL material tests block unresolved/conflict/stale/revoked authority and prove atomic rollback. |
| AC-06 | PASS | Apply creates items, revisions, audit and report idempotently; retry does not duplicate effects. |
| AC-07 | PASS | Only exact valid historical Memory preselects targets; known rows do not require per-row clicks. |
| AC-08 | PASS | Corrected mappings retain history; inconsistent historical evidence remains ambiguous. |
| AC-09 | PASS | SupplierObservedTitle stays immutable; description/classification are opt-in and price/cost revisions require real change. |
| AC-10 | PASS | COMPLETE absence is observational, not lifecycle mutation; Branch override precedence remains intact. |
| AC-11 | PASS | Material PostgreSQL Tenant-isolation and cross-Tenant denial cover Sources through Catalog effects. |
| AC-12 | PASS | Raw cleanup is idempotent and does not cascade into structured evidence, Memory, revisions or report. |
| AC-13 | PASS | Automated UI foundation and local Chrome smoke cover desktop/768, theme and keyboard contracts; performance budgets pass. |
| AC-14 | PASS | 36-row paste, technical casing, raw provenance, fill/undo, draft and context reload contracts pass. |
| AC-15 | PASS | Invalid-draft aggregation, first-error focus and virtualized row/column navigation contracts pass without partial persistence. |
| AC-16 | PASS | Server assigns monotonic `vN`; persistent global errors and transient confirmation Toast semantics are covered. |
| AC-17 | PASS | Bulk retire leaves zero active targets without deleting identity/history and requires ADR-013 Level 2 authority. |
| AC-18 | PASS | Exact unique historical targets classify `REACTIVATE` on the same item/SKU/barcode; ambiguity remains blocked. |
| AC-19 | PASS | Reactivation plus allowed revisions is atomic and idempotent; no partial `REACTIVATE_AND_UPDATE` state exists. |
| AC-20 | PASS | Batch retirement derives only `CREATED` resolutions; `MATCHED`/`UPDATED` remain untouched. |
| AC-21 | PASS | Isolated Virgin Tenant evidence proves 36 AG rows genuinely `NEW` and reversible. |
| AC-22 | PASS | Actor change, stale/expired plan, context drift and revoked capability fail closed without partial retirement. |
| AC-23 | PASS | Concurrent saves allocate unique monotonic versions and idempotent retry returns the same Version. |
| AC-24 | PASS | Supplier selection alone creates no empty Version; first valid Save assigns `vN` and preserves description. |
| AC-25 | PASS | Sidebar grouping/newest-first metadata, complete collapse, released grid width and accessible restore control pass. |
| AC-26 | PASS | Draft-only Source deletion requires exact capability, reauthentication and two confirmations without Enter/double-click bypass. |
| AC-27 | PASS | Published/dependent Source deletion is denied server-side and hidden without authority; Catalog remains unchanged. |
| AC-28 | PASS | Safe deletion uses append-only contextual audit and no domain cascade. |
| AC-29 | PASS | COMPLETE coverage explains additions before Apply and material Resolution provenance after Apply; exception-first ordering is accessible. |

**Total:** 29 PASS, 0 FAIL, 0 N/A. Unverified criteria: none.

## Historical FV findings

| Finding | Result | Verification |
|---|---|---|
| `B-041-FV-001` | RESOLVED | Protected `api.ts` change is authorized by exact old/new blob, PBI and reason; unrelated/unknown/wildcard drift is rejected. |
| `B-041-FV-002` | RESOLVED | All three PBI-041 migrations are registered in the governed architecture manifest. |
| `B-041-FV-003` | RESOLVED | AST inventory governs 29 exact identities and detects removal, unknown and duplicate tests. |
| `B-041-FV-004` | RESOLVED | Composer visual-foundation checker passes with no prohibited inline style, noncanonical radius or `!important`. |
| `B-041-FV-005` | RESOLVED | Access-role expectations match exact capability registry and SQL ordering; material semantics remain asserted. |
| `B-041-FV-006` | RESOLVED | Access-session rollback uses the authoritative manifest rather than a stale manual latest-migration assumption. |
| `B-041-FV-007` | RESOLVED | Contextual fixture resets `public` only in a governed disposable DB; synthetic leak detection and external `pg_dump` guard remain strict. |

No gate weakening was detected. Historical FAIL/BLOCKED evidence remains in
the readiness and remediation documents rather than being rewritten.

## Architecture

| Contract | Result |
|---|---|
| DEC-005 modular boundaries and enforcement | PASS |
| DEC-044 typed error contract | PASS |
| DEC-049 PostgreSQL + Kysely ownership | PASS |
| ADR-004 shared-schema Tenant isolation | PASS |
| ADR-012 roles, capabilities and contextual authorization | PASS |
| ADR-013 sensitive-action controls | PASS |
| Price List architecture | PASS |
| Authoritative architecture checker | PASS |

Architecture findings: none.

## Database, migrations and material inventory

- Governed migrations: **75**, ordered and unique.
- PBI-041 migrations:
  - `20260917190000_catalog_create_field_policies.ts`
  - `20260917190100_access_add_catalog_configuration_capabilities.ts`
  - `20260917190200_access_add_granular_catalog_capabilities.ts`
- Clean PostgreSQL 18.4 apply: PASS; second run: **0 pending**.
- Rollback and schema contracts: PASS.
- Cleanup: PASS; retained objects: none.
- Material inventory: **29 exact identities** — Composite 17, PBI-039 2,
  PBI-040 1, PBI-041 9.
- AST inventory, unknown-test rejection, removal detection and duplicate
  detection: PASS. Wildcard/broad bypass: none.

## Catalog and Bulk domain

CatalogItem identity/lifecycle, Type, Category, Brand, Base Price, Reference
Cost, SupplierSource, SupplierCatalogVersion, Resolution, Memory, Coverage and
Field Policy all pass domain and material PostgreSQL verification.

The happy path is coherent:

`Supplier → PARTIAL/COMPLETE → paste/capture → optional completion → Review →
Save + Analyze → exception resolution → READY → Apply → immutable APPLIED`.

- PARTIAL absence does not retire; COMPLETE compares against the latest prior
  APPLIED COMPLETE baseline; first COMPLETE reports `NO_BASELINE`.
- FULL permits `NEW`; COMPACT requires an identified target and cannot create a
  target implicitly.
- Stale predecessor protection and APPLIED immutability pass.
- Analyze performs no durable learning; Apply is the mutation boundary.

## Duplicates, policy and references

- Exact duplicates consolidate; contradictory duplicates form one effective
  attention group.
- The explicit winner is `APPLY`; siblings are `EXCLUDE`; decisions survive
  reload/reanalysis. Source navigation is independent.
- A valid prospective duplicate winner does **not** require a fabricated UUID;
  true identity ambiguity remains blocked. `titleDecision` is covered.
- Tenant policy is append-only, restorable and optimistic-concurrency safe.
- Domain-fixed FULL minimum: Type, Title, Category and Base Price.
- REQUIRED uses effective-value blocking; ESSENTIAL is presentation priority;
  OPTIONAL is non-blocking. Current policy is rechecked at direct Apply.
- Base Price zero cannot publish for a new ACTIVE FULL item at Analyze or Apply.
  Reference Cost zero is permitted while optional/essential; when Tenant policy
  makes it REQUIRED, a meaningful positive effective value is required.
- Raw observed reference, normalized key, display name and canonical Brand are
  distinct. Acronym/mixed-case preservation and exact reuse pass; fuzzy
  auto-merge is absent.
- Safe deterministic pending capture may coexist with `NEW`; malformed or
  ambiguous values remain attention. Promotion/assignment is explicit,
  Tenant-wide, atomic, audited and preserves Supplier history.

## Authorization and sensitive actions

The capability model is explicit and contains no role-name branching. Material
and contract evidence passes for:

- `price_list.read`;
- `catalog.reference_cost.read` / `.manage`;
- `catalog.items.create` / `.update` / `.deactivate`;
- `catalog.prices.manage` / `catalog.branch_prices.manage`;
- `catalog.import.read` / `.prepare` / `.publish`;
- `catalog.items.bulk_retire`;
- `catalog.suppliers.delete`;
- `catalog.configuration.read` / `.manage`.

Read does not imply mutation; cost read does not imply cost manage; item update
does not imply price manage; prepare does not imply publish; publish does not
replace field-effect authority; deactivate does not imply bulk retire; and
configuration remains independent. Direct API checks, multi-role union,
session refresh/revocation, trusted Branch context and cross-Tenant denial pass.
Bulk retire and Supplier delete preserve ADR-013 Level 2 controls; capability
alone cannot bypass reauthentication/confirmation/context revalidation.

## Read-only Owner-data verification

| Evidence | Verified result |
|---|---|
| AviCell v3 | `COMPLETE`, `FULL`, `APPLIED` |
| Version ID | `382ec711-78c3-4a46-ba65-b1cb974c4b2a` |
| Physical observations | 744 |
| Effective outcomes | 742 |
| Decisions | 742 `NEW/APPLY`, 2 `UNCHANGED/EXCLUDE` |
| Durable effects | 742 `CREATED`, 2 `EXCLUDED`, 742 distinct items and Memory entries |
| Published at | `2026-09-18 19:26:15.11+00` |
| Publisher | Luis |
| Duplicate 468/469 | 468 excluded; 469 created; no duplicate item |
| Duplicate 611/612 | 611 created; 612 excluded; no duplicate item |
| Row 618 | v2 preserves `V2314 COPIA`; v3/final Category is `Pantallas` |
| Malformed Category canonicalization | no canonical or pending `V2314 COPIA` |
| Promoted AviCell Brand groups | 16 |
| Relinked AviCell CatalogItems | 618 |
| Remaining AviCell pending Brand groups/items | 0 / 0 |
| Canonical Brand duplicates | none |
| Non-AviCell `Aple` | pending, two items, unchanged |

Row 411 maps to CatalogItem
`8d465ac8-e2b5-4197-9ea1-ee7af1b624be`, now `INACTIVE` at version 3. Its
historical zero price/cost remains traceable through one revision each; no
commercial value was fabricated and no physical delete occurred. Listing,
Resolution, Memory, identifiers and audit provenance remain. The forward
zero-price rule prevents recurrence.

Current read-only Tenant summary: 787 CatalogItems (783 active, 4 inactive),
17 canonical Brands, one semantic pending Brand group/two items (`Aple`), seven
SupplierSources, 84 SupplierCatalogVersions, 1,346 Resolutions, 788 Memory
records and eight Field Policy versions. Apply, duplicate choices, Brand
promotion, row-411 deactivation and policy history are attributable to Luis and
the expected capabilities. No unexplained data discrepancy exists.

## UI and Composer regressions

Automated coverage passes for selected-source Supplier history, explicit
new-load gate, PARTIAL/COMPLETE, FULL/COMPACT, toolbar, Gridlines, normalized
column resize, row remove/Undo, Brand normalization, policy-driven Essentials,
required fields, duplicate cards/winner controls, exception navigation,
read-only mode and prepare/publish separation.

The visual-foundation gate reports zero prohibited inline styles,
noncanonical radii and `!important` declarations on the governed Composer
surface. Authenticated Chrome smoke rendered Lista de precios, Bulk Composer,
Field Policy settings, Pending Brand governance and Roles at desktop and 768px
without white screen, critical clipping or page-level horizontal overflow.
Light/dark and keyboard behavior are covered by focused contracts and prior
material evidence. No Owner mutation was performed.

## Authoritative verification

### Base `verify`

- Toolchain: Node.js 24.18.0, pnpm 11.15.1.
- Typecheck: PASS.
- Build: PASS.
- Tests: **934 PASS, 0 FAIL, 29 governed PostgreSQL skips**.
- Structure, architecture, external configuration, visual foundation and
  production-catalog exclusion: PASS.

### `verify:full` — one authoritative execution

| Stage | Result |
|---|---|
| 0 Candidate + integration baseline | PASS |
| 1 Toolchain | PASS |
| 2 Repository integrity | PASS |
| 3 Base verify | PASS |
| 4 Material PostgreSQL composite | PASS — 17/17 |
| 5 PBI-039 PostgreSQL | PASS — 2/2 |
| 6 PBI-040 PostgreSQL | PASS — 1/1 |
| 7 PBI-041 PostgreSQL | PASS — 9/9 |
| 8 Preview PostgreSQL runtime | PASS — PostgreSQL 18.4, UTC, 75/75, second run 0 |
| 9 Provision compiled smoke | PASS |
| 10 Backend smoke | PASS |
| 11 UI smoke | PASS |
| 12 Cleanup | PASS |
| 13 Final fingerprint | PASS |

Cleanup and final fingerprint pass; no retained object exists. The run was not
repeated to obtain green.

A separate focused verification of 15 relevant contract files produced **123
PASS, 0 FAIL, 0 skipped**.

## Performance

| Metric | Formal run |
|---|---:|
| Ingest | 4,960.0 ms |
| Analyze | 456.7 ms |
| Preview | 38.4 ms |
| Publish | 2,170.2 ms |
| Historical search | 79.7 ms |
| Heap delta | 16.1 MiB |

10k publish budget: 30,000 ms. Result: **PASS**. Reruns to obtain green: 0.

## Security and documentation hygiene

- Repository secret scan: PASS.
- Owner PIN in candidate/evidence: NO.
- Credential leak: none.
- Markdown local links: PASS — 666 tracked Markdown files / 4,091 links.
- Documentation policy consistency: PASS for SPRINT-03 and PBI-041.
- `git diff --check`: PASS before evidence materialization.
- Historical failures remain visible and are cross-referenced by later
  remediation. Stale material contradiction after this status reconciliation:
  none.

The sole workflow-declared, non-blocking build warning is the accepted Vite
main-chunk size warning. It is not a formal finding or a failed gate.

## Formal findings and verdict basis

**Formal findings: NONE.**

- Blockers: 0.
- Conditions: 0.
- Non-blocking formal observations: 0.
- Unexplained data discrepancies: none.
- Unverified acceptance criteria: none.

Therefore, PBI-041 Independent Formal Verification is **PASS**. The next
eligible governance state is **READY FOR PROMOTION / PUSH + PR**, but no remote
or integration action is authorized or performed by this task.

## Final controls

- Candidate implementation verified:
  `690282abb73c71f67a4e4d00530b2bc58207d2eb`.
- Owner data mutation during FV: none.
- Push: not executed.
- PR: not created or modified.
- Merge: not executed.
- Deploy: not executed.
- Force push: not executed.
