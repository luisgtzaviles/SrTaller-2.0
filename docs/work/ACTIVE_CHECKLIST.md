# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Independent Formal Re-Verification
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: NEW INDEPENDENT FORMAL RE-VERIFICATION PASS. FV2-041-001 is resolved and the new candidate is frozen locally; no remote action has occurred.
WIP: 1/1
Progress: 8 / 8 FV2-041-001 remediation and Formal Re-Verification blocks complete.
Current: Candidate frozen locally after evidence reconciliation.
Next: Resume the master governed delivery at push / PR update only under its separate Owner authority.
Blocked: NONE for local Formal Re-Verification. Owner data, AviCell and the preexisting .DS_Store remain protected; remote actions were not executed.
Last updated: 2026-09-19 MST

## Current checkpoint — Formal Re-Verification after REVIEW-041-001

- [x] Reconcile exact branch/HEAD/remote state and preserve the docs-only tail plus untracked Owner `.DS_Store`.
- [x] Reproduce the exact owner-scoped command: 8/8 material files PASS with fresh PostgreSQL 18.4 containers and cleanup PASS.
- [x] Run prerequisites and the exact Stage 4 composite: 17/17 PASS; no ordering, shared-state, migration, product or Tenant-isolation defect reproduces.
- [x] Remediate the proven harness/orchestration diagnostic gap: the historical image-pull/bootstrap failure had no allowlisted identity and the composite discarded its stderr.
- [x] Pass focused harness, owner-scoped, composite, PBI-041 PostgreSQL and migration/schema checks.
- [x] Pass typecheck, build, architecture and base verify.
- [x] Complete a new independent review of all 29 acceptance criteria and Owner-data integrity read-only.
- [x] Run verify:full exactly once, reconcile evidence and freeze the new local candidate only if every formal predicate passes.

- [x] Prove implementation HEAD `a18d763e7ad0f8c760c8b3c9a9cf3d6f8e7a3555`, pre-FV HEAD `ab2e0738d452a8be1bfc198d27f1102125d0484c` and DOCS_ONLY delta.
- [x] Independently verify server-derived Batch binding, zero-write stale rejection, refetch capability recomposition and direct-API denial.
- [x] Verify all effect-changing decision paths advance the Batch token; preserve transactionality, idempotency, Tenant/Branch and correction-successor rules.
- [x] Pass 123/123 focused contracts and current 30-identity governed material inventory.
- [x] Pass PBI-041 PostgreSQL 10/10, 75 migrations, second run 0 pending and focused 10k budget.
- [x] Reconcile AviCell v3 and Owner data read-only with no unexplained drift.
- [x] Pass base `verify`: 935 PASS / 0 FAIL / 30 governed skips.
- [x] Execute `verify:full` exactly once with no rerun for green.
- [x] Preserve the historical `FV2-041-001` Stage 4 failure, remediate its harness cause and satisfy the mandatory predicate in the new independent campaign.
- [x] Preserve historical FV and record the independent FAIL without product, Owner-data or remote mutation.

## Current checkpoint — REVIEW-REMEDIATION-1

- [x] Revalidate exact base HEAD `008135663ce78a2c0b6d1a4860a221e60405012f`, branch, remote candidate and preexisting untracked `.DS_Store`.
- [x] Bind effect authorization to the existing authoritative `batch.lock_version` and reject stale publication before writes.
- [x] Prove concurrent `decide` invalidates the stale Apply snapshot and requires capability recomposition on refetch.
- [x] Pass focused domain, authorization and disposable PostgreSQL material race checks without Owner-data mutation.
- [x] Pass typecheck, build, architecture, base `verify` and exactly one `verify:full`; retain the 10k budget.
- [x] Reconcile PBI/evidence/FV status, fix REVIEW-041-002 and create logical local commits only.

## Current checkpoint — Independent Formal Verification

- [x] Freeze and verify implementation candidate
  `690282abb73c71f67a4e4d00530b2bc58207d2eb`; branch/divergence match and
  tracked working tree is clean.
- [x] Reconstruct the authoritative objective, scope, exclusions, dependencies
  and 29 acceptance criteria from PBI-041 and accepted architecture.
- [x] Independently verify `B-041-FV-001..007`: remediation and regression
  coverage exist, no gate was weakened and no finding remains open.
- [x] Pass architecture, 75-migration manifest/schema/rollback and 29-identity
  PostgreSQL inventory verification.
- [x] Pass base `verify`: typecheck/build and 934 PASS / 0 FAIL / 29 governed
  PostgreSQL skips.
- [x] Execute `verify:full` exactly once: Stages 0..13 PASS, PostgreSQL 17/17,
  PBI-041 9/9, cleanup and fingerprint PASS.
- [x] Verify Catalog/Bulk, Field Policy, duplicates, references, authorization,
  Tenant/Branch and ADR-013 contracts through focused independent coverage.
- [x] Reconcile AviCell v3 and current Owner data read-only with no unexplained
  integrity discrepancy and no mutation.
- [x] Pass local Chrome smoke, responsive critical surfaces, secret scan,
  Markdown links, consistency and performance budget.
- [x] Record `FORMAL_VERIFICATION.md` and reconcile status surfaces without
  claiming Owner Acceptance, PR, merge, `Done`, `Released` or deploy.

## Current checkpoint — FV Gate Remediation

- [x] Reproduce `B-041-FV-007` before editing: the functional Contextual
  Authorization body passes `1/1`, while PostgreSQL retains exactly 13 public
  PBI-041 tables omitted from the fixture's manual inventory.
- [x] Replace the manual teardown inventory with a fail-closed, transactional
  reset of `public`, restricted to governed disposable database names; the
  exact test passes `1/1` and leaves zero public tables.
- [x] Preserve the independent `pg_dump` guard unchanged and add a synthetic
  unknown-table regression that must be detected before authoritative cleanup.
- [x] Pass owner-scoped PostgreSQL `8/8` with cleanup PASS and material MATCH;
  pass contextual authorization contracts `30/30` and base `verify` with zero
  failures.
