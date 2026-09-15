# Active Development Checklist

Milestone / Functional Goal: PBI-041 — Supplier history, automatic versioning and governed delete
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-041
Status: Ready for Owner Review — Acceptance pending
WIP: 1/1
Progress: 7 / 7 blocks completed
Current: Owner may review Supplier history, automatic versions and governed deletion locally
Next: Owner decision only; `verify:full` and integration remain unauthorized
Blocked: None; Owner Acceptance remains pending
Last updated: 2026-09-15 MST

## Current checkpoint — Supplier history and governed delete

- [x] Audit Source, Version, Listing, mapping, memory, Batch, revision and delete relations.
- [x] Promote automatic monotonic `vN`, Source deletion rules and explicit capability to canonical documentation.
- [x] Implement server-side version allocation, idempotency and migration-safe historical backfill.
- [x] Implement Supplier → Versions hierarchy, collapsible workspace and double-confirmed deletion UX.
- [x] Pass 80 focused contracts and PostgreSQL material with 69 migrations, including concurrency, isolation and safe-delete cases.
- [x] Validate 1280/768/640, light/dark, keyboard, sidebar states and destructive confirmations in Chrome.
- [x] Reconcile evidence, logical commits, exact-HEAD provenance and Owner handoff.

## Owner Review fixture and evidence

- `AG`: 8 Versions with published history; hard delete is blocked.
- `Proveedor Demo`: 3 Versions with published history; hard delete is blocked.
- `Proveedor QA eliminable 15 sep`: 2 same-day `DRAFT` Versions (`v1`, `v2`) with distinct descriptions; eligible for the governed delete flow.
- Creating the QA Source first showed `0 versiones`; selecting it did not create a Version.
- First confirmation explains the permanent effect and ignores Enter. The second requires same-actor PIN and arms the destructive button only after the delay.
- The browser deletion was intentionally cancelled so the Owner can inspect the fixture; PostgreSQL material proves the successful effect, duplicate-submit safety, no-capability rejection and dependent-history block.
- Local database migrated in place from 67 to 69 migrations; no reset or volume replacement occurred.
- Focused contracts: 80 PASS. Final UI/bulk regression subset: 18 PASS. PostgreSQL: 1 PASS. Typecheck/build: PASS.
- Chrome: 1280 light, 768 dark and 640 light; no document/action overflow, panel expands/collapses by keyboard and console has zero errors/warnings.

## Guardrails

- No PBI-042 or Advanced Supplier Reconciliation.
- No Inventory, Procurement, Caja, Repair Concepts, CSV/XLSX adapter or supplier API.
- No authoritative `verify:full` before Owner Acceptance.
- No hard delete of CatalogItem, published Supplier history, mappings, memory or revisions.
- Classifier and verified-tree remain shadow-only; no gates are omitted.
- No DB reset, push, PR, merge, Preview, Production or deploy.
