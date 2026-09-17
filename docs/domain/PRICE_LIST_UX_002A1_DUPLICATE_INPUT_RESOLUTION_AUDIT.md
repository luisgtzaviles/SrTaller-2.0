# UX-002A.1 — Duplicate Input Resolution Audit

## Estado del documento

- **PBI:** PBI-041 — Initial Bulk Catalog Composer + Versioned Supplier Intake.
- **Estado:** UX-002A.2 implementado localmente; pendiente de Owner Review.
- **Fecha:** 2026-09-17.
- **Alcance:** Duplicados dentro de una misma lista de proveedor; no cambia identidad de CatalogItem, reconciliación, publicación ni datos.
- **Próxima revisión:** Owner Review de la implementación DUP-1/DUP-3; DUP-2 sigue sin iniciar.

## Conclusión ejecutiva

AG `v60` demuestra una diferencia que la implementación actual no expresa: dos
observaciones de un mismo artículo del proveedor pueden tener **identidad ya
conocida** y, a la vez, contener una **contradicción material de valores**.
Actualmente ambas caen en la clasificación genérica `CONFLICT` porque se
detecta la misma clave de entrada dentro de la versión antes de consultar la
historia confiable. La protección es conservadora —no permite Apply—, pero el
remedio visual de UUID es semánticamente incorrecto en este caso: la identidad
ya está resuelta y las dos filas no pueden apuntar al mismo `CatalogItem` por
la regla de decisiones competidoras.

```text
IDENTITY CONFLICT
  = no se conoce con seguridad qué CatalogItem representa una observación

VALUE CONTRADICTION IN SAME SNAPSHOT
  = se conoce el CatalogItem; dos observaciones físicas del mismo snapshot
    proponen valores materiales incompatibles y requieren elección humana
```

No se aplicó, reanalizó, editó, excluyó ni corrigió ningún mapping de AG `v60`.
No hubo escritura en Catalog, Resolution, Memory ni auditoría.

## Preflight y evidencia preservada

| Control | Resultado |
| --- | --- |
| Rama / HEAD | `feature/pbi-041-bulk-catalog-composer` / `341930c7343e2fb41c9ea4cc3d5a95260d9cd9cd` al inicio de la auditoría. |
| Working tree | Sólo `apps/dev-preview-web/src/.DS_Store` sin seguimiento, artefacto Owner preexistente preservado. |
| Runtime local | Frontend `4173`, backend `/readyz` `200`; ambos reportaban runtime local `dirty`, por lo que no se usan como evidencia de candidato integrado. |
| PostgreSQL | `18.4`, `Etc/UTC`, 72 migraciones aplicadas. |
| Acceso de datos | Consultas ejecutadas dentro de `BEGIN TRANSACTION READ ONLY`; AG `v60` quedó intacta. |
| Mutaciones prohibidas | `Analyze`, `Apply`, corrección, exclusión, edición de filas y cualquier cambio de DB: **no ejecutados**. |

## Hechos materiales de AG v60

| Dato | Resultado observado |
| --- | --- |
| Source / versión | `AG` / `v60`, `PARTIAL`, `INGESTED`, Batch `RECONCILING`. |
| Filas físicas | 2. |
| Resultado actual | `CONFLICT: 2`; ambas `UNRESOLVED`. |
| Identidad de proveedor | Sin supplier code, SKU ni barcode; misma firma normalizada `74872d…12b04`. |
| Título observado | `PANTALLA IPHONE 11 CALIDAD RJ >> (liquidacion)` en ambas filas. |
| Row 1 | costo `45000`, precio `119900`. |
| Row 2 | costo `46000`, precio `120000`. |
| Target derivado | Ambas apuntan a `7e0de2f0-9f58-455d-b4d2-a749386f36d9`. |
| Evidencia histórica | `SIGNATURE` consistente, `correction_count = 0`, última Resolution de Batch `APPLIED`. |
| Error / advertencia | `DUPLICATE_OBSERVATION_IN_VERSION` y `TRUSTED_HISTORICAL_MATCH_AUTO_RESOLVED`. |
| Efectos de v60 | `0` Resolutions, `0` audit events asociados, `0` publicaciones. |

La misma identidad histórica confiable para ambas filas prueba que no hay una
ambigüedad de `CatalogItem` en v60. La diferencia entre costo y precio prueba
que tampoco son duplicados exactos que puedan consolidarse silenciosamente.

## Traza actual: paste → resultado