- [x] Run `verify:full` exactly once: Stages 0..13 PASS, PostgreSQL composite
  17/17, PBI-041 9/9, cleanup PASS and no new blocker.
- [x] Reconcile the short Closure Readiness Recheck: `B-041-FV-001..007`
  resolved, new blockers none, ready for independent Formal Verification.

- [x] Reproduce the original `verify` migration-contract failure and
  `verify:full` Stage 0 protected-surface failure before editing.
- [x] Authorize only the exact `apps/dev-preview-web/src/api.ts` blob change,
  retain the 20-path guard and reject drift, unknown paths and wildcards.
- [x] Register the exact PBI-041 migrations across strict 75-migration
  contracts; retain unknown, duplicate, order and ownership rejection.
- [x] Prove focused gates and PostgreSQL 18.4: 75 applied, second run 0
  pending, 10/10 material tests and disposable cleanup.
- [x] Register all 29 material PostgreSQL tests by exact identity and stage;
  remove Composer inline style, compound radius and `!important` structurally.
- [x] Make base `verify` pass after material PostgreSQL, typecheck and build.
- [x] Reproduce `B-041-FV-005` in isolation: the PostgreSQL catalog fixture
  omitted `catalog.suppliers.delete` and used non-SQL ordering; no product,
  migration, isolation or authorization defect was found.
- [!] Re-run related Access-role PostgreSQL/capability/session checks: the
  owner-scoped runner passed Access-role and then exposed `B-041-FV-006` in
  Access-session; base `verify` and `verify:full` were not reached.
- [x] Reconcile the Access-session rollback fixture with the governed migration
  manifest; the exact PostgreSQL 18.4 test passes without production changes.
- [x] Re-run owner-scoped PostgreSQL after Access-session remediation; that
  historical attempt exposed `B-041-FV-007`, subsequently resolved by FV-5.
- [x] Run the short Closure Readiness Recheck after both gates passed; retain
  Owner Acceptance, PR, merge, Done, Released and deploy as separate states.

## Previous checkpoint — Final Closure & Readiness Audit

- [x] Reconcile branch lineage, PBI contract, UX slices, canonical state and
  local Owner-data evidence without mutating product data.
- [x] Verify AviCell v3, row 411, pending Brand remediation, migration status,
  tenant-scoped counts, audit events and local runtime health read-only.
- [x] Run the required governed `verify:full` once; capture its Stage 0
  protected-surface failure and successful cleanup/fingerprint stages.
- [x] Run proportional independent gates: PostgreSQL PBI-041 10/10, current
  10k budget pass, DEC-005 architecture PASS and authenticated local UI smoke.
- [x] Record the final readiness audit, performance classification and the
  formal-verification package without claiming Acceptance, merge or Done.
- [!] Remediate the PBI-039 protected-surface guard or obtain a governing
  exception for the intentional typed `PreviewApiError.parameter` change.
- [!] Update the migration API contract allowlist for the three governed
  PBI-041 migrations, then rerun base/full verification on a frozen candidate.

## Previous checkpoint — UX-005.7 AviCell Owner Data Remediation

- [x] Revalidate AviCell v3, the 16 pending Brand groups/618 items, the
  separate non-AviCell group, row 411 and the normal domain authority.
- [x] Promote exactly the 16 AviCell Brand groups through Configuración → Lista
  de precios; create one canonical identity per normalized key and relink the
  618 affected items atomically.
- [x] Preserve raw Supplier provenance and leave the synthetic non-AviCell
  `Aple` group unchanged; no fuzzy mapping or bulk operation.
- [x] Deactivate only AviCell v3 row-411 CatalogItem through the individual
  lifecycle; do not infer price/cost from v1 `DRAFT` or alter its title.
- [x] Prove AviCell v3 remains `COMPLETE/APPLIED` with 744 listings and that
  audit/authorization/tenant boundaries record the intended mutations.
- [x] Reconcile PBI, UX-005.5/005.6/005.6A, evidence and this checklist; run
  proportional local checks and create only a local documentation commit.

## Previous checkpoint — UX-005.6A Pending Brand Display Canonicalization

- [x] Audit UX-004.7 Brand casing, pending-reference grouping, canonical lookup and promotion path.
- [x] Reuse one deterministic display helper for governance labels and promotion proposal defaults.
- [x] Preserve raw provenance, normalized grouping and authorization without migration, Catalog, Memory or Resolution writes.
- [x] Complete read-only AviCell proof: 16 pending groups / 618 items, responsive themes and keyboard.
- [x] Run focused gates, reconcile evidence/checklist and create only local logical commits for Owner Review.

## Previous checkpoint — UX-005.6 Published Data Integrity + Pending Reference Governance

- [x] Audit current zero-value and required-effective-value semantics, pending Brand persistence, filtering, authority and lifecycle.
- [x] Add the forward base-price-greater-than-zero invariant to Analyze/Review and independent Apply defense.
- [x] Make required reference-cost zero semantics explicit and policy-aware without treating optional/essential zero uniformly as invalid.
- [x] Implement tenant-wide normalized pending Brand governance: grouped read, promote new canonical Brand and explicit assignment to an existing Brand.
- [x] Preserve supplier history/provenance and relink only affected CatalogItems atomically; add audit, authorization and tenant-isolation coverage.
- [x] Prove isolated UI/filter/responsive/keyboard flow and read-only AviCell group counts; no AviCell governance or row-411 mutation.
- [x] Run specified gates, reconcile evidence/checklist and create only local logical commits for Owner Review.

## Previous checkpoint — UX-005.5 AviCell Large-List Post-Apply Integrity Verification

