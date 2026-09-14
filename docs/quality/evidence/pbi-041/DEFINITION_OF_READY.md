# PBI-041 — Definition of Ready

## Resultado

**PASS — READY FOR OWNER IMPLEMENTATION AUTHORIZATION — 2026-09-13**

Ready confirma que el outcome inicial es implementable y verificable. No
selecciona PBI-041, no ocupa WIP, no autoriza implementación/branch/código/
migraciones/UI/jobs, no acepta PBI-040 y no autoriza push, PR, merge o deploy.

## Baseline y dependencia

| Campo | Resultado |
|---|---|
| Branch observada | `feature/pbi-040-catalog-pricing-core` |
| HEAD al preflight | `aecd6c43b36c4243e3b5c22807fffacb015d6f11` |
| PBI actual/WIP | PBI-040 Owner Review; WIP `1/1` |
| PBI-041 | Candidate/Ready; no seleccionado ni iniciado |
| Dependencia Catalog | contratos equivalentes materializados en la rama actual; selección espera Owner Acceptance/closure de PBI-040 |
| Cambios de este goal | documentación solamente; cero código/migración/DB/runtime |

La evidencia Git/CI deberá revalidarse desde el nuevo `main` al recibir una
futura autorización de implementación; esta DoR no congela una branch de
desarrollo ni permite reutilizar la rama PBI-040.

## Owner decisions

- [x] `OD-BI-001..010` cerradas y promovidas fuera del discovery.
- [x] Composer first; CSV/XLSX/API quedan adapters futuros del mismo engine.
- [x] Supplier code es opcional; no se fabrica.
- [x] Retención raw 90 días y subset estructurado permanente definidos.
- [x] Exact history puede preseleccionarse, siempre visible y confirmada por
  batch; similarity/pattern/tag requiere decisión humana.
- [x] PBI-041 separado de Advanced Supplier Reconciliation, outcome diferido
  sin ID/readiness/selección.

## Outcome, alcance y ownership

- [x] Problema, usuario, valor y recorrido Owner están definidos.
- [x] Slice vertical cubre Composer durable → Version/Listing → reconciliation
  → preview → atomic Catalog apply → report/cleanup.
- [x] `catalog` posee SupplierSource mínimo, SupplierCatalogVersion,
  SupplierListing/Resolution/Memory y CatalogUpdateBatch/RowDecision.
- [x] SupplierSource no es Supplier de Procurement; no contiene contacto,
  compra, recepción, pago, cuentas por pagar ni inventario.
- [x] CatalogItem es identidad permanente; SupplierListing es observación
  externa. Repairs/Inventory/Caja/Procurement usan itemId + snapshots/contratos.
- [x] Inventory, Procurement, Repair Concepts, Caja, Pedidos, Solicitudes,
  Files/R2 y Branch override mutation quedan fuera.

## Schema, lifecycle y retention

- [x] Tablas conceptuales, campos, compound FKs/uniques/checks e indexes
  definidos en [Persistence Design](PERSISTENCE_DESIGN.md).
- [x] Tenant scope existe en toda fila owner y toda relación estructural.
- [x] Version/Listing inmutables después de INGESTED; corrección crea versión y
  lineage, no overwrite.
- [x] Resolution es append-only; Memory es proyección reconstruible, no alias.
- [x] Version lifecycle y Update Batch lifecycle son independientes.
- [x] Idempotency keys, expectedVersion snapshot, reserved IDs, audit y
  correlation están definidos.
- [x] Raw expiration/cleanup es bounded/idempotente/testable y no cascada.
- [x] Migration rollout es aditivo; app rollback preserva datos; down destructivo
  sólo antes de datos y con autoridad explícita.

## Matching and reconciliation

- [x] Strong signals: trusted itemId, SKU, barcode, optional supplier code and
  exact historical observation/mapping.
- [x] Historical preselection requires same Tenant/Source, exact compatible
  signature, unique consistent active target and no contradiction.
- [x] Probable title/structure, ambiguity and new state require human decision.
- [x] No fuzzy/title-only write, last-row-wins, silent mapping or canonical alias.
- [x] Pending Category/Brand deliberate may publish; unresolved/conflict/
  invalid/stale blocks.
- [x] Version comparison basic defines mapped/disappeared/new/changed/ambiguous;
  disappearance never changes Catalog lifecycle.

## Update semantics and atomicity

