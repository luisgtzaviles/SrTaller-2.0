# UX-005 — First Supplier Baseline Reconciliation Audit

## Estado del documento

- **Estado:** audit complete; remediation deliberately not implemented.
- **PBI:** [PBI-041](../backlog/pbis/PBI-041.md).
- **Alcance:** diagnóstico de `Avicell v2` en localhost, lectura de PostgreSQL
  y trazado de código. No hubo reanálisis, decisiones, Apply, cambios de policy
  ni escrituras.
- **Próxima revisión:** cuando el Owner decida si autoriza UX-005.1.

## Pregunta y respuesta corta

La ausencia de un baseline previo **no** clasifica una fila como
`PENDING_REFERENCE`. Avicell es un SupplierSource nuevo y por eso Coverage
correctamente muestra `NO_BASELINE`, pero la clasificación de sus 744 filas se
decide por referencias de Category/Brand antes de cualquier consideración de
coverage.

La diferencia exacta es la disponibilidad de una **Marca canónica activa**:

| Población | Filas | Category canónica activa | Brand canónica activa | Target/History/Candidate | Resultado |
|---|---:|---:|---:|---:|---|
| Apple | 124 | 124 | 124 | 0 / 0 / 0 | `NEW` / `APPLY` |
| Brand no canónica | 615 | 615 | 0 | 0 / 0 / 0 | `PENDING_REFERENCE` / `UNRESOLVED` |
| Captura mal alineada | 1 | 0 | 0 | 0 / 0 / 0 | `PENDING_REFERENCE` / `UNRESOLVED` |
| Duplicados contradictorios | 4 | 4 | 0 | 0 / 0 / 0 | `CONFLICT` / `UNRESOLVED` |

Los 616 `PENDING_REFERENCE` no carecen de CatalogItem conocido: todos tienen
`target_item_id = null`, `match_origin = NONE`, cero candidatos y cero historia
confiable. La referencia pendiente es principalmente la **identidad canónica de
Marca**, no un UUID de CatalogItem, un mapping de Supplier ni la falta de un
baseline.

## Snapshot material preservado

| Dato | Valor |
|---|---|
| Entorno | localhost, PostgreSQL 18.4, 75 migraciones |
| SupplierSource | Avicell `31392db1-2272-4163-95cf-38b35d3abdce`, `ACTIVE` |
| v1 | `DRAFT`, `FULL`, `COMPLETE`, 744 filas; nunca analizada ni aplicada |
| v2 | `INGESTED`, `FULL`, `COMPLETE`, 744 filas; Batch `RECONCILING` |
| v2 publicación | `published_at = NULL` |
| Policy efectiva | v8: `kind`, `title`, `category`, `basePrice` REQUIRED; Brand y costo ESSENTIAL |
| Catalog local | 45 items, 42 activos; Category `Pantallas/PART` y Brand `Apple` canónicas activas |
| Avicell resolutions / memory / audit | 0 / 0 / 0 |
| Coverage | `NO_BASELINE`, 742 observaciones efectivas; no existe versión COMPLETE/APPLIED previa |

El snapshot posterior de este audit debe ser idéntico: no se ejecutó comando
mutante contra Avicell ni contra Catalog.

## Muestra material

La siguiente muestra conserva título observado y efectivo, Brand observado/
efectivo, Type, Category, presencia de precio/costo e identificadores. Los
montos de costo no se reproducen aquí: su presencia fue verificada bajo la
autoridad local de costo. Ninguna de estas 30 filas tiene supplier code, SKU o
barcode; todas tienen precio y costo presentes, y ninguna tiene candidato,
target o trusted history.

### Diez `NEW`