- [x] Record preflight, local health, 75 migrations and authoritative AviCell/Tenant/Branch/version identifiers without writes.
- [x] Reconcile 744 physical observations to 742 effective outcomes, explicit duplicate winners and corrected successor row 618.
- [x] Verify attributable Catalog/reference effects, provenance, Resolutions, Memory and audit; record pending-Brand and zero-value findings without repair.
- [x] Verify COMPLETE baseline, Tenant/Branch scope, lifecycle/idempotency and post-Apply Chrome UI without clicking any mutating control.
- [x] Run documentation links, consistency, secret scan and diff checks. The strict docs-only helper classifies `docs/domain/**` as `FULL`; no `verify:full` ran because it is outside this authorization.
- [x] Record evidence and checklist in local documentation commit `cd6d273`; stop for Owner decision on the recorded blockers.

## Previous checkpoint — UX-005.4 Duplicate Winner Controls Preservation

- [x] Inspect AviCell v3 read-only: 744 physical rows, 742 effective units, 740 resolved units and two unresolved duplicate groups (468/469, 611/612); no Owner-data mutation.
- [x] Classify root cause: the UI only offered the old winner action for a shared existing Catalog target, and the decision path rejected the shared no-target NEW case.
- [x] Restore explicit `Usar fila N` plus separate `Ir a fila N` actions with the existing prepare capability boundary.
- [x] Prove atomic winner APPLY / sibling EXCLUDE, title-decision preservation, reload/reanalysis and no UUID for a no-target duplicate in isolated PostgreSQL and Chrome QA.
- [x] Complete AviCell v3 navigation-only and responsive Chrome proof without selecting a winner or applying a batch.
- [x] Reconcile PBI/evidence/checklist and run the authorized proportional gates; keep commits local only.

## Previous checkpoint — UX-005.3 Exception-to-Source Correction Navigation

- [x] Audit physical-row identity, policy-driven field visibility, capabilities and the immutable analyzed-version lifecycle.
- [x] Add capability-aware navigation that reveals the grid, locates the physical row and focuses an authorized relevant field.
- [x] Start correction locally through the existing successor-Draft/Version model without mutating an analyzed snapshot; reject stale predecessor Analyze, decisions and Apply server-side once persisted.
- [x] Add focused navigation, authorization, duplicate and stale-analysis regressions.
- [x] Complete Chrome proof: Avicell v2 navigation only; correction stays local and unsaved because no business Category was supplied.
- [x] Reconcile evidence/checklist and run proportionate gates; stop for Owner Review with local commits only.

## Previous checkpoint — UX-005.2 Avicell Large-List Reanalysis + Exception Walkthrough Proof

- [x] Read the authoritative v2 lifecycle, counts, baseline, Catalog, Resolution and Memory state without writes.
- [x] Prove 744 physical observations, 742 effective units, 739 resolved and exactly three genuine attention units.
- [x] Complete Chrome inspection of counts, tabs, both duplicate groups, row 618, details and the read-only source grid without Apply.
- [x] Document the unsafe bulk-accept semantics and the exception-to-source correction friction.
- [x] Run focused QA/documentation checks, commit evidence locally and stop for Owner Review.

## Previous checkpoint — UX-005.1 New Item Classification with Pending Reference Capture

- [x] Preserve Avicell v2 as historical pre-fix evidence; do not reanalyze or mutate it.
- [x] Classify clean no-target FULL rows as `NEW` when Category/Brand are canonical, pending or safely capturable.
- [x] Keep malformed references, missing required values, candidates, duplicates and COMPACT no-target rows as attention.
- [x] Preserve raw provenance and zero durable writes during Analyze; reuse the authorized atomic Apply capture path.
- [x] Prove PostgreSQL classification, Apply/idempotency and no-Analyze-write invariants with focused tests.
- [x] Complete isolated Chrome QA, documentation/evidence reconciliation and local-only checks; stop for Owner Review.

## Previous checkpoint — UX-005 First Supplier Baseline Reconciliation Audit

- [x] Preserve and snapshot Avicell Source, v1/v2, Batch, Catalog, Resolution, Memory, policy and baseline state with read-only PostgreSQL queries.
- [x] Compare 10 NEW and 20 REFERENCE_PENDING observations; quantify the 124/616 split, required data, targets, history, candidates and duplicate groups.
- [x] Reconcile classifier precedence, first-Supplier/FULL/COMPLETE semantics, the bulk-suggestion command and the physical/effective count model.
- [x] Record UX5-001..012, rank alternatives and propose only a narrow unimplemented remediation.
- [x] Run documentation checks, verify no data mutation, create a local documentation commit and stop for Owner decision.

## Previous checkpoint — UX-004.7 Capture Cleanup Ergonomics

- [x] Audit existing Title provenance, Brand/reference normalization, draft lifecycle and current row-removal invariant.
- [x] Normalize Brand consistently at paste, manual commit and missing-data completion, preferring an existing canonical reference.
- [x] Preserve raw supplier Brand representation in the persisted raw capture payload without changing catalog identity semantics.
- [x] Add one contextual active-row removal affordance that invokes the same draft-only command as `Quitar fila activa`.
- [x] Restore removed row position, values, provenance and valid focus/selection through Undo; preserve the one-row invariant.
- [x] Add focused Brand, removal, lifecycle, authorization, required-field, gridline and resize regressions.
- [x] Complete Chrome material proof, proportionate checks and evidence reconciliation; stop for Owner Review with local commits only.

## Previous checkpoint — UX-004.6 Composer Grid Action Toolbar Consolidation

- [x] Confirm current toolbar/action predicates and the separate redundant row-action container.
- [x] Consolidate Undo, Add row and Remove active row into the workflow toolbar immediately before Review.
- [x] Preserve read-only, prepare and lifecycle visibility plus current disabled/focus semantics.
- [x] Prove column resize and policy-driven Essentials regressions remain intact.
- [x] Complete Chrome desktop/1280/768/640, light/dark and keyboard proof without Save, Analyze or Apply.
- [x] Reconcile PBI/evidence/checklist and stop for Owner Review; no push, PR, merge or deploy.

## Previous checkpoint — UX-004.6 extension: Gridlines / Cuadrícula

