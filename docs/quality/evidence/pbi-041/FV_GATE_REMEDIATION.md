# PBI-041 — Verification Gate Remediation

- **Fecha:** 2026-09-19.
- **Base:** `ec1c29fc4fe92795e86429f73b37cb15b51e0be7`.
- **Alcance:** registro acumulado de las cinco remediaciones gobernadas de los
  gates detectados por el Final Closure Audit y sus rechecks sucesivos.
- **Resultado actual:** **PASS — `B-041-FV-001..007` resueltos, `verify` y la
  única corrida autorizada de `verify:full` verdes; listo para Formal
  Verification independiente.** Los resultados bloqueados históricos se
  conservan en sus secciones originales.

## Reproducción previa

Antes de editar se reprodujeron los fallos originales bajo Node.js `24.18.0` y
pnpm `11.15.1`:

1. `verify:integration-baseline` rechazó
   `apps/dev-preview-web/src/api.ts` desde
   `scripts/lib/integration-baseline.mjs:72`.
2. `verify:full` falló en Stage 0, con Cleanup y Final Fingerprint PASS.
3. `verify` rechazó el inventario de migraciones porque los contratos de test
   no estaban alineados con las 75 migraciones gobernadas del repositorio.

La diferencia entre el blob PBI-039 aceptado
`3a7c93f4f1597dbef9bbbfcc916dcd3cb7afe226` y el blob PBI-041
`f1e9a33f9a7dc534e223eee37bb1b234feafb35b` es exactamente:

```ts
readonly parameter: string | null = null,
```

No se reescribe el resultado anterior: el Final Closure Audit detectó
correctamente ambos blockers.

## Remediación de superficie protegida

`PBI039_PROTECTED_SURFACES` permanece intacto. Una manifestación separada,
`PBI041_AUTHORIZED_PROTECTED_SURFACE_CHANGES`, superpone únicamente:

- path exacto: `apps/dev-preview-web/src/api.ts`;
- blob previo exacto;
- blob autorizado exacto;
- Owner PBI, decisión y razón.

La construcción del contrato rechaza wildcard, path no gobernado, blob previo
stale, duplicados, hash inválido o metadata incompleta. La evaluación continúa
comparando los 20 paths protegidos por hash. Resultado:

- blob PBI-041 actual: PASS;
- drift adicional en `api.ts`: rechazado;
- drift en otra superficie protegida: rechazado;
- path no gobernado: rechazado;
- wildcard: rechazado;
- `verify:integration-baseline` sobre `176da5b`: PASS.

## Remediación del contrato de migraciones

Los allowlists de API pública y ownership reconocen ahora exactamente:

- `20260917190000_catalog_create_field_policies.ts`;
- `20260917190100_access_add_catalog_configuration_capabilities.ts`;
- `20260917190200_access_add_granular_catalog_capabilities.ts`.

Los contratos de manifest materializan las 75 migraciones actuales con orden y
owner exactos. No se cambió ninguna migración, policy de ejecución, timestamp,
wildcard ni rango permisivo.

Pruebas focalizadas: **41/41 PASS**. Incluyen inventario exacto, ownership
fail-closed, migración desconocida inválida, identificador duplicado, drift de
orden y contenido duplicado. PostgreSQL `18.4` desechable: **10/10 PASS**, 75
migraciones aplicadas, segunda ejecución `0` aplicadas / `0` pendientes y
contenedor eliminado.

## Verificación posterior

| Gate | Resultado |
| --- | --- |
| Build gobernado | PASS |
| Guard focalizado | 8/8 PASS |
| Contratos de migración focalizados | 41/41 PASS |
| PostgreSQL PBI-041 | 10/10 PASS; 75 migraciones; segunda ejecución 0 pending |
| `verify` | FAIL; 931 PASS, 2 FAIL, 29 skipped |
| `verify:full` posterior | NOT RUN; el orden autorizado exige `verify` PASS primero |
| Closure Readiness Recheck | NOT RUN; predicates no satisfechos |

El benchmark 10k ejecutado por PostgreSQL midió `publish=28,775.0 ms`, dentro
del presupuesto de 30 s. No se modificó benchmark, threshold ni implementación.

## Nuevos blockers

