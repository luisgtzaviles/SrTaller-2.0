# PBI-041 — Test Strategy

## Estado

- **Resultado:** estrategia extendida con `OD-RESET-001..005`, `CM-001..009`
  y canonical title/Supplier observed title; cobertura focalizada ejecutada
  sobre el candidato local.
- **Fecha:** 2026-09-16.
- **Riesgo:** Alto; DEC-051 requires risk-proportional unit, contract,
  PostgreSQL, HTTP, browser, security and CI evidence.

## Deterministic fixture family

`supplier-informal-v1` will contain 1,500 synthetic rows, intentionally without
supplier codes for most rows. It covers PART/PRODUCT/SERVICE, exact and near
titles, duplicate rows, pending Category/Brand, explicit price/cost, blanks and
zero. New items must receive server-generated SKU/barcode.

`supplier-informal-v2` retains a controlled subset exactly and changes other
titles, costs and prices; adds/removes rows; adds optional supplier codes; and
contains corrected/inconsistent mapping history. It yields known, changed, new,
ambiguous and disappeared groups without requiring advanced pattern logic.

Fixtures contain no Owner/supplier real data. A future anonymized shape may be
used locally but is not committed unless separately approved.

La extensión de retiro usa dos fixtures separados: Historical Tenant conserva
historia y mappings aunque llegue a cero activos; Virgin Tenant comienza sin
Supplier history y prueba las 36 pantallas AG como `NEW`. Ambos son sintéticos,
aislados y reversibles en PostgreSQL desechable.

## Test matrix