- [x] Add an accessible Cuadrícula control to the view group, separate from workflow actions.
- [x] Keep its state presentation-only in session storage, without draft dirty state, undo or server work.
- [x] Apply theme-aware borders to real header and cell boundaries so they follow resize and dynamic columns.
- [x] Prove empty/populated editable grids, historical read-only presentation, selection dominance, view/sidebar changes, session reload, responsive layout, themes and keyboard activation in Chrome.
- [x] Run proportional regression/typecheck/build/architecture and documentation gates.
- [x] Reconcile PBI/evidence/checklist and stop for Owner Review; no push, PR, merge or deploy.

## Previous checkpoint — UX-004.5 Supplier History Selection Consistency

- [x] Confirm the root cause: the Composer rendered every supplier history despite the browse selector.
- [x] Make the browsed source the sole authority for the history list and prevent a browse change from resetting the draft source.
- [x] Cover explicit selection, zero-version state, no fallback, race-safe refresh and browse/load separation with focused regressions.
- [x] Complete safe local Chrome proof for AG, Avicell, panel restore, responsive/theme and keyboard behavior without Save, Analyze or Apply.
- [x] Confirm no server, catalog, source, version, policy, resolution or memory write occurred.
- [x] Reconcile PBI/evidence/UX-001 cross-reference/checklist and stop for Owner Review; no push, PR, merge or deploy.

## Previous checkpoint — UX-004.4 Role Matrix + End-to-End Authorization Proof

- [x] Audit the human role-editor labels/grouping, capability registry and remaining legacy `catalog.manage` uses; add the missing human label for Supplier delete only.
- [x] Add role-matrix automated tests for ordinary read, cost, item actions, bulk read/prepare/publish and configuration boundaries.
- [x] Prove multiple-role union and capability removal at the next protected operation.
- [x] Prove direct server allow/deny and route/UI parity without role-name conditions.
- [x] Prove cross-tenant isolation and trusted Branch behavior in disposable PostgreSQL fixtures.
- [x] Preserve the UX-004.3 prepare-to-publish handoff and publisher actor audit proof.
- [x] Verify ADR-013 capability-only denial without the required level-2 proof.
- [x] Run focused access, catalog, UI and UX-003/UX-004 regressions.
- [x] Complete permitted local Chrome role-editor responsive/theme/keyboard review without Owner-data mutations.
- [x] Reconcile PBI/evidence/checklist and stop for Owner Review; no push, PR, merge or deploy.

## Previous checkpoint — UX-004.3 Bulk Read / Prepare / Apply Separation

- [x] Audit every Bulk endpoint: history reads, source/draft creation, replacement, analyze, row decisions, publication and draft purge.
- [x] Open Composer history to `catalog.import.read` while retaining the temporary prepare-to-read compatibility for legacy roles.
- [x] Render the read-only evidence surface without Nueva carga, Source creation, grid edits, Save, Analyze/Reanalyze or reconciliation mutations.
- [x] Preserve full preparation for `catalog.import.prepare` without granting publication, source deletion, bulk retirement, cost access or item-effect authority.
- [x] Gate Apply independently by `catalog.import.publish` and recompose current item/price/cost effects server-side from the authoritative batch.
- [x] Add direct API/operation regressions for read-only deny, prepare-only deny, publisher effect composition and no preparation bypass.
- [x] Prove disposable PostgreSQL handoff: User A prepares READY, User B publishes, and Apply audit identifies User B.
- [x] Preserve Supplier delete level 2, bulk-retire, coverage, policy, duplicate and UX-004.2 behavior.
- [x] Complete local full-user visual/responsive smoke at desktop, 768 and 640 without applying an Owner batch.
- [x] Record PBI, authorization audit, architecture and evidence; stop for Owner Review with no remote action.

## Previous checkpoint — UX-004.2 Price List + Item Authority Integration

- [x] Preserve UX-004.1 registry/backfill and move Price List controls to the explicit successor capabilities, never role names.
- [x] Keep `price_list.read` as ordinary list/search/filter/price access and remove the broad `catalog.manage` requirement from the safe item-detail read operation.
- [x] Keep reference-cost display absent without `catalog.reference_cost.read`; do not serialize a placeholder or hidden value.
- [x] Compose New Article visibility and direct route with `price_list.read`, `catalog.items.create` and mandatory `catalog.prices.manage`; optional cost remains independently protected.
- [x] Split metadata edit, individual lifecycle, price, Branch override, reference-cost write and bulk retirement controls by their individual capabilities.
- [x] Preserve `catalog.items.bulk_retire` plus ADR-013 level-2 PIN/plan/context/audit controls for Vaciar lista.
- [x] Add focused UI/route and protected-operation regressions for ordinary read, safe detail, direct mutation denials and lifecycle/bulk separation.
- [x] Run local PostgreSQL authorization material, browser/responsive/accessibility proof and UX-003 cost-policy regression without modifying Owner Catalog data.
- [x] Reconcile PBI-041, UX-004, architecture and evidence with the exact local proof.
- [x] Historical checkpoint stopped at Owner Review; later authorized PBI-041
  slices remained in the same WIP and did not perform remote actions.

## Previous checkpoint — UX-004.1 Catalog Authorization Registry + Compatibility Foundation

- [x] Preserve the UX-004 authorization audit and materialize only `catalog.items.create`, `.update`, `.deactivate` and `catalog.import.read`.
- [x] Add a reversible capability-derived migration: legacy `catalog.manage` receives only item successors; legacy `catalog.import.prepare` receives only import read.
- [x] Keep `price_list.read`, unrelated roles and every sensitive capability unchanged by the backfill; no role-name rule exists.
- [x] Extend the bounded session registry/projection and human Role labels without exposing a client authority path.
- [x] Enforce explicit item capabilities or documented temporary `catalog.manage` fallback; preserve price/cost composition and Category/Brand authority.
- [x] Separate bulk history reads (`catalog.import.read` or temporary prepare fallback) from preparation (`catalog.import.prepare` only).
- [x] Prove server allow/deny, legacy compatibility, no sensitive expansion, local seed compatibility and migration idempotence with focused tests and disposable PostgreSQL.
- [x] Reconcile PBI-041, UX-004, architecture and evidence; stop at Owner Review with no Catalog/SupplierVersion mutation and no remote action.