| ID | Clasificación | Hallazgo |
| --- | --- | --- |
| `B-041-FV-003` | PBI-041 BLOCKER | `test/full-verification-orchestration.test.mjs` detecta que `expectedPostgresqlSkipInventory` espera 21 tests materiales, mientras el árbol actual contiene 29, incluidos 7 en Bulk Catalog, 2 en Catalog y el nuevo test de Catalog authorization. Corregirlo requiere autoridad adicional sobre la orquestación full. |
| `B-041-FV-004` | PBI-041 BLOCKER | `test/ui-foundation-contract.test.mjs` detecta tres infracciones existentes en Composer: inline style en `BulkCatalogComposerPage.tsx`, radius compuesto no canónico y `!important` fuera de la excepción de reduced motion en `bulk-catalog-composer-page.module.css`. Resolverlo requiere remediación de producto/UI, expresamente fuera de este slice. |

No se debilitó ninguno de esos gates. No se ejecutó `verify:full` una segunda
vez, porque `verify` no pasó. No hubo mutación de datos Owner, AviCell,
SupplierVersions, Catalog, schema, roles, policy, push, PR, merge ni deploy.

## Dictamen

Los blockers `B-041-FV-001` y `B-041-FV-002` están **RESOLVED**. PBI-041
permanece **NOT READY — BLOCKERS REMAIN** por `B-041-FV-003` y
`B-041-FV-004`; todavía no es elegible para Formal Verification independiente.

## FV-GATE-REMEDIATION-2

La segunda autorización resolvió sin relajar gates los dos blockers anteriores:

- `B-041-FV-003` **RESOLVED**. El inventario dejó de contar expresiones por
  archivo y registra las 29 identidades exactas mediante AST: 17 del compuesto,
  2 de PBI-039, 1 de PBI-040 y 9 de PBI-041. Los runners PBI-040/PBI-041
  ejecutan conjuntos disjuntos y validan respectivamente 1/1 y 9/9 sin skips.
  Quitar una identidad, añadir una no registrada o duplicar una entrada falla
  cerrado.
- `B-041-FV-004` **RESOLVED**. Las dos columnas dinámicas de duplicados usan la
  custom property gobernada `--bulk-grid-duplicate-columns`; el restore control
  consume `var(--radius-md)` y las reglas que dependían de `!important`
  resuelven especificidad con clases locales. No se añadió excepción al checker.

Pruebas focalizadas: **39/39 PASS**. PostgreSQL PBI-041: **9/9 PASS**, 75
migraciones, segunda ejecución con 0 pendientes y cleanup PASS. Typecheck,
build y `verify` pasaron; el `verify` base registró 934 PASS, 29 skips materiales
y 0 fallos.

La única ejecución autorizada de `verify:full` llegó a Stage 4 y falló dentro
del compuesto PostgreSQL: `scripts/test-owner-scoped-persistence-postgresql.mjs`
reportó `test/access-role-postgresql.test.mjs` con exit 1. La evidencia
sanitizada no contiene una causa más específica. Stages 0..3, cleanup y
fingerprint final pasaron; el candidate permaneció estable. No se repitió la
campaña ni se modificó el fallo fuera de alcance.

| ID | Clasificación | Estado |
| --- | --- | --- |
| `B-041-FV-003` | Inventario PostgreSQL | **RESOLVED** |
| `B-041-FV-004` | Visual foundation Composer | **RESOLVED** |
| `B-041-FV-005` | PostgreSQL composite / Access roles | **OPEN** — `verify:full` Stage 4 FAIL; requiere diagnóstico/remediación separada |

Dictamen posterior: **NOT READY — BLOCKERS REMAIN**. No hubo mutación de datos
Owner, AviCell, Catalog, SupplierVersions, schema o migraciones; tampoco push,
PR, merge ni deploy.

## FV-GATE-REMEDIATION-3

`B-041-FV-005` se reprodujo antes de editar con PostgreSQL 18.4 desechable,
Node.js 24.18.0, `--no-maglev`, `--test-concurrency=1` y el mismo contrato de
entorno de Stage 4. La aserción en
`test/access-role-postgresql.test.mjs:376` comparaba el catálogo material
ordenado por `capability_code` contra una lista manual obsoleta: omitía
`catalog.suppliers.delete` y colocaba `catalog.import.read/publish` y
`catalog.items.create/bulk_retire` en un orden distinto del SQL. Una segunda
copia del mismo fixture estaba en el read model `listMatrix`.