| ID | Scenario / expected invariant | Unit | Contract | PG | HTTP | Browser | CI |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| BI-Q01 | V1 1,500 rows without codes ingests; supplier code stays null | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q02 | new Catalog creates use server SKU/barcode and remain searchable | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q03 | V2 exact historical mappings preselect only when unique/consistent | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q04 | corrected mapping appends resolution and changes memory projection | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| BI-Q05 | corrected durable mapping remains a hard `CONFLICT`; multiple independent durable histories remain `AMBIGUOUS` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q06 | optional/duplicate supplier code does not fabricate or last-row-win | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q07 | pending Category/Brand consolidates through PBI-040 governance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q08 | Owner confirms batch; no per-row click for exact preselection |  | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q09 | supplier title change never renames Catalog automatically | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q10 | cost/price real change appends one revision each | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q11 | same amount is NO_CHANGE; zero is explicit; blank is no change | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q12 | Branch override remains unchanged/effective after base update | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q13 | disappeared Listing makes no lifecycle/price/cost write | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q14 | duplicate in Version marks all involved rows conflict | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q15 | conflicting identifiers/mappings block whole batch | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q16 | two Owners: optimistic stale preserves first/current decisions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q17 | stale CatalogItem before publish rolls back all included rows | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| BI-Q18 | capability revoked before publish causes deny + zero writes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q19 | same publish retry returns same outcome; incompatible replay conflicts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q20 | raw expires at 90d; structured/history/revisions survive cleanup | ✓ | ✓ | ✓ |  |  | ✓ |
| BI-Q21 | cost absent from denied responses/DOM/report/version history | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q22 | two Tenants isolated across every query/FK/count/report/publish | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q23 | 10k meets all budgets before advertised support | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q24 | 50k characterized; product rejects >10k with zero partial staging | ✓ | ✓ | ✓ | ✓ | ✓ | scheduled/manual evidence |
| BI-Q25 | paste cell/column/rectangle, edit, add/remove, undo and reload draft | ✓ | ✓ |  | ✓ | ✓ | ✓ |
| BI-Q26 | Tab/Shift+Tab/arrows/Enter/selection/focus/announcements |  |  |  |  | ✓ | ✓ |
| BI-Q27 | 1280/768/640 and light/dark preserve usable virtualized grid |  |  |  |  | ✓ | Owner/CI evidence |
| BI-Q28 | malicious/oversized clipboard and each rows/columns/cells/cell/bytes cap render/reject safely | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q29 | atomic injected failure/deadlock/timeout has known/idempotent outcome | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| BI-Q30 | Source/Version/Listing immutable and no destructive cascade | ✓ | ✓ | ✓ |  |  | ✓ |
| BI-Q31 | plan global authoritative cuenta sólo items activos y expira en 5 min | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q32 | retiro global deja 0 activos y preserva ID/SKU/barcode/revisiones/history/memory | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q33 | mapping histórico único + INACTIVE queda REACTIVATE, nunca NEW; preserva itemId/SKU/barcode | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q34 | same-actor PIN Level 2 es one-shot; PIN de otro usuario falla | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q35 | plan alien/stale/context-changed/capability-revoked falla sin retiro parcial | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q36 | lote mixto retira sólo Resolution CREATED; MATCHED/UPDATED siguen activos | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q37 | Virgin Tenant aislado clasifica las 36 pantallas AG como NEW | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q38 | UI dice `Original:` y nunca llama reversión al retiro acotado | ✓ | ✓ |  | ✓ | ✓ | ✓ |
| BI-Q39 | REACTIVATE con cambios agrega precio/costo en el mismo publish atómico | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q40 | target histórico ACTIVE produce UPDATE o UNCHANGED según diff | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q41 | dos candidatos, mapping incompatible o Tenant ajeno quedan bloqueados | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q42 | stale/concurrent/retry de reactivación deja cero parciales y cero duplicados | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q43 | versión INGESTED no aplicada se reanaliza sin mutar Supplier evidence | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q44 | caso material AG: 36 INACTIVE → 36 REACTIVATE → 36 ACTIVE con IDs exactos | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q45 | exact history sólo auto-resuelve con Batch APPLIED, key exacta, target único, cero correcciones y compatibilidad | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q46 | miss exacto produce candidate read-only; score nunca decide ni llena target | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q47 | Pro/Plus/Max, OLED/INCELL, Original/Calidad, color, capacidad, tamaño y números incompatibles permanecen contrastes explicables; no auto-resuelven ni elevan texto solo a `CONFLICT` | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| BI-Q48 | selección sólo acepta candidato persistido; UUID arbitrario/cross-Tenant falla sin efectos | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| BI-Q49 | decisión candidate no aprende antes de publish; publish exitoso crea Resolution/Memory exacta y la siguiente versión se vuelve trusted | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q50 | 1,500 historias se cargan/indexan una vez; pool 200, top K 3 y tiempos bounded sin N+1 | ✓ | ✓ | ✓ |  |  | ✓ |
| BI-Q51 | UX abre en Requieren atención, separa resueltas e identifica evidencia/diferencias sin ocultar trusted rows | ✓ | ✓ |  | ✓ | ✓ | ✓ |
| BI-Q52 | AG v11 reanalysis produce 34 trusted APPLY + 2 CANDIDATE UNRESOLVED y cero publish/memory/item writes | ✓ | ✓ | ✓ | ✓ | ✓ | Owner evidence |
| BI-Q53 | same item + KEEP conserva itemId/title y publica observed title searchable | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q54 | same item + ADOPT conserva itemId, cambia title atómicamente y audita old/new + provenance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q55 | antes de Apply, decidir KEEP/ADOPT no cambia CatalogItem ni crea Resolution/Memory | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q56 | exclude/failure/replay no aprende, no renombra y no duplica audit events | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| BI-Q57 | search canonical/historical deduplica item, conserva filtros/count/page y aísla Tenant | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BI-Q58 | dos versiones con ADOPT sobre el mismo item hacen fail-closed por expected version | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| BI-Q59 | REACTIVATE + ADOPT conserva identidad y aplica lifecycle/rename en una transacción | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| BI-Q60 | dos SupplierSources pueden aportar títulos buscables al mismo item sin alias global | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Layer responsibilities

### Unit

- normalization preserves clean casing and exact raw title;
- signature/fingerprint algorithm versioning and deterministic hashes;
- matching precedence, contradictions and exact-history eligibility;
- token index, bounded candidate ranking and protected identity terms; scores
  are presentation only and never authority;
- field intent matrix, blank/zero/money parsing and diff/no-op;
- lifecycle transition policies, pending vs unresolved and report counts;
- retention clock/chunk selection and cost redaction policies.
- plan TTL/confirmation, same-actor proof y conjuntos/hash deterministas.

### Contract

- framework-free Catalog ports and exhaustive result variants;
- DTOs omit cost, never return hidden null/metadata, and preserve error taxonomy;
- idempotency same/incompatible payload; stale/conflict/non-revealing results;
- Version/Batch relationship is not 1:1; Procurement/Inventory/Repairs only see
  Catalog item contracts, never SupplierListing identity.
- retiro global y por batch tienen commands/resultados explícitos y nunca
  exponen hard delete o una falsa reversión.

### PostgreSQL 18.4

- fresh/upgrade migration design, compound FKs/uniques/checks/index plans;
- immutable snapshot mutation guard and append-only resolution history;
- trusted provenance join to the applied batch, candidate persistence cap,
  candidate-target tamper rejection and publish-only learning;