## Previous checkpoint — UX-003.4 Required Effective Value Enforcement

- [x] Confirm current branch, health, policy foundation, reconciliation lifecycle and Apply architecture.
- [x] Evaluate domain-required plus Tenant-required fields from the effective resulting value, not raw cells alone.
- [x] Persist dedicated required-value attention through Analyze/Reconciliation without Catalog, Resolution or Memory writes.
- [x] Revalidate current policy inside Apply so a stale or direct request cannot bypass it.
- [x] Surface aggregate and row-level Owner guidance, preserving UX-002E.1 remediation and reference-cost confidentiality.
- [x] Prove NEW, known, UPDATE, UNCHANGED, REACTIVATE, COMPACT, excluded and duplicate cases.
- [x] Complete isolated PostgreSQL and Chrome material QA; restore the approved policy state (`v8`: Descripción Opcional, Marca Esencial, Costo Esencial).
- [x] Record evidence, run proportional checks and stop at Owner Review without remote action.

## Previous checkpoint — UX-003.3A Composer Column Resize Freeze Regression

- [x] Reproduce and isolate the white-screen path: fractional pointer width entered the integer-only grid template and threw during ref attach.
- [x] Normalize persisted and newly calculated widths to bounded integral pixels by canonical field key.
- [x] Preserve width identity when policy visibility switches between Esenciales and Todas, including fields temporarily hidden by policy.
- [x] Cover fractional hydration, malformed stale state, bounds, keyboard/pointer updates, no-op state and policy visibility regressions.
- [x] Prove an existing populated grid remains responsive through repeated resize, sidebar open/collapsed, desktop, 768 px, 640 px, light/dark and keyboard paths.
- [x] Preserve Catalog, Supplier versions, policy, Save/Analyze/Apply and all backend/DB semantics; no data action was invoked.
- [x] Pass focused tests, typecheck, build, architecture and diff checks; record evidence and stop for Owner Review with no remote action.

## Previous checkpoint — UX-003.3 Policy-Driven Essentials

- [x] Audit the hard-coded Composer field presets, authoritative effective-policy API, and current reference-cost authorization.
- [x] Load only safe effective-policy metadata for Composer users without granting configuration access.
- [x] Derive Esenciales from REQUIRED/ESSENTIAL policy levels in registry order and retain Todas as every authorized field.
- [x] Mark REQUIRED headers accessibly without introducing required-value enforcement.
- [x] Preserve FULL/COMPACT, save/review, duplicate and missing-data behavior with loading and recoverable-error states.
- [x] Add focused policy derivation, cost-redaction, lifecycle and Composer regression coverage.
- [x] Complete local Chrome proof across policy changes, 768 px/640 px, themes and keyboard behavior without CatalogItem or SupplierCatalogVersion mutation.
- [x] Record evidence, documentation and focused checks; stop at Owner Review with no remote action.

## Previous checkpoint — UX-003.2 Catalog Field Policy Configuration UI

- [x] Add Configuración → Lista de precios → Campos de carga masiva using the authoritative tenant policy API only.
- [x] Render registry-defined fixed minima and editable Marca, Descripción and Costo de referencia with one accessible level selector.
- [x] Implement explicit local draft, dirty, discard, Save with `expectedVersion`, stale-conflict reload and confirmed audited restore.
- [x] Gate navigation/route/editing by composed configuration plus reference-cost capabilities; keep backend as authority.
- [x] Add focused UI/API/authorization regression coverage and pass typecheck, build and architecture checks.
- [x] Confirm the local Administrator role now has the two new catalog-configuration capabilities through the existing Roles surface; the change invalidated the current session as designed.
- [x] Complete authenticated local Save/reload/discard/restore, responsive, theme and keyboard QA without Composer consumption. Chrome `768 px`/`640 px` pass in light/dark with readable source/version, fixed/configurable rows, native controls, dirty/discard, touch targets and no horizontal overflow, clipping or overlap.
- [x] Record PostgreSQL head/version history after the UI operations and finalize Owner Review evidence.

## Previous checkpoint — UX-003.1 Tenant Catalog Field Policy Foundation

- [x] Preserve the UX-003 field-policy decisions and implement only the finite registry, Tenant owner, product-default fallback and domain-fixed FULL minima.
- [x] Add Tenant-scoped head/version persistence with append-only actor/session/station/correlation audit, `expectedVersion` and explicit restore-to-product-defaults semantics.
- [x] Add explicit catalog configuration read/manage capabilities; reference-cost policy access composes with existing sensitive cost capabilities.
- [x] Expose trusted-context read/write/restore API without accepting Tenant or Branch authority from the client.
- [x] Run focused domain, authorization, PostgreSQL migration/material and architecture checks.
- [x] Historical Owner Review boundary preserved; Composer consumption and
  enforcement were later materialized only by authorized UX-003.3/UX-003.4.

## Previous checkpoint — UX-003 Bulk Catalog Field Policy Audit

- [x] Inspect the actual FULL/COMPACT contracts, fixed/current essential columns, input persistence and Catalog apply boundary without altering product behavior.
- [x] Inspect Nueva reparación field-policy registry, scope, permissions, versions, dirty/save/reset semantics and server-side enforcement materially.
- [x] Establish Tenant as the recommended quality-policy owner; distinguish it from Branch attribution, SupplierSource history and User preferences.
- [x] Record the field inventory and the difference between raw-row requirements and effective Catalog quality, including COMPACT and known/new cases.
- [x] Document configuration, authorization, defaults, historical items, concurrency, reanalyze, revision and snapshot alternatives as UX3-001..017 Owner decisions.
- [x] Validate documentation only: local links, consistency, secret scan and git diff --check; DB writes remain zero and no product/API/DB/migration/test behavior changed.