Clasificación: **TEST FIXTURE DRIFT**. Las 75 migraciones materializaban el
catálogo correcto; no hubo defecto de producto, schema, backfill, aislamiento,
concurrencia u orquestación. La corrección hace que ambas proyecciones
PostgreSQL se comparen con el catálogo finito de dominio ordenado y conserva
una regresión explícita para la existencia y fecha de
`catalog.suppliers.delete`. Las listas exactas por rol siguen demostrando que
esa capability sensible, publish, bulk retire, costo y configuración no se
conceden implícitamente. No se añadió lógica por nombre de rol.

El test exacto pasó **1/1** en PostgreSQL 18.4 (`12,175.3 ms`). Al continuar con
el runner owner-scoped requerido, `access-role` dejó de fallar, pero el runner
se detuvo en `test/access-session-postgresql.test.mjs`. La reproducción aislada
falló en `:1224`: esperaba que la migración más reciente fuera
`20260913140000_catalog_add_canonical_reference_merge`, mientras el estado real
de 75 migraciones termina en
`20260917190200_access_add_granular_catalog_capabilities`. Se registra
`B-041-FV-006` como un **TEST FIXTURE DRIFT** nuevo y separado; corregir
Access-session está fuera del scope exclusivo de FV-3.

Por fallar el paso PostgreSQL relacionado anterior a los gates, no se ejecutó
un nuevo `verify` ni la única corrida `verify:full` prevista. Tampoco se tocó
el test Access-session, producto, migraciones, autorización, datos Owner ni
AviCell.

| ID | Clasificación | Estado |
| --- | --- | --- |
| `B-041-FV-005` | Fixture PostgreSQL Access-role | **RESOLVED** en prueba exacta; commit `209b808` |
| `B-041-FV-006` | Fixture PostgreSQL Access-session | **OPEN** — expectativa de latest migration detenida en `20260913140000` |

Dictamen FV-3: **BLOCKED — NEW BLOCKER CLASSIFIED**. La remediación autorizada
de Access-role está completa, pero PBI-041 continúa **NOT READY — BLOCKERS
REMAIN** hasta una autorización separada para `B-041-FV-006` y la posterior
ejecución ordenada de ambos gates.

## FV-GATE-REMEDIATION-4

`B-041-FV-006` se reprodujo antes de editar en PostgreSQL 18.4 desechable: el
fixture Access-session esperaba literalmente
`20260913140000_catalog_add_canonical_reference_merge` como última migración,
pero el manifest gobernado de 75 migraciones terminaba en
`20260917190200_access_add_granular_catalog_capabilities`. El bloque no
validaba semántica de Catalog; retiraba todas las migraciones posteriores a
`20260912180000_access_enable_concurrent_operational_sessions` para probar que
su rollback falla con múltiples sesiones activas y funciona después de
invalidarlas.

Clasificación: **TEST FIXTURE DRIFT**. El commit `0108f46` reemplaza la lista
literal incompleta por la secuencia exacta de `inspection.manifest.migrations`,
la recorre en orden inverso y compara cada latest migration aplicada antes de
`migrateDown`. La migración de sesiones concurrentes continúa identificada de
forma explícita como frontera bajo prueba. Esto reconoce las 75 migraciones
gobernadas sin relajar orden, unicidad, manifest ni rollback; no cambia
producción, schema, migraciones, Session, roles o capabilities.

El test exacto pasó **1/1** (`8,535.8 ms`). El composite owner-scoped superó
Access-role y Access-session, pero falló después de ejecutar
`test/contextual-authorization-postgresql.test.mjs`: su cleanup manual dejó 13
tablas PBI-041 (`catalog_field_policy_*`, retirement, Supplier
Source/Version/Listing/Resolution/Memory/raw payload, update Batch/decisions y
source deletion events). El runner detectó esos objetos mediante el `pg_dump`
posterior y eliminó el contenedor.

Se registra `B-041-FV-007` como **TEST FIXTURE CLEANUP DRIFT** nuevo y separado.
Corregir Contextual Authorization está fuera del scope exclusivo Access-session
de FV-4. Por fallar el composite previo, no se ejecutaron los tests relacionados
posteriores, `verify` ni `verify:full`; no se modificó el benchmark.