| Fila | Observado → efectivo | Brand obs./efectiva | Tipo / Category | Resultado |
|---:|---|---|---|---|
| 3 | `PANTALLA APPLE WATCH SE 40MM` → `Pantalla Apple Watch Se 40MM` | `APPLE` / `APPLE` | PART / Pantallas | NEW / APPLY |
| 4 | `PANTALLA APPLE WATCH SERIE 5 40MM` → presentación normalizada | `APPLE` / `APPLE` | PART / Pantallas | NEW / APPLY |
| 5 | `PANTALLA APPLE WATCH SERIE 5 44MM` → presentación normalizada | `APPLE` / `APPLE` | PART / Pantallas | NEW / APPLY |
| 6 | `PANTALLA APPLE WATCH SERIE 6 40MM` → presentación normalizada | `APPLE` / `APPLE` | PART / Pantallas | NEW / APPLY |
| 7 | `PANTALLA APPLE WATCH SERIE 6 44MM` → presentación normalizada | `APPLE` / `APPLE` | PART / Pantallas | NEW / APPLY |
| 8 | `PANTALLA APPLE WATCH SERIE GPS 3 42MM GPS` → presentación normalizada | `APPLE` / `APPLE` | PART / Pantallas | NEW / APPLY |
| 9 | `PANTALLA COMPLETA IPAD PRO 12 12.9…` → presentación normalizada | `APPLE` / `APPLE` | PART / Pantallas | NEW / APPLY |
| 97 | `PANTALLA IPAD (LCD) 10 GENERACION…` → presentación normalizada | `APPLE` / `APPLE` | PART / Pantallas | NEW / APPLY |
| 98 | `PANTALLA IPAD 5 AIR 2… BLANCO` → presentación normalizada | `APPLE` / `APPLE` | PART / Pantallas | NEW / APPLY |
| 99 | `PANTALLA IPAD 5 AIR 2… NEGRO` → presentación normalizada | `APPLE` / `APPLE` | PART / Pantallas | NEW / APPLY |

### Veinte `PENDING_REFERENCE`

| Fila | Observado → efectivo | Brand obs./efectiva | Tipo / Category | Resultado |
|---:|---|---|---|---|
| 1 | `PANTALLA XIAOMI MI 12 PRO…` → presentación normalizada | `XIAOMI` / `XIAOMI` | PART / Pantallas | pending / unresolved |
| 2 | `PANTALLA ALCATEL 1SE…` → presentación normalizada | `ALCATEL` / `ALCATEL` | PART / Pantallas | pending / unresolved |
| 10–13 | cuatro `CUBOT…` → presentación normalizada | `CUBOT` / `CUBOT` | PART / Pantallas | pending / unresolved |
| 14–18 | cinco `GOOGLE PIXEL…` → presentación normalizada | `GOOGLE` / `GOOGLE` | PART / Pantallas | pending / unresolved |
| 19 | `PANTALLA GOOGLE PIXEL 8 PRO…` → presentación normalizada | `HISENSE` / `HISENSE` | PART / Pantallas | pending / unresolved |
| 20–23 | cuatro `HISENSE…` → presentación normalizada | `HISENSE` / `HISENSE` | PART / Pantallas | pending / unresolved |
| 24–27 | cuatro `HONOR…` → presentación normalizada | `HONOR` / `HONOR` | PART / Pantallas | pending / unresolved |

Estas 20 filas muestran el patrón; la matriz completa confirma que la causa
se mantiene en las 616. El único pending cuya Category no es `Pantallas` es la
fila 618 (`V2314 COPIA`), evidencia de un desplazamiento de captura que debe
seguir siendo excepción explícita.

## Trazado de clasificación

`src/modules/catalog/infrastructure/persistence/kysely-bulk-catalog.repository.ts`
líneas 314–361 ejecuta este orden:

1. Resuelve Category canónica/pending y Brand canónica/pending.
2. Intenta identificadores internos y sólo history publicada/aplicada del mismo
   SupplierSource.
3. Prioriza conflictos y el modo COMPACT sin target.
4. Para un FULL sin target, calcula `categoryKnown = Boolean(proposedCategory)`
   y `brandKnown = !p.brand || Boolean(proposedBrand)`.
5. Sólo si ambos son verdaderos busca candidatos bounded y, con cero, emite
   `NEW/APPLY`; en cualquier otro caso emite `PENDING_REFERENCE/UNRESOLVED`.

Así, una Brand pendiente existente tampoco satisface `brandKnown` para una fila
nueva: la condición acepta únicamente una Brand **canónica activa**. Para
filas con target, la ruta distinta de líneas 363–365 permite una referencia
pending existente; la semántica no es idéntica entre create y update.

La evaluación de REQUIRED está después (líneas 371–379) y sólo corre si hay
target o si ya es `NEW`. No explica Avicell: todos los valores REQUIRED están
presentes y las 616 no contienen razones `MISSING_REQUIRED_EFFECTIVE_VALUE`.

## Baseline, v1 y COMPLETE

`readAutomaticAbsenceBaseline` (líneas 103–116) usa exclusivamente una versión
anterior del mismo Source que sea `COMPLETE` y cuyo Batch esté `APPLIED`. Avicell
v1 es DRAFT y no puede ser baseline. La lectura de trusted history del
reconciler también filtra Batch `APPLIED`; v1 no aporta mapping, target,
memoria ni candidate index. No hay un concepto de clasificación especial para
“primer SupplierSource”; el concepto de primer baseline existe sólo para
Coverage.