## Previous checkpoint — UX-002E.1 Secondary missing-data context

- [x] Replace the primary always-open block with the collapsed `Completar datos faltantes` disclosure for editable FULL loads.
- [x] Keep Tipo, Categoría and Marca available only on explicit expansion; retain a separate advanced COMPACT safety option.
- [x] Make `Aplicar a filas incompletas` disabled without values, empty-only, no-op-safe and never overwriting non-empty supplier data.
- [x] Reset helper values for a fresh load or opened Version; remove session preference carryover without adding persistence.
- [x] Preserve Save/Review/Analyze/Apply, Supplier gate, COMPACT and duplicate behavior; no API, DB or migration change.
- [x] Prove model invariants plus local Chrome fresh-collapsed and Apple-to-empty/Samsung-preserved flow; save/reload isolated QA UX-002E Local v1 without Analyze or Apply.
- [x] Run typecheck, focused contracts, build, architecture, documentation checks and stop for Owner Review with no push, PR, merge or deploy.

## Previous checkpoint — UX-002E Batch context defaults friction audit

- [x] Trace Tipo, Categoría, Marca and Aplicar sólo a vacíos from UI/session state through Draft, Listing, signature and Analyze.
- [x] Confirm defaults are session-only and current persistence collapses explicit, manually defaulted and future suggested values.
- [x] Inspect AG v52/v53 and recent applied AG distributions read-only; preserve both versions.
- [x] Classify identity risk, mixed-list behavior, supplier-memory absence and exception-first feasibility.
- [x] Record options A–G and Owner decisions UX2E-001..009 without implementing a profile, suggestion or automatic default.
- [x] Validate documentation and stop with no code, DB, fixture, push, PR, merge or deploy change.

## Previous checkpoint — UX-002D.1 Advanced capture-mode option

- [x] Remove primary capture-mode radios and keep FULL as the fresh-load default.
- [x] Add accessible advanced restricted-update option with explicit no-new-items explanation.
- [x] Persist requested draft mode atomically on replace; DRAFT can change, INGESTED remains disabled.
- [x] Prove FULL ↔ COMPACT persistence, Analyze-consistent mode and COMPACT no-NEW behavior with disposable PostgreSQL.
- [x] Preserve UX-002B/UX-002C, duplicates, completeness, defaults and Apply semantics.
- [x] Complete the no-save Chrome walkthrough and focused checks; stop for Owner Review without push, PR, merge or deploy.

## Previous checkpoint — UX-002D Capture mode friction audit

- [x] Trace FULL/COMPACT from UI through API, domain, persistence, Analyze, Apply and history.
- [x] Compare validation, NEW/no-target, matching, duplicates, coverage, defaults and lifecycle semantics.
- [x] Evaluate mixed-row lists, derivation limits and safety controls without changing behavior.
- [x] Record Owner decisions pending and a non-implemented target recommendation.
- [x] Validate documentation and stop with no product/runtime/data mutation.

## Previous checkpoint — UX-002C Primary review action + secondary draft save

- [x] Separate view controls from the capture workflow without changing Save → Analyze orchestration.
- [x] Make `Revisar lista` the sole prominent capture action and expose `Guardar para después` as quiet, discoverable and state-aware.
- [x] Preserve manual draft-only persistence, editable recovery, and no pre-Apply Catalog/Resolution/Memory/publication writes.
- [x] Cover capture, saved, analyzed and applied action states plus UX-002B and duplicate regressions.
- [x] Prove isolated Chrome happy path, draft recovery and responsive light/dark layouts without Apply.
- [x] Run authorized focal checks and reconcile PBI/audit/evidence/checklist.
- [x] Stop at Owner Review; no push, PR, merge or deploy.

## Previous checkpoint — UX-002A.4 Duplicate winner decision failure

- [x] Preserve AG v64 and inspect it read-only: both rows remain `CONFLICT` / `UNRESOLVED`, batch remains `RECONCILING`, and no Catalog, Resolution, Memory or publication mutation occurred after the failed click.
- [x] Trace the grouped card through the current row-decision API and PostgreSQL transaction: trusted target identity and the group-atomic sibling exclusion already exist.
- [x] Correct the duplicate winner payload so it carries only the Analyze-persisted title decision required by the existing authoritative target; do not expose or select UUIDs.
- [x] Add regression coverage for first/second/three-member winner selection, stale and invalid paths, reload/reanalysis, and pre-Apply safety.
- [x] Prove two fresh isolated Chrome duplicate fixtures (row 1 and row 2), reload persistence, and UX-002B gate regression without Apply.
- [x] Run the authorized focal checks and reconcile PBI-041/audit/evidence/checklist.
- [x] Stop at Owner Review; no Apply, push, PR, merge or deploy.

## Previous checkpoint — UX-002B Load intent gate

- [x] Extend the existing New Load gate so supplier and load intent begin unselected and Continue needs both choices.
- [x] Use Owner language for the two intents, retain the existing `PARTIAL` / `COMPLETE` contract internally, and preserve contextual supplier creation.
- [x] Replace the persistent completeness radios with compact supplier-and-intent context; permit a safe pre-save change that preserves rows when the supplier is unchanged.
- [x] Add focused gate/Composer contracts and preserve the existing UX-002A duplicate regression coverage.
- [x] The current PBI-041 PostgreSQL material suite passes; a prior local slow run remains historical evidence only and did not change product semantics or the threshold.
- [x] Superseded by the later UX-002B.1 authenticated Chrome walkthrough and
  the final Composer smoke; no separate browser fixture remains required.
- [x] Reconcile PBI-041, UX-002 audit and implementation evidence with the static-check evidence; browser acceptance remains pending and UX-002C does not start.

## Previous checkpoint — UX-002B.1 Two-panel New Load modal

