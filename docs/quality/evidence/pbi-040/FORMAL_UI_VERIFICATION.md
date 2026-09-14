# PBI-040 — Formal UI Verification

## Candidate and environment

- **Date:** 2026-09-13 (America/Hermosillo).
- **Candidate:** `eed92f373d2e6c525c33d1f616f87f5ad8b7a2c0` on
  `feature/pbi-040-catalog-pricing-core`.
- **Runtime:** governed local PostgreSQL plus the repository local launcher at
  `http://127.0.0.1:4173`.
- **Provenance:** frontend, backend and worktree reported the same clean
  candidate SHA before the campaign.
- **Identity:** authenticated Owner session on the recognized local Station.
- **Data:** synthetic governed local fixtures only. The campaign created one
  additional reversible CatalogItem, described below.

## Price List scenarios

The following scenarios passed in real Chrome:

- default `Todos los tipos / Todas las categorías / Todas las marcas` state;
- name search combined with Type, Category and Brand;
- exact SKU and barcode search;
- legitimate zero-results state;
- Type change preserves compatible filters and deterministically resets an
  incompatible Category;
- Category change preserves only a compatible Brand;
- Service exposes only applicable Category/Brand choices;
- `Insumo` is absent from the commercial Type filter;
- reference cost is hidden by default, can be requested by the authorized
  Owner, and disappears when the preference is turned off;
- branch override changes the effective price and revocation restores the
  Tenant base price;
- server loading, recoverable error and empty states remain usable;
- a fresh page load produced ten results with no console warning or error.

## Individual create, edit and governance

- The create dialog shows only SKU and Código de barras and identifies both as
  automatic when blank; it does not display a fictitious assigned value.
- A synthetic item created with both identifiers blank received server-side
  values `REF-000101` and `SR00000101`. Reload and exact SKU search recovered
  the same item.
- Editing the item preserved both identifiers and accepted explicitly captured
  pending Category and Brand references.
- Reusing `REF-000101` was rejected without overwriting or merging data.
- Both pending references were resolved through the governed action and then
  merged into compatible canonical survivors. The item was reassigned to
  `Pantallas · Apple`, with the survivor applicability union preserved.
- A cross-Type incompatible merge target was disabled in the UI.
- An unused temporary canonical Brand exposed permanent safe delete with an
  explicit confirmation and was removed. A used Brand exposed deactivate;
  deactivation and reactivation both preserved its usage and restored the
  initial active state.

The remaining local synthetic item is:

- `Batería formal QA 20260913 editada`;
- Refacción, Pantallas, Apple;
- Tenant base price `777`, reference cost `333`;
- SKU `REF-000101`, barcode `SR00000101`;
- no active Branch override.

It is isolated to the disposable local database and is reversible through the
governed local reset mechanism. The temporary Brand was deleted and Samsung was
reactivated, so those exercises left no active-state drift.

## Shared Catalog UI and Repairs integrity

- Configuración > Catálogos > Reparaciones rendered governed data for Riesgos
  (4), Tipos (3), Marcas (12), Modelos (15) and Categorías (5).
- Configuración > Catálogos > Lista de precios used the same section tabs,
  counters, lifecycle actions, selected/focus states, table density and empty
  state language.
- Nueva reparación retained the Type, Brand, Model, problem Category and Risk
  controls. Inspection confirmed the full six-step form still contains those
  catalog-backed fields without creating a Repair.
- The controlled `SR-2026-039` Repair Detail rendered all accepted PBI-039
  regions: the nine-field header, complete Recepción, four-event Historial,
  final Conceptos placeholder and two Evidencias.

## Responsive and accessibility coverage

- `1280`, `768` and `640` CSS-pixel widths rendered without horizontal page
  overflow.
- Light and dark themes both remained readable.
- Keyboard traversal reached the cascading filters with visible focus.
- The narrow create dialog remained within the viewport; initial focus landed
  on Close, `Shift+Tab` wrapped to the final action, and `Escape` closed the
  dialog while restoring focus to `Nuevo artículo`.
- The temporary viewport override was reset after the campaign.

## Boundary of this evidence

This document records real-browser behavior. Server-side authorization,
Tenant/Branch isolation, append-only history, concurrency and database
constraints remain material verification gates and are not inferred from this
UI run. Preview validation is also a later post-merge gate; no Preview or
Production state was changed during this campaign.

## Post-merge Preview verification

After PR #49/#50/#51 and exact-main CI `34809054770`, Preview was deployed and
reported exact clean revision `09e14c89892f5770977c5028a899714b7a30d6d5`.
An authenticated Owner browser revalidated name/SKU/barcode search, cascading
Type/Category/Brand filters, legitimate zero results, cost hidden/shown,
individual create/edit/reload, base/Branch pricing, pending reconciliation,
canonical merge, safe delete eligibility, deactivate/reactivate and Repair
Detail preservation. No Production environment was changed.

Preview retained one governed synthetic article plus its canonical Category and
Brand as documented in `IMPLEMENTATION_EVIDENCE.md`. The alternate zero-use
Category was merged into the survivor and no longer appears as an ordinary
canonical row. PBI-041 import capabilities remained disabled.