`COMPLETE` cambia Coverage/ausencias, no la rama `NEW/PENDING_REFERENCE`.
`FULL` sí permite `NEW`; `COMPACT` sin target pasa antes a `INVALID`. Avicell
v2 es FULL y no se está comportando como COMPACT.

## Referencia, sugerencias y conteos

### Qué significa Referencia

En estas 616 filas, “Referencia pendiente” significa que la propuesta de Brand
no resuelve a una `catalog_brands` activa (y una fila tampoco a Category). No
significa que falte una identidad de CatalogItem: no existe target, candidate,
identificador ni history aplicable. El texto de UI debe distinguir esta
gobernanza de referencia de una decisión de identidad de artículo.

### Qué haría `Aceptar 616 sugerencias`

La UI cuenta exactamente las filas `UNRESOLVED` sin error REQUIRED de las
clasificaciones compatibles, incluidas `PENDING_REFERENCE`, y llama a
`decideMany(..., decision: APPLY)`. No cambia clasificación, target, título ni
crea Catalog/Resolution/Memory en ese click; sólo persiste decisiones de Batch.
Con los cuatro conflictos todavía abiertos, el Batch continuaría RECONCILING.
Al publicar posteriormente, cada pending sin target entra por la ruta de crear
CatalogItem; `resolveBrand` reutiliza o crea una Brand pending y se generan las
escrituras normales de item, identificadores, revisiones autorizadas,
Resolution, Memory y audit. Por tanto, la aceptación humana actualmente es el
acknowledgement de crear artículos con referencias de Brand todavía no
canónicas, no una resolución de identidad individual.

### Filas físicas frente a unidades efectivas

| Medida | Resultado |
|---|---:|
| Observaciones físicas | 744 |
| `NEW` físicos / resueltos | 124 / 124 |
| `PENDING_REFERENCE` físicos / atención | 616 / 616 |
| Conflictos físicos | 4 |
| Grupos de conflicto | 2 (dos observaciones cada uno) |
| Unidades efectivas | 742 |
| Unidades que requieren atención | 618 (= 616 + 2 grupos) |
| Filas perdidas | 0 |

Los cuatro conflictos son dos contradicciones de duplicado (`Samsung A30/A305`
y `Samsung Tab S7 FE`), no una consecuencia del baseline ni de la falta de
Brand canónica.

## Hipótesis evaluadas

| Hipótesis | Resultado | Evidencia |
|---|---|---|
| H1 faltan identificadores Supplier | Rechazada como diferencia | ninguna de las 744 tiene code/SKU/barcode |
| H2 identificador sin mapping | Rechazada | no hay identificadores ni Memory Avicell |
| H3 título/canonical item | Rechazada | target/candidate/history son cero en NEW y pending |
| H4 Brand/reference | Confirmada | 615 pending con Category canónica y Brand no canónica; 124 Apple canónicas son NEW |
| H5 primer COMPLETE baseline | Rechazada como causa | sólo Coverage usa baseline; clasificador no lo consulta |
| H6 v1 DRAFT contaminó historia | Rechazada | queries y código filtran `APPLIED`; Avicell tiene cero Memory/Resolution |
| H7 etiqueta UI engañosa | Parcial | técnicamente “Referencia” es Brand/Category, no identidad de artículo |
| H8 primera aceptación intencional | Confirmada | botón convierte pending a APPLY antes de una creación que puede capturar Brand pending |
| H9 otra causa | Una fila aislada | fila 618 también tiene Category desplazada/no canónica |

## Decisiones para Owner

### UX5-001 — Meaning of `REFERENCE_PENDING`

- **Question / current:** para nuevos sin target significa Category/Brand no
  canónica, no identidad de CatalogItem ausente.
- **Evidence / expected semantic:** la causa debe ser explicable como
  `Brand reference pending` o `Category reference pending`.
- **Risk / recommendation:** evitar que el Owner intente “resolver” un item
  inexistente; separar copy y reason typed.
- **Implementation/tests/migration/compatibility:** UI/read-model + tests;
  sin migración; compatible con historia.

### UX5-002 — NEW eligibility without supplier history

- **Current:** history vacía no bloquea; Brand no canónica sí.
- **Expected / recommendation:** evaluar si `FULL` con cero target/candidate y
  datos REQUIRED puede ser `NEW` aunque capture una Brand pending.
- **Risk:** creación masiva de referencias pending; exigir límites y razones
  explícitas. **Needed:** sí, sólo si Owner acepta. **Tests:** nueva/sin
  history, candidates, pending Brand y Apply. **Migration:** no prevista.
  **Compatibility:** no reclasificar historia sin decisión Owner.