- [x] Existing Type and SKU/barcode remain immutable/match-only.
- [x] Supplier title does not rename Catalog; description/classification opt-in.
- [x] Base price and imported Reference Cost append revision only on real change.
- [x] Blank update is no-change; zero is explicit; no bulk cost revoke.
- [x] SupplierObservedCost, ReferenceCostRevision and future Procurement cost
  remain separate.
- [x] Branch overrides are read for warning/effective-price proof but untouched.
- [x] Nothing before COMMITTING mutates product; included rows publish in one
  connection/transaction and any stale/invalid row rolls back everything.

## Security and authorization

- [x] Dedicated [Threat Model](THREAT_MODEL.md) covers clipboard active content,
  injection, size/grid exhaustion, Tenant/cost leakage, stale capability, CSRF,
  replay, mapping poisoning, malicious text, concurrency, stale version, logs,
  retention and permanent observed cost.
- [x] `catalog.import.prepare` and `catalog.import.publish` remain separate;
  publish intersects item/price/cost capabilities rather than bypassing them.
- [x] Session/context/capability revalidation occurs at commit.
- [x] Cost is omitted server-side across Composer, preview, history and report.
- [x] CSV/XLSX-only threats are explicitly deferred with their adapters.
- [x] Publish classification stays ADR-013 level 1 under current controls;
  expansion triggers reclassification.

## UI and accessibility contract

- [x] Paste cell/column/rectangle, direct edit, selection, add/remove draft row,
  undo and durable reload specified.
- [x] Tab/Shift+Tab/arrows/Enter, focus visible and accessible announcements
  specified.
- [x] Virtualization, cell errors, row status, loading/empty/stale/denied/success
  and no formulas/macros/worksheets specified.
- [x] Hard caps for rows, columns, non-empty cells, cell length and clipboard
  bytes are explicit; fill/down is deferred, not an unresolved behavior.
- [x] Chrome proof required at 1280/768/640 and light/dark.

## Performance and operation

- [x] Material 1,000 and Owner fixture 1,500 defined.
- [x] p95 budgets fixed for paste, analysis, preview, publish HTTP, DB
  transaction, browser heap/responsiveness and cleanup.
- [x] 10,000 is candidate capacity and may only be advertised after all budgets
  pass; >10,000 is rejected whole in initial product.
- [x] 50,000 has a characterization protocol and is not a capacity promise.
- [x] Cleanup overdue signal, bounded chunks and no-loss proof defined.
- [x] No real supplier data is required; deterministic synthetic fixtures are
  sufficient and reproducible.

## Test strategy and Owner checkpoint

- [x] [Test Strategy](TEST_STRATEGY.md) classifies 30 material scenarios across
  unit, contract, PostgreSQL, HTTP, browser and CI.
- [x] Two Tenants/two Branches, concurrent Owners, stale item, capability
  revocation, retry, retention, cost and atomic rollback are explicit.
- [x] Critical mutation guards prove Tenant predicate, cost redaction,
  expectedVersion, transaction, consistency and cleanup controls are effective.
- [x] Owner checkpoint requires Version 1 (~1,500 no-code rows), publish and
  Version 2 with known/changed/new/ambiguous/disappeared.
- [x] Stable Catalog identity, no duplicates, revisions, override preservation,
  report, reload and Chrome behavior are observable.
- [x] Backend/CI PASS alone does not grant Owner Acceptance.

## Delivery gates

1. Owner Acceptance/closure of PBI-040 and explicit selection/implementation
   authorization are required before PBI-041 starts.
2. Start from then-current clean `main` on a new temporary branch; revalidate
   PBI, Sprint, SHA, origin/main, CI and toolchain.
3. Maintain WIP=1 and replace/reconcile ACTIVE_CHECKLIST only when selected.
4. Implement checkpoints without advancing the deferred outcome.
5. Run governed verify, architecture, PostgreSQL, negative security, focused
   High-risk review, benchmark and formal Chrome/Owner evidence.
6. Commit/PR/merge/exact-main CI/Owner Acceptance/Done/deploy remain distinct
   and require their existing authorities.

## Questions and readiness decision

- **Material/blocking questions:** none.
- **Implementation details allowed to refine:** physical names/index tuning and
  UI primitive choice, only while preserving contracts/budgets and without
  expanding scope.
- **No new ADR required:** the design applies ADR-004/012/013 and
  DEC-005/049/051; it does not change their cross-cutting decisions.

PBI-041 is therefore Ready for an Owner implementation authorization, but it
is not authorized, selected, started, accepted, Done or Released.