1. **Paste/grid.** `BulkCatalogComposerPage.tsx` conserva las filas físicas y
   aplica defaults sólo a celdas vacías. No registra si un valor provino de
   paste, default o edición posterior.
2. **Guardar / reemplazar.** `replaceRows()` en
   `kysely-bulk-catalog.repository.ts` persiste una `SupplierListing` y una
   `RowDecision` por cada fila, además del raw payload retenido. La base sólo
   exige unicidad por `(tenant, version, row_number)`: permite duplicados de
   firma para no perder evidencia de entrada.
3. **Analyze.** `KyselyBulkCatalogRepository.analyze()` recorre las filas de la
   versión y marca en un set todas las claves vistas más de una vez, antes de
   resolver identifiers, Memory o historia publicada.
4. **Historia / identidad.** Después se consultan Memory y Resolutions
   publicadas. En v60 ambas filas obtienen el mismo target confiable, pero el
   error de duplicado ya está presente.
5. **RowDecision.** Cualquier error deja la fila `CONFLICT` (salvo algunos
   casos de ambigüedad). Por ello ambas son `CONFLICT/UNRESOLVED` aunque su
   `targetItemId` esté conocido.
6. **DTO/UI.** La API transporta `errors`, `warnings` y `targetItemId`.
   `BulkCatalogComposerPage.tsx` traduce el error a “Esta observación se
   repite dentro de la lista del proveedor”, pero renderiza el mismo control
   genérico de UUID para todo `CONFLICT`/`INVALID`.

## Clave de duplicado y firma normalizada

La detección actual no usa precio ni costo. Para cada fila considera primero
`SKU:<normalizado>` y `BARCODE:<normalizado>` si existen; además usa exactamente
una clave de memoria:

- `SUPPLIER_CODE:<normalizado>` cuando existe supplier item code; o
- `SIGNATURE:<sha256>` cuando no existe código.

La firma se calcula sobre:

```text
kind + normalized(observed title) + normalized(description)
     + normalized(category) + normalized(brand)
```

`normalizeReference()` quita diacríticos, pasa a minúsculas `es-MX` y colapsa
espacios. Precio y costo no participan en la firma. Por eso las filas v60
comparten identidad de entrada y al mismo tiempo preservan la contradicción de
valor que el operador debe decidir.

## Respuestas a las preguntas de auditoría

| Pregunta | Hallazgo |
| --- | --- |
| ¿Dónde se detecta? | En el primer recorrido de `analyze()` sobre las RowDecisions de la versión actual, antes de Memory/historia/candidates. |
| ¿Qué lo causa? | La repetición de una clave `SIGNATURE` en v60; no hay supplier code, SKU ni barcode que la distinga. |
| ¿Cómo se usa? | El set `duplicate` agrega `DUPLICATE_OBSERVATION_IN_VERSION` a todas las filas del grupo. |
| ¿Cuál es la firma? | `74872df6cd743abf00f4367624ee72d64054d3d5d475c161476a707f4cd12b04`, derivada de la identidad normalizada, no de costo/precio. |
| ¿Hay CatalogItem target? | Sí: ambas filas traen el mismo `targetItemId` histórico, activo y consistente. |
| ¿Qué pasa con historia confiable? | Antes y después de v60 la Memory correspondiente sigue `CONSISTENT`, sin correcciones, respaldada por Batch `APPLIED`; v60 no la modifica. |
| ¿Por qué ambas `CONFLICT`? | El error de duplicado se añade a las dos y la clasificación conserva `CONFLICT` aun cuando el target se pudo derivar. |
| ¿Por qué aparece UUID? | Es el control genérico para `CONFLICT`/`INVALID`; no interpreta la causa concreta del error. |
| ¿UUID resuelve la contradicción? | No. Para v60 no hay identidad que escoger: el UUID ya es conocido. |
| ¿Se puede mapear ambas al mismo item? | No mediante la UI/API actual: `decide()` rechaza una segunda RowDecision no excluida para el mismo `target_item_id`. |
| ¿Qué haría Apply? | V60 no llega a Apply: el Batch está `RECONCILING` y tiene conflictos. Si se forzaran decisiones a targets distintos, cada fila podría generar revisiones separadas; no es una resolución de la contradicción. |
| ¿Qué evita doble revisión? | La prohibición de dos decisiones activas para el mismo target evita dos revisiones del mismo item en un Batch. No ofrece elección de valores ni evita dos targets distintos incorrectos. |
| ¿Resolution/Memory cambian al analizar? | No. Se escriben sólo en Publish/Apply; v60 conserva cero Resolutions y no aprende durablemente. |
| ¿Puede crear duplicados de CatalogItem? | V60 no: no puede aplicar. En general, claves de supplier code distintas pueden evitar la firma compartida y dos filas `NEW` podrían crear dos items si no hay identidad/historia que las una; es un riesgo separado que requiere decisión explícita. |