### UX5-003 — First SupplierSource behavior

- **Current/evidence:** no branch especial; Avicell no tiene historia APPLIED.
- **Recommendation:** no usar “primer source” como bypass de identidad; la
  regla debe basarse en evidencia de fila. **Needed:** no, salvo UX5-002.
  **Migration:** no. **Compatibility:** preservada.

### UX5-004 — First COMPLETE baseline behavior

- **Current/evidence:** primer COMPLETE/APPLIED sólo es relevante para Coverage;
  v2 reporta `NO_BASELINE` correctamente.
- **Recommendation:** conservar. **Needed/tests/migration:** no / cobertura
  existente / no. **Risk:** ninguno nuevo.

### UX5-005 — Effect of unpublished Draft history

- **Current/evidence:** v1 DRAFT no entra a history ni baseline.
- **Recommendation:** conservar fail-closed. **Needed/tests/migration:** no /
  regresión explícita DRAFT-no-history / no. **Compatibility:** preservada.

### UX5-006 — Required-value interaction

- **Current/evidence:** REQUIRED está presente en las 744; policy no explica el
  split y no evalúa pending antes de la referencia.
- **Recommendation:** UX5-002 debe mantener `missingRequiredEffectiveFields`
  como guard antes de auto-`NEW`. **Needed/tests:** sí si se remedia; no
  migration; compatible.

### UX5-007 — Canonical Brand/reference interaction

- **Current/evidence:** sólo Apple canónica activa; `Samsung` pending tampoco
  satisface la puerta de NEW.
- **Recommendation:** decidir si Brand pending existente es evidencia suficiente
  para NEW o si debe seguir requerir acknowledgement group-level. **Needed:**
  decisión Owner; tests de canonical/pending/new Brand; no migration.

### UX5-008 — Bulk suggestion acceptance

- **Current/evidence:** 616 ACCEPT cambia decisiones, no identidad ni mapping;
  Apply posterior crea items con Brand pending.
- **Recommendation:** si UX5-002 se aprueba, eliminar la acknowledgement masiva
  sólo para filas cuya creación sea determinista y mantener excepciones.
  **Needed/tests/migration:** sí / API+UI+Apply guard / no.

### UX5-009 — Duplicate contradictions

- **Current/evidence:** dos grupos, cuatro filas, `DUPLICATE_VALUE_CONTRADICTION`.
- **Recommendation:** seguir explícitos; no incluir en la aceptación masiva.
  **Needed/tests/migration:** no / conservar UX-002A / no.

### UX5-010 — Physical vs effective rows

- **Current/evidence:** 744 físicas, 742 unidades; UI atención 618 es correcto.
- **Recommendation:** explicar ambos conteos junto al summary. **Needed:** UI
  copy opcional; tests de grouping; no migration; compatible.

### UX5-011 — Future baseline and Memory learning

- **Current/evidence:** sólo Apply crea Resolution/Memory; v2 no ha aprendido.
- **Recommendation:** conservar; jamás aprender desde Analyze o aceptación.
  **Needed/tests/migration:** no / regresiones existentes + UX5-002 / no.

### UX5-012 — Recommended remediation slice

- **Recommendation:** `UX-005.1 — New Item Classification with Pending
  Reference Capture`, no “first-baseline bypass”.
- **Scope proposed:** para FULL sin target/history/candidate/conflict y con
  REQUIRED efectivo, permitir `NEW/APPLY` cuando Category sea canónica y Brand
  pueda capturarse como pending; mantener Category mal alineada, duplicates,
  candidates, targets, COMPACT y missing REQUIRED como atención explícita.
- **Domain/API/UI/tests/migration/compatibility:** clasificación repository +
  reason/read-model/UI summary; tests unitarios/PostgreSQL/UI; no migration
  esperada; Avicell v2 e historia se preservan sin reanálisis automático.
- **Risk:** parcialmente cambia la política de data quality; requiere decisión
  Owner antes de implementación.

## Resultado

La hipótesis de baseline es **rechazada como causa**, pero la fricción es real:
615 de 616 filas son nuevas sin evidencia de identidad conflictiva y quedan
pendientes únicamente por una Brand no canónica, aun cuando Apply ya sabe
capturar esa Brand como pending. La fila 618 y los dos conflictos siguen siendo
excepciones genuinas. La solución, si se aprueba, debe ser una slice de
clasificación/copy acotada, no una conversión indiscriminada de las 616 filas
ni una reparación de Avicell v2.
