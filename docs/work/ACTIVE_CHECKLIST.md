# Active Development Checklist

Milestone / Functional Goal: Resume PBI-040 safely from current main
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-040 — Owner Review
Status: Reconciled with current main; Owner Review ready to resume
WIP: 1/1
Progress: 5 / 5 reconciliation blocks complete
Current: Owner Review of PBI-040 remains pending
Next: Owner continues review from `/listas/precios`
Blocked: None
Last updated: 2026-09-12 MST

## Reconciliation to Owner Review

- [x] Verify clean `main`, PBI-043 closure, branch cleanup, frozen PBI-040 HEAD
  and exact genealogy
- [x] Merge current `main` into PBI-040 without rewriting or discarding WIP
- [x] Prove PBI-039, PBI-040 and PBI-043 contracts with material PostgreSQL
- [x] Prove exact local runtime and concurrent Owner/QA Sessions
- [x] Leave Chrome on `/listas/precios`, reconcile evidence and finish clean

## Evidence summary

- Merge local `28320b39fcb42287444c7131a8405c9340677025` conserva como
  padres el WIP PBI-040 `68843baea68a` y `main` `5be5cd60acb0`.
- `verify:full`: 13/13 etapas PASS, 836 pruebas base sin fallas, 17/17
  PostgreSQL compuestas, PBI-039 2/2 y PBI-040 material PASS con 57
  migraciones. Permanece el warning aceptado de chunk Vite mayor a 500 kB.
- Runtime local: frontend/backend/worktree declararon el mismo SHA limpio del
  merge reconciliado; `verify:runtime-provenance` PASS.
- Repair Detail parity: mismo payload canónico, cuatro eventos, dos evidencias,
  jerarquía y ancho funcional equivalentes; PASS.
- Chrome PBI-043: Owner/QA concurrentes en una Station; reload, logout y switch
  session-local PASS. Chrome personal Owner quedó autenticado en Lista de
  precios con cuatro fixtures sintéticos y filtros en defaults.

## Boundaries

- [x] Reconciliation only; no new Price List feature
- [x] No PBI-041/PBI-042 implementation
- [x] No push, PR, merge to `main`, Preview deploy or Production
- [x] PBI-039/PBI-043 remain authoritative and are not reopened
- [x] Owner Acceptance de PBI-040 continúa pendiente

The completed PBI-043 checklist remains preserved by Git history and its
closure evidence. The prior PBI-039 checklist remains in
[`history/PBI-039_ACTIVE_CHECKLIST.md`](history/PBI-039_ACTIVE_CHECKLIST.md).
