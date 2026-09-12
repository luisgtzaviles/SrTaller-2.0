# PBI-040 — Baseline Preservation and Integration Audit

## Veredicto

**PASS para volver a Owner Review.** PBI-040 parte del `main` integrado de
PBI-039 y no contiene una versión anterior de Worklist, New Repair o Repair
Detail. Los hallazgos visibles provinieron de la diferencia entre snapshots
históricos sin vínculo canónico y catálogos sintéticos añadidos después, no de
una reversión de producto.

No existe ninguna diferencia clasificada D (regresión) o E (desconocida). No se
realizó merge/rebase porque la rama no está detrás de `origin/main`.

## 1. Causa raíz exacta

Hay dos causas independientes:

1. El seed local original de PBI-039 creó 15 Repairs e intakes con snapshots de
   Marca/Modelo, pero no pobló `canonical_device_type_id`,
   `canonical_brand_id` ni `canonical_model_id`, ni creó relaciones de Riesgos
   o Categorías. PBI-040 añadió 38 definiciones de catálogo para hacer revisable
   la UI, pero una etiqueta igual no es identidad ni reconciliación. Por eso
   `Uso = 0` era correcto en persistencia y confuso en presentación.
2. Repair Detail no perdió funcionalidad. El código, CSS, read model,
   persistencia y pruebas son byte por byte los de `origin/main`. La diferencia
   observada entre Local y Preview corresponde a registros/fixtures distintos:
   un Repair local con campos opcionales vacíos presenta menos contenido que un
   registro Preview enriquecido.

La base local observada durante esta auditoría contenía 15 intakes, cero IDs
canónicos para Tipo/Marca/Modelo, cero Repairs relacionadas a Riesgos y cero
Repairs relacionadas a Categorías. Tenía 2 Tipos, 12 Marcas, 15 Modelos, 4
Riesgos y 4 Categorías; el manifiesto define 5 Categorías, pero no se reejecutó
el seed porque faltaban los tres PIN sintéticos efímeros requeridos. No se
reseteó ni se sobrescribió el estado de revisión del Owner.

## 2. Genealogía Git

| Hecho | Evidencia Git |
|---|---|
| Creación de rama | reflog: 2026-09-11 17:10:00 -0700, `Created from HEAD` `40684d7554cdf02551f941e5e3f0beabbe563125` |
| Primer commit propio | `62b222868457320433b34d441e7ce829fc363abe`; parent exacto `40684d7…` |
| Merge-base actual | `40684d7554cdf02551f941e5e3f0beabbe563125` |
| Distancia antes de remediación | `origin/main...67fe431`: main 0, feature 18 |
| Commits de main posteriores al merge-base | ninguno |
| PR #42 | merge `6c04e57c8a5d3bf8600cd4a2a3a191958aa0f0c2`, ancestro |
| PR #43 | merge `5ccc525a09d29fd6dcabbbfaabff9b811677c985`, ancestro |
| PR #44 | merge `0d1c5760ce962d17a8292b841f5de43a8cb453a7`, ancestro |
| PR #45 | merge/baseline `40684d7554…`, ancestro y merge-base |

Los 18 commits previos de la rama forman una secuencia lineal después de ese
baseline: arquitectura/readiness, core Catalog/Pricing, UI individual,
compatibilidad de suites, correcciones de autorización, gobierno/reconciliación,
filtros, simplificación de identificadores, fixtures Repairs y convergencia
visual. No existe merge, rebase ni restore desde un ancestro anterior.

## 3. Baseline functional diff A-E