- [x] Keep the explicit supplier-plus-intent gate, its server authority and its pre-save Change/create semantics intact.
- [x] Split the dialog into supplier and load-intent panels, retain one global Cancel/Continue footer and preserve the existing focus-trapped Dialog.
- [x] Add responsive two-column-to-one-column styles using existing design tokens; no domain, API, database or migration change.
- [x] Add focused structural regression coverage; typecheck, contract tests, production build and architecture policy pass.
- [x] Complete authenticated Chrome QA: fresh blank gate, selected intent styles, contextual create return, pre-save Change, history preservation, keyboard/focus, desktop/768/640 and light/dark.
- [x] Stop for Owner Review; do not treat the refinement as accepted before the material walkthrough.

## Previous checkpoint — UX-002A.2 Duplicate input resolution

- [x] Preserve AG v60 and implement only DUP-1 exact and DUP-3 contradictory same-snapshot behavior.
- [x] Keep physical rows/provenance and form one effective observation from the existing supplier identity key without a migration.
- [x] Consolidate exact copies deterministically by lowest row number and show a non-blocking Owner notice.
- [x] Present contradictory values as an Owner row choice; hide UUID mapping when identity is already known.
- [x] Exclude unchosen physical rows traceably before Apply so only one target mutation can survive, including after reanalysis.
- [x] Preserve true identity mapping, PARTIAL/COMPLETE, baseline, coverage key, Memory and Resolution contracts.
- [x] Add focused contract/PostgreSQL coverage and reconcile PBI/evidence/docs; UX-002B remains not started.

## Previous checkpoint — UX-002A.3 Duplicate resolution card

- [x] Render each authoritative contradictory duplicate group as one Owner decision, without changing matching or persistence.
- [x] Compare only materially different row values and keep raw per-row details behind an accessible disclosure.
- [x] Keep adjacent `Usar fila N` choices primary; remove generic row cards and row-level exclusion from this decision surface.
- [x] Represent a resolved group compactly in Resueltas/Todas and count it as one attention unit.
- [x] Preserve exact-duplicate notice and true identity-conflict UUID mapping flow; later UX-002B work does not alter it.

## Previous checkpoint — UX-002A.3A duplicate grouping runtime gap

- [x] Audit the persisted conflicting duplicate rows, repository DTO and browser result; isolate the frontend callback adaptation as the sole gap.
- [x] Pass `row.errors` and `row.warnings` explicitly to the existing grouping helper, without changing domain, API or persistence behavior.
- [x] Add DTO-shape and disposable PostgreSQL regressions for persistence → analyzed DTO → presentation grouping.
- [x] Pass focused contract tests, typecheck, production build, architecture and PBI-041 PostgreSQL material validation.
- [x] Superseded by the later UX-005.4 fresh isolated Chrome winner proofs for
  both physical-row choices; no separate runtime-gap fixture remains required.
- [x] Reconcile the PBI/evidence documentation with static evidence; browser proof remains pending and no follow-on work starts automatically.

## Previous checkpoint — UX-002A.1 Duplicate input resolution audit

- [x] Preserve AG v60 and complete a read-only preflight: branch, local health, PostgreSQL 18.4, 72 migrations and no runtime/data mutation.
- [x] Trace duplicate key calculation from paste/grid, durable SupplierListing and RowDecision through Analyze, trusted history, DTO and generic conflict UI.
- [x] Demonstrate that v60 has one trusted historical target for both rows but a material price/cost contradiction and no Apply-side writes.
- [x] Separate identity conflict from same-snapshot value contradiction; cover DUP-1 through DUP-6, physical/effective coverage and FULL/COMPACT limits.
- [x] Record UX V1 direction and decisions DUP-001 through DUP-008 in the domain audit, PBI and evidence index without implementing behavior.

## Previous checkpoint — UX-002 happy-path friction audit

- [x] Inspect the current branch, runtime provenance, local health, 71 PostgreSQL migrations and AG v49-v53 read-only material evidence.
- [x] Trace PARTIAL/COMPLETE, durable draft creation, analysis, publication, coverage, defaults and capture modes from UI through persistence.
- [x] Record the factual audit, automation boundaries and concrete Owner decisions without changing product behavior.

## Previous checkpoint — UX-002A Review List orchestration

- [x] Reconfirm the current UI/API/service/repository trace, local health, 71 migrations and Owner fixture preservation.
- [x] Replace the new/draft happy-path sequence with one Review list orchestration while retaining secondary draft recovery.
- [x] Add focused causal-order, partial-failure, double-activation and result-first regressions.
- [x] Validate local new-load/draft/reanalyze paths without Apply or existing-fixture mutation.
- [x] Reconcile PBI-041, UX-002, evidence and checklist for Owner Review.

## Previous checkpoint — Operator flow optimization UX-001

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

## Previous checkpoint — Operator flow optimization UX-001B

- [x] Record Owner acceptance of UX-001B-D01..D07 without changing SupplierSource, Version ownership or domain workflow.
- [x] Audit the existing initial state: browsing can be selected without materializing a Version; the right CTA duplicates the navigation CTA.
- [x] Keep a single primary `Nueva carga` entry in Sources navigation and render an intentional empty workspace until a Version or pending Source is selected.
- [x] Move the Sources show/hide control into the persistent Composer shell and preserve focus safely when the panel is hidden.
- [x] Preserve hidden-panel presentation state across empty, pending-load and Version workspaces without auto-reopening it.
- [x] Add focused UX-001B regressions for entry, empty state, panel restore and keyboard behavior.
- [x] Validate Chrome desktop/768/640 and light/dark without Source, Version, Catalog or persistence writes; current UX-001C local walkthrough completed with a valid existing Station session and no credentials entered.
- [x] Reconcile UX-001 documentation, PBI-041 and implementation evidence with the implementation and current QA blocker.

## Previous checkpoint — Operator flow optimization UX-001C