## Clases de duplicado auditadas

| Clase | Estado actual | Resultado seguro recomendado |
| --- | --- | --- |
| **DUP-1 exact** | Dos filas con clave fuerte/firma idéntica también se bloquean ambas como `CONFLICT`. | Consolidar sólo si todos los campos materiales son iguales; conservar filas y provenance físicas. |
| **DUP-2 complementario** | Puede detectarse si comparte clave, pero no distingue “vacío original” de “valor aplicado por default”. | No fusionar automáticamente hasta tener provenance por campo o regla Owner explícita. |
| **DUP-3 contradictorio** | V60: misma identidad, distinto costo/precio; se mezcla con conflicto de identidad y ofrece UUID. | Grupo de contradicción de valores, comparación humana de filas y decisión explícita; sin UUID si el item es conocido. |
| **DUP-4 título aparente / identidad distinta** | Con supplier codes distintos se usan claves de código y pueden no agruparse aunque título/firma parezcan iguales. | Mantener separados; nunca colapsar por título. |
| **DUP-5 inducido por defaults** | El análisis ve valores efectivos; no conserva origen por campo. | Tratarlo como potencial contradicción, no como duplicado exacto. |
| **DUP-6 entre versiones** | El set se construye sólo con la versión actual; el cruce de versiones usa Memory/historia. | Mantener este comportamiento: repetición histórica no es duplicate input del snapshot actual. |

## Cobertura, payload y modos de captura

El raw payload y `SupplierListing` conservan filas físicas, número de fila y
valores observados; el raw payload tiene retención de 90 días y los listings
persisten como evidencia durable. Un grupo efectivo puede derivarse del mismo
`supplierMemoryKey` y sus filas físicas, sin borrar ni sobrescribir la entrada.

Existe una sutileza de `COMPLETE`: la cobertura construye mapas por
`supplierListingKey` y puede contar filas efectivas en vez de físicas cuando
las claves coinciden, mientras `rowCount` sigue siendo físico. Una lista de 40
filas físicas y 39 listings efectivos debe expresar ambos números, no convertir
el 39 en una eliminación silenciosa. Para `PARTIAL`, como v60, la ausencia sigue
sin autoridad.

En `FULL`, la firma reúne tipo/título/descripción/categoría/marca y excluye
precio/costo; por ello una diferencia de valores puede compartir identidad. En
`COMPACT`, SKU/barcode y supplier code son centrales y pueden separar entradas
que parecen iguales por título. Ningún modo demuestra por sí mismo que dos
filas complementarias puedan fusionarse de modo seguro.

## UX V1 conceptual — no implementado

La intervención debe estar dentro de **Review list**, no devolver al flujo
técnico Save → Analyze ni presentar una restauración de mapping como solución.
La recomendación es mixta:

- **A/B, hint local después de paste y antes de Save:** avisar una clave
  repetida evidente, sin ser autoridad y sin borrar ninguna fila.
- **D, resultado autoritativo después de Analyze:** el backend agrupa con
  contexto de identidad/historia y entrega la semántica definitiva.
- **E, presentación mezclada:** Review muestra el grupo y conserva el mismo
  camino de publicación; no agrega una etapa nueva para el operador.

Para un duplicado exacto debe decir exactamente **“1 fila duplicada detectada”**
y no bloquear si se puede consolidar de forma determinista, con valores y
provenance idénticos. Para una contradicción debe comparar filas —por ejemplo,
precio/costo—, explicar que la identidad ya es conocida y pedir una elección
humana de la observación que representará el cambio. Nunca debe mostrar UUID
cuando la identidad sea conocida. Automatizar sólo identidad conocida + valores
idénticos + resultado determinista + provenance preservada; pedir decisión ante
contradicción material; nunca elegir silenciosamente.

## Decisiones propuestas para Owner