| Superficie protegida | Diff contra `origin/main` | Clase | Introducción / razón |
|---|---|---:|---|
| Repair Worklist | `RepairsPage.tsx` blob `e2d877d…` idéntico | — | intacta |
| Repair Detail page | blob `3aeb219…` idéntico | — | intacta |
| Repair Detail CSS compartido | `pages.module.css` blob `87049e6…` idéntico | — | intacto |
| Repair Detail API/read model | `api.ts` `620a5a1…`; use case `b9f1e19…`, idénticos | — | intactos |
| Repair Detail persistence/controller | repository `8d8f174…`; controller `701ee09…`, idénticos | — | intactos |
| Repair Detail tests | siete contratos de Header/Reception/History/Concepts/Evidence/routing, blobs idénticos | — | intactos |
| New Repair | `NewRepairPage.tsx` blob `831d4af…` idéntico | — | intacta |
| New Repair preference test | allowlist pasa de una a dos preferencias | A | `49f58dc`; agrega sólo preferencia de costo de Price List |
| Repair Catalogs page/CSS | módulo Price List + tabs compartidos; dominio Repairs preservado | B | `c97c05d`, `b903eab`; convergencia visual solicitada |
| Repairs API productivo | controller, operations, port y repository sin diff | — | intacta |
| Repairs persistence productiva | cero migraciones o tablas Repairs modificadas | — | intacta |
| Repairs PostgreSQL tests | cleanup de tablas Catalog y `operating_currency` requerida | C | compatibilidad con las cinco migraciones aditivas PBI-040 |
| Access/session | capabilities Catalog + executor Tenant-wide; lifecycle PIN/Session no reemplazado | A | `49f58dc`; aislamiento/autorización de Catalog |
| Application Shell | grupo Listas + ruta `/listas/precios`; rutas Repairs existentes preservadas | A | `766a38c`; integración mínima de navegación |
| Preview static/runtime | build/runtime/OCI sin cambio; App añade sólo la ruta Price List | A | `766a38c`; extensión del SPA |
| Local seed Repairs catalogs | definiciones sintéticas, sin canonical linkage | C | `d3fefe6`; estado revisable local |

Resultado: A = integración necesaria, B = refactor visual neutro, C =
test/fixture explícito, D = 0, E = 0.

## 4. Repair Detail preservado

El inventario protegido fija 16 blobs del baseline, entre ellos Worklist, New
Repair, Repair Detail, `pages.module.css`, transporte API, controller,
repository, use case y contratos de UI. El preflight recalcula los blobs del
working tree; no se limita a comparar commits.

Las rutas preexistentes continúan presentes:

- directa: `/reparaciones/:id` monta el workspace completo;
- overlay: el mismo `RepairDetailPage` se monta con `host="overlay"`;
- post-create: New Repair navega al ID creado conservando el background cuando
  corresponde.

Los contratos ejecutados confirman Operational Header, Recepción, Estado,
Técnico, Custodia, Ubicación, Historial, Conceptos, Evidencias, modal/direct y
post-create. Como evidencia complementaria, `https://preview.srtaller.dev`
respondió 200 y su bundle vigente contiene las anclas `Resumen de recepción`,
`Historial`, `Conceptos`, `Evidencias`, `Custodia` y `Ubicación`. Git/código y
tests siguen siendo la autoridad cuando los datos visibles difieren.

## 5. Canonical linkage y significado de Uso

| Catálogo Repairs | Fuente autoritativa | Qué cuenta Uso |
|---|---|---|
| Tipo | `repair_intakes.canonical_device_type_id` | intakes vinculados a ese UUID |
| Marca | `repair_intakes.canonical_brand_id` | intakes vinculados a ese UUID |
| Modelo | `repair_intakes.canonical_model_id` | intakes vinculados a ese UUID y Marca compatible |
| Riesgo | `repair_intervention_risks` | Repairs con esa relación canónica |
| Categoría | `repair_problem_classifications` / capturas canónicas vigentes | Repairs distintas vinculadas a ese UUID |

Los snapshots raw preservan lo que se recibió; no son una segunda identidad.
Una coincidencia `Apple` ↔ `Apple` no debe incrementar el contador ni autoriza
un backfill. Las 15 Repairs locales son históricas/no reconciliadas. New Repair
sí consume las tablas canónicas vigentes y las nuevas selecciones escriben IDs
explícitos; los valores libres pasan por el mecanismo pending y resolución
humana definido en PBI-039.

La cabecera visible ahora dice **Uso canónico** y explica: “Reparaciones
vinculadas por identidad canónica. No cuenta coincidencias del texto
histórico.” `Uso` dentro de Por revisar sigue contando las capturas asociadas a
ese grupo pending, que es una relación explícita diferente.