- transaction same connection, injected rollback, serialization/deadlock;
- two Owners, row lock order, idempotency outcomes and no partial writes;
- two Tenants + two Branches, exact queries/counts/pagination and no cascades;
- cleanup with controlled clock/failure/retry and permanent evidence survival.
- planes/eventos Level 2, locking estable, stale hash, zero partial retirement,
  Historical/Virgin isolation y CREATED-only batch scope.

### HTTP/security

- trusted context, capabilities by field, CSRF/origin and rate/size limits;
- alien IDs, forged state/method/expectedVersion and anti-enumeration;
- cost visibility across Composer, preview, history and report;
- publish retry/outcome unknown and capability/session revocation at commit.
- PIN ajeno, replay de proof, plan stale/alien/expired, confirmación incorrecta
  y capability masiva ausente.

### Browser/Owner surface

- Chrome real, not a DOM-only unit substitute;
- paste/edit/navigation/selection/focus/undo/durable reload;
- virtual scrolling and stable row identity at 1,500 and 10,000;
- error/empty/loading/reconnecting/stale/denied/success states;
- screen widths 1280/768/640, light/dark, keyboard-only and announcements;
- Version 1 → publish → Version 2 comparison Owner checkpoint.
- diálogos de retiro global/CREATED por batch, reautenticación y estados
  Historical/Virgin sin lenguaje de hard delete o rollback.

### CI and evidence

- governed Node 24.18.0/pnpm 11.15.1 via repository scripts;
- `verify`, architecture, PostgreSQL, focused High-risk/security, smoke and
  browser suites on exact candidate SHA;
- critical mutation fixtures: remove Tenant predicate, cost redaction,
  expectedVersion, transaction wrapper, history-consistency guard and cleanup
  allowlist; tests must fail;
- exact-main CI after authorized merge remains separate from candidate PASS;
- no flaky critical test, retry-to-green, supplier data, secrets or invented
  performance evidence.

## Performance protocol

Use deterministic 1k, 1.5k and 10k data shapes. Warm-up is reported separately;
p95 uses at least 20 measured iterations for read/analyze and 10 isolated runs
for destructive/publish fixtures. Record CPU/RAM/browser/PG version, dataset
hash, indexes/EXPLAIN, candidate SHA and raw timings.

Budgets are those in Price List Architecture: paste ≤1/3 s, analysis ≤5/30 s,
first preview ≤1.5/2 s, publish HTTP ≤8/30 s, DB transaction ≤5/15 s,
additional heap ≤100/250 MiB and cleanup ≤10/60 s for 1k/10k. Main-thread task
maximum is 200 ms. Any 10k miss means support is not announced and the PBI does
not pass its promised target without Owner-reviewed scope/budget change.

50k runs outside the product cap in a controlled characterization harness and
records resources/bottleneck; the production-like HTTP path must reject it
before row persistence. It is not a capacity claim.

## Owner checkpoint evidence

Capture route, exact SHA, runtime provenance, fixture hashes and visible counts
for both versions. Owner verifies mappings, explicit changes, pending/unresolved,
atomic apply, stable item IDs, generated identifiers, correct price/cost history,
override preservation, report, reload and responsive/keyboard behavior. Backend
PASS alone cannot close Owner Review.

## Exit criteria

- BI-Q01..Q60 applicable gates green without downgraded assertions;
- required 1,500-row Owner flow and 10k candidate budgets evidenced;
- 50k characterization/rejection evidenced;
- zero Blocker/Critical/High open after focused review;
- exact candidate Git/worktree/runtime evidence and no sensitive fixture data;
- implementation remains unaccepted until Owner explicitly approves it.

## SV completeness focused matrix

| ID | Predicate material | Cobertura |
|---|---|---|
| SV-Q01 | nueva Version omite el campo y persiste `PARTIAL` | PostgreSQL |
| SV-Q02 | `COMPLETE` frente a `COMPLETE` del mismo Source reporta sólo no observados | PostgreSQL |
| SV-Q03 | `PARTIAL` no calcula ausencia ni expone conteo | PostgreSQL / UI contract |
| SV-Q04 | una omisión COMPLETE aplicada conserva status, itemId, identifiers, revisiones y memory | PostgreSQL |
| SV-Q05 | completeness no cambia después de `INGESTED` | PostgreSQL |
| SV-Q06 | UI conserva selección y copy Owner; no presenta “Desaparecidas” | UI contract / Chrome |

La matriz ejecutada usa una lista COMPLETE de cuatro filas y otra COMPLETE de
tres: reporta un no observado, publica sólo las tres presentes y verifica cero
Resolution para el item omitido. No sustituye Owner Review.