| ID | Pregunta / actual | Evidencia, opciones y riesgo | Recomendación | Dominio / persistencia / migración | ¿Independiente? |
| --- | --- | --- | --- | --- | --- |
| **DUP-001** | ¿Un exacto bloquea Review? Hoy ambas filas son `CONFLICT`. | Bloquear todo conserva seguridad; consolidar silencioso pierde explicación; disclosure conserva ambas. | Consolidar sólo exactos con disclosure. | Semántica de análisis/read model; listings físicos actuales sirven; migración no demostrada. | Sí. |
| **DUP-002** | ¿Qué es una fila efectiva? Hoy Coverage puede colapsar claves y `rowCount` sigue físico. | Sólo físico oculta grupos; sólo efectivo oculta input. | Exponer ambos conteos. | Read model/documentación; migración no esperada. | No, ligado a DUP-001/003. |
| **DUP-003** | ¿Cómo clasificar identidad conocida + valores distintos? Hoy `CONFLICT` genérico. | V60 no tiene identidad incierta; elegir última sería pérdida silenciosa. | Causa estructurada `VALUE_CONTRADICTION_IN_VERSION`, bloqueante hasta selección humana. | Dominio/API/UI; quizá persistir grupo/decisión; migración por decidir. | No, núcleo del slice. |
| **DUP-004** | ¿Se fusionan complementarias? Hoy no hay provenance de campo. | Auto-merge inventa dato; no soportar V1 conserva seguridad. | No auto-merge en V1. | Podría requerir provenance persistida; migración no justificada aún. | Sí, diferido. |
| **DUP-005** | ¿Qué UI ve una contradicción? Hoy UUID. | UUID invita a cambiar identidad y no permite dos decisiones al mismo item. | Tarjeta de grupo con fila/costo/precio y elección explícita, sin UUID. | DTO/UI y decisión de grupo; persistencia según elección final. | No, depende de DUP-003. |
| **DUP-006** | ¿Cuándo aparece UUID? Hoy para todo `CONFLICT`/`INVALID`. | La causa se pierde en UI. | UUID sólo para conflicto de identidad sin target confiable. | API/UI; no migración si el read model estructura la causa. | Sí, tras DUP-003. |
| **DUP-007** | ¿Cómo impedir doble revisión? Hoy se prohíben dos decisiones activas al mismo target. | Dos targets erróneos siguen posibles; no se elige valor. | Una sola resolución efectiva por grupo; Apply recibe sólo valor elegido. | Invariantes de dominio/Apply; posible persistencia de grupo. | No. |
| **DUP-008** | ¿Dónde se interviene? Hoy resultado técnico post-Analyze. | Sólo pre-Save no conoce historia; sólo post-Analyze pierde ayuda temprana. | Hint local no vinculante + resultado autoritativo dentro de Review list. | UI/API existentes; sin migración para hint. | Sí para hint; no para resolución final. |

## Límites y cierre

Esta auditoría no modifica identity, matching, trusted history, Supplier
Coverage, COMPLETE/PARTIAL, defaults, payload retention, Apply ni CatalogItem.
Antes de implementar, el Owner debe aceptar o ajustar `DUP-001`…`DUP-008`, en
especial la regla de una sola resolución efectiva y la representación de una
contradicción de valores dentro del snapshot.

**DUPLICATE INPUT SEMANTICS UNDERSTOOD**  
**IDENTITY CONFLICT SEPARATED FROM VALUE CONTRADICTION**  
**DUP-1/DUP-3 IMPLEMENTATION AUTHORIZED SEPARATELY**

## UX-002A.2 implementation trace

Owner authorized only DUP-1 and DUP-3. `analyze()` now forms groups using the
existing supplier-memory identity key: supplier code when present, otherwise
the established normalized signature. It does not introduce fuzzy title
matching or a migration.

- **Exact group:** the lowest physical row number is the deterministic effective
  observation; remaining identical rows are `EXCLUDE`, carry
  `DUPLICATE_EXACT_CONSOLIDATED`, and never become a generic conflict.
- **Contradictory group:** each physical row remains `CONFLICT/UNRESOLVED` with
  `DUPLICATE_VALUE_CONTRADICTION` until the Owner chooses a known target row.
  The selected row follows existing reconciliation; siblings become traceable
  `EXCLUDE` rows with `DUPLICATE_VALUE_CONTRADICTION_SUPERSEDED` before Apply.
- **Identity conflict:** UUID mapping remains available only when the duplicate
  value reason is absent. A known duplicate never displays the UUID control.

The existing physical listings and raw payload are retained. Existing coverage
maps already use the same supplier key, so a same-identity group counts as one
effective supplier observation while received row count remains physical. No
change was made to PARTIAL/COMPLETE authority, baseline selection, Memory,
Resolution, retirement or migrations. AG `v60` remains untouched historical
evidence of the pre-UX-002A.2 behavior.