## 6. Política de lifecycle, safe delete y merge

| Identidad | Desactivar/reactivar | Hard delete | Fusión/reconciliación |
|---|---:|---:|---|
| Repairs Riesgo | sí, Tenant | no | pending puede resolverse; no merge de canónicas |
| Repairs Tipo | sí, Tenant | no | pending puede resolverse; no merge de canónicas |
| Repairs Marca | sí, Tenant | no | pending puede resolverse/reabrirse; no merge de canónicas |
| Repairs Modelo | sí, Tenant | no | pending puede resolverse/reabrirse; no merge de canónicas |
| Repairs Categoría de problema | sí, Tenant | sólo Tenant nunca usada y sin historia/dependencias | pending puede resolverse/reabrirse |
| Price List Category/Brand | sí, Tenant | no | sólo valor PENDING hacia canónica aprobada compatible; source queda MERGED/inactiva y auditada |

La diferencia de Categoría de problema no es accidental. La iteración Owner de
PBI-039 autorizó expresamente su safe delete y exige que el backend revalide
ownership, versión, asociaciones e historia. El mismo documento prohibió
generalizarlo a Riesgos/Tipos/Marcas/Modelos sin decisiones específicas. La
arquitectura Price List prohíbe hard delete ordinario y usa merge trazable. En
todos los casos, cualquier uso histórico que deba conservar identidad impide el
borrado físico.

## 7. Correcciones realizadas

1. Los cinco inserts de catálogos Repairs del seed usan `ON CONFLICT DO
   NOTHING`: agregan fixtures ausentes sin reemplazar una fila local existente.
2. El resultado del seed declara `repairCanonicalLinksCreated: 0`; no afirma
   linkage ni cantidad materializada cuando sólo conoce definiciones.
3. El contrato/documentación local separa etiquetas coincidentes, snapshots e
   identidad canónica y mantiene `local:db:reset` como reversión gobernada.
4. La UI distingue **Uso canónico** y explica exactamente qué excluye.
5. No se enlazó ni actualizó ninguna Repair por string matching; no se reseteó
   la base Owner.

## 8. Guard permanente de baseline drift

`verify:integration-baseline` y Stage 0 de `verify:full` ahora fallan si:

- `40684d7554…` no es ancestro de `HEAD`;
- `merge-base(HEAD, origin/main)` difiere del head actual de `origin/main`;
- cambia cualquiera de los 16 blobs protegidos de PBI-039.

El guard usa ancestry, merge-base, SHA y Git blob IDs; no usa timestamps. Un
futuro cambio autorizado a esas superficies deberá actualizar deliberadamente
el inventario y sus contratos, haciendo visible la decisión.

## 9. Evidencia ejecutada

- tests focalizados iniciales: 21/21 PASS;
- tests del guard: 5/5 PASS, incluidos tres casos fail-closed;
- typecheck: PASS;
- `verify:integration-baseline`: PASS, baseline y `origin/main` en
  `40684d7554…`, 16 superficies protegidas;
- `verify:full` sobre candidato de código `453eeb0`: 13/13 stages PASS;
- base suite: 822 tests, 802 PASS, 20 skips PostgreSQL gobernados, 0 fallos;
- PostgreSQL compuesto: 5 suites, 17 tests, 0 skips críticos;
- PBI-039 PostgreSQL: 2/2 PASS, 56 migraciones, 0 skips;
- PBI-040 PostgreSQL: PASS, p95 8.23 ms / presupuesto 750 ms;
- Preview-like runtime y smoke backend/UI: PASS;
- cleanup: PASS;
- candidate fingerprint:
  `cdafe0acacfbf2691ea5acc6f4d4b802e2ee73cb3ed246e98d4f1b7babbc490a`;
- warning conservado: chunk Vite principal >500 kB, aceptado y no ocultado.

## 10. Límites del resultado

PBI-040 vuelve a Owner Review, no a aceptación. No se inició PBI-041/PBI-042,
no se continuó el polish de Price List y no hubo push, PR, merge, deploy,
release ni cambio de infraestructura.