- [x] Record Owner acceptance of UX-001C-D01..D07 and preserve UX-001/UX-001B state logic.
- [x] Audit the rejected UX-001B affordance: its persistent square sits between Sources and workspace instead of belonging to Sources navigation.
- [x] Move the open-state collapse affordance into the Sources header with tertiary visual treatment and directional semantics.
- [x] Render the initial closed-state restore mechanism; superseded by the final compact tab below.
- [x] Preserve `sourcesOpen`, selected Version, pending supplier and workspace content through hide/restore with no reload.
- [x] Extend focused Composer/gate/focus regression coverage for open header semantics and closed rail availability.
- [x] Validate Chrome desktop/768/640 and light/dark with an existing trusted local Station session; no credentials or business writes were used.
- [x] Reconcile UX-001 documentation, PBI-041 and implementation evidence with UX-001C result.

## Previous checkpoint — UX-001C collapsed restore-control polish

- [x] Record Owner rejection limited to the collapsed full-height rail; preserve the accepted open Sources header.
- [x] Remove the grid column/rail and attach a compact restore tab to the Composer workspace edge.
- [x] Preserve focus transfer, keyboard behavior, selected Version and pending supplier with no reload or request.
- [x] Verify neutral, new-load and historical Version workspaces at desktop/768/640 in light/dark.
- [x] Reconcile PBI-041, UX-001 evidence and checklist with the final local proof.

## Previous checkpoint — UX-001C restore tab micro-polish

- [x] Align the closed tab with workspace content and keep a subtle neutral resting state.
- [x] Preserve the approved open control, keyboard focus and all Composer state.
- [x] Review neutral, pending-load and historical Version workspaces on desktop, 768 and 640 px in light/dark.
- [x] Run focused gates and reconcile the local evidence for Owner Review.

## Previous checkpoint — Existing CatalogItem reactivation pre-Apply QA

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

## Previous checkpoint — Small COMPLETE-list reinforced confirmation QA

- [x] Confirm material state read-only: AG v50 is COMPLETE/APPLIED with 39 rows; AG v51 is COMPLETE/READY with 4 rows and no publication instant.
- [x] Prove Coverage against v50: 4 received, 3 continued, 36 not observed and 1 additional; all four row decisions are resolved (3 UPDATE, 1 UNCHANGED).
- [x] Prove the additional listing is historical supplier coverage, not a new CatalogItem: its trusted consistent signature resolves to the existing active iPhone 11 Calidad RJ CatalogItem.
- [x] Confirm backend plausibility policy: baseline at least 20 rows and current list at most 25%; v51 is 4/39 (89.74% reduction), so acknowledgment is required.
- [x] Prove no-acknowledgment Apply is rejected as `CATALOG_COVERAGE_REVIEW_REQUIRED` before publication; focused PBI-041 PostgreSQL material test PASS.
- [x] Open and cancel the Owner confirmation UI without publication; it states the 39/4/36 consequence, absence safety and future baseline effect.
- [x] Prove post-cancel safety: v51 remains READY with null publication, zero Resolution/audit rows; Catalog remains 45 total / 42 ACTIVE and all 36 not-observed items remain ACTIVE.
- [x] Confirm AG v50 remains the latest COMPLETE/APPLIED baseline; no v51 Apply replay, migration, reset, product change or integration action.

## Previous checkpoint — Combined real-world supplier update, post-Apply QA

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

## Previous checkpoint — Operational UX polish for coverage + post-apply result

- [x] Classify the missing additional-item state as `STALE_PROJECTION`; preserve the null pre-Apply `NEW` target.
- [x] Project post-Apply item/status/provenance from immutable Resolution without changing matching, baseline or Apply semantics.
- [x] Prioritize additional and not-observed coverage; retain continued rows as accessible audit detail and omit zero-count CTAs.
- [x] Keep terminology distinct: Supplier Coverage uses continuations, absence and additions; Catalog reconciliation retains `Nuevo`.
- [x] Keep APPLIED result primary; move `CREATED`-only retirement into secondary batch actions without changing capability or Level 2 controls.
- [x] Make historical comparison collapsed by default with keyboard-accessible disclosure semantics.
- [x] Prove AG v45 reload: 39 rows, 38 continued, 0 not observed, 1 additional, ACTIVE created detail and Price List search.
- [x] Prove disposable PostgreSQL pre-Apply `NEW` and post-Apply `CREATED` coverage projection.
- [x] Pass focused typecheck, build, contracts, PostgreSQL, architecture, docs validation and diff checks; await Owner Review only.

## Previous checkpoint — Complete baseline plausibility + coverage explainability

- [x] Extend coverage with continued, not-observed and additional detail without changing supplier-listing identity.
- [x] Keep automatic same-Tenant/same-Source latest `COMPLETE/APPLIED` baseline selection.
- [x] Classify a materially smaller complete list as `REVIEW_REQUIRED` through a deterministic backend policy.
- [x] Require an explicit Apply acknowledgment for an anomalous complete list; preserve idempotency.
- [x] Preserve absence as observational: no retirement, deletion, rename, identifier, revision, Resolution or Memory write by absence.
- [x] Render human coverage copy and accessible expandable continued/additional details.
- [x] Prove normal, anomalous, partial, Tenant and SupplierSource scenarios with focused contracts and PostgreSQL.
- [x] Record accepted BA-001..004 and focused local proof; stop at Owner Review.

## Previous checkpoint — Completeness contract + applied result state

- [x] Require explicit `PARTIAL` or `COMPLETE` at Create and Replace boundaries.
- [x] Preserve completeness through Analyze, Apply, API reload and coverage selection.
- [x] Render READY/resolved as ready to apply and APPLIED as a historical result.
- [x] Add focused regression coverage for missing/invalid completeness and applied copy.
- [x] Materially prove AG v42 COMPLETE through Save → Analyze → Apply → reload.
- [x] Materially prove AG v43 PARTIAL remains a non-published draft.
- [x] Reconfirm AG v41 remains unchanged as pre-hardening historical evidence.

## Previous checkpoint — Exception-first reconciliation UX

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