| ID | Clasificación | Estado |
| --- | --- | --- |
| `B-041-FV-006` | Fixture PostgreSQL Access-session | **RESOLVED** en prueba exacta; commit `0108f46` |
| `B-041-FV-007` | Cleanup PostgreSQL Contextual Authorization | **OPEN** — 13 tablas PBI-041 no están en el fixture manual de teardown |

Dictamen FV-4: **BLOCKED — NEW BLOCKER CLASSIFIED**. Datos Owner, AviCell,
producto, schema y migraciones permanecieron sin cambios; no hubo push, PR,
merge ni deploy.

## FV-GATE-REMEDIATION-5

`B-041-FV-007` se reprodujo antes de editar en PostgreSQL 18.4 desechable. El
cuerpo funcional de Contextual Authorization pasó **1/1**, pero el teardown
manual y su `assertNoObjects` consultaban el mismo inventario incompleto; por
eso ambos ignoraban 13 tablas posteriores y sólo el guard externo basado en
`pg_dump` las detectaba:

1. `catalog_field_policy_heads` — cabeza de policy Catalog PBI-041.
2. `catalog_field_policy_versions` — historial append-only de policy Catalog.
3. `catalog_retirement_events` — evento auditado de retiro masivo.
4. `catalog_retirement_plans` — plan autorizado de retiro masivo.
5. `catalog_supplier_catalog_versions` — Version de lista de proveedor.
6. `catalog_supplier_listing_resolutions` — Resolution publicada.
7. `catalog_supplier_listings` — observación física de proveedor.
8. `catalog_supplier_reconciliation_memory` — memoria de reconciliación.
9. `catalog_supplier_source_deletion_events` — auditoría de borrado de Source.
10. `catalog_supplier_sources` — identidad de Supplier Source.
11. `catalog_supplier_version_raw_payloads` — provenance/raw payload de Version.
12. `catalog_update_batches` — Batch de reconciliación/publicación.
13. `catalog_update_row_decisions` — decisión efectiva por fila.

Clasificación: **TEST FIXTURE CLEANUP DRIFT**. No eran tablas Access ni un
defecto de autorización, schema o migración. El commit `4b7d18a` elimina el
inventario manual y, sólo después de validar el nombre gobernado
`srtaller_adapters_<12 hex>` y el User configurado, reemplaza
transaccionalmente el schema `public` de la base desechable. Así las tablas,
funciones, triggers y extensiones creadas por migraciones quedan cubiertas sin
recordar una lista nueva en la siguiente migración. La aserción local enumera
todas las tablas públicas y una regresión crea una tabla desconocida, exige
que sea reportada y luego demuestra su eliminación.

El guard post-test del runner no cambió: sigue ejecutando `pg_dump`, no contiene
wildcards, ignores ni bypass, y continúa fallando ante `CREATE TABLE`. Su fallo
pre-remediación sobre los 13 objetos y el probe sintético del fixture prueban
que cleanup incompleto permanece visible. El test exacto pasó **1/1** y dejó
`0` tablas públicas; el composite owner-scoped pasó **8/8**, cleanup PASS y
material MATCH. Los contratos contextuales pasaron **30/30** y conservaron
Tenant/Branch scope, trusted Station/Session, role union, evaluación fresca de
capabilities, deny-by-default y ausencia de branching por nombre de rol.

`verify` pasó con 934 tests ejecutados, 29 skips materiales gobernados y 0
fallos. La única corrida FV-5 de `verify:full` pasó Stages 0..13, incluidos
PostgreSQL compuesto **17/17**, PBI-039 **2/2**, PBI-040 **1/1**, PBI-041
**9/9**, runtime/smokes y cleanup. El benchmark PBI-041 de 10k registró ingest
`4,174.4 ms`, analyze `449.0 ms`, preview `40.0 ms`, publish `28,920.0 ms`,
historical search `74.4 ms` y heap `33.0 MiB`, sin cambiar presupuesto ni
implementación.

Readiness recheck: `B-041-FV-001..007` **RESOLVED**, nuevos blockers **NONE**.
PBI-041 queda **READY FOR INDEPENDENT FORMAL VERIFICATION**; esto no implica
Owner Acceptance, PR, merge, Done, Released ni deploy. Datos Owner, AviCell,
Catalog productivo/local y migraciones permanecieron sin cambios.
