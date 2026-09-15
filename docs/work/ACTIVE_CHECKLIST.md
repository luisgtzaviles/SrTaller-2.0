# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Supplier history, automatic versioning and governed delete
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Owner Review preparation — runtime and browser validation in progress
WIP: 1/1
Progress: 5 / 7 blocks completed
Current: Run the exact candidate locally and verify the governed Supplier/Version experience in Chrome
Next: Reconcile browser evidence, commit the review state and leave Chrome open
Blocked: None; Owner Acceptance and integration remain unauthorized
Last updated: 2026-09-15 MST

## Current checkpoint — Supplier history and governed delete

- [x] Audit Source, Version, Listing, mapping, memory, Batch, revision and delete relations.
- [x] Promote automatic monotonic `vN`, Source deletion rules and explicit capability to canonical documentation.
- [x] Implement server-side version allocation, idempotency and migration-safe historical backfill.
- [x] Implement Supplier → Versions hierarchy, collapsible workspace and double-confirmed deletion UX.
- [x] Pass 80 focused contracts and PostgreSQL material with 69 migrations, including concurrency, isolation and safe-delete cases.
- [~] Validate 1280/768/640, light/dark, keyboard, sidebar states and destructive confirmations in Chrome.
- [ ] Reconcile final evidence, commits, exact-HEAD provenance and Owner handoff.

## Material findings and evidence

- The governed local database was migrated in place from 67 to 69 migrations; no reset or volume replacement occurred.
- The first historical upgrade exposed an immutable-version trigger blocking sequence backfill. The migration now permits only a one-time `sequence_number` fill when every other row value is unchanged, then restores the final immutable guard.
- Focused contracts: 80 PASS, 0 FAIL, 0 SKIP.
- PostgreSQL material: 1 PASS with 69 migrations; concurrent saves received distinct monotonic versions and the disposable test container was removed.
- Existing AG and Demo Sources contain published history and remain ineligible for hard delete.
- The Administrator local fixture received only `catalog.suppliers.delete`; the general seed was not run because doing so required changing existing local PIN fixtures.

## Guardrails

- No PBI-042 or Advanced Supplier Reconciliation.
- No Inventory, Procurement, Caja, Repair Concepts, CSV/XLSX adapter or supplier API.
- No authoritative `verify:full` before Owner Acceptance.
- No hard delete of CatalogItem, published Supplier history, mappings, memory or revisions.
- Classifier and verified-tree remain shadow-only; no gates are omitted.
- No DB reset, push, PR, merge, Preview, Production or deploy.
