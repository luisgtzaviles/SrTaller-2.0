# UX-005.7 — AviCell Owner Data Remediation

- **Fecha:** 2026-09-19.
- **Alcance:** remediación local de datos de Owner autorizada explícitamente;
  no cambia producto, API, schema, migraciones ni Supplier history.
- **Resultado:** **PASS — 16 grupos AviCell promovidos por dominio y la fila
  411 fue desactivada por lifecycle individual.**

## Decisión y frontera

El Owner autorizó dos operaciones proporcionadas, ambas realizadas en la UI
local mediante los endpoints de dominio existentes:

1. Resolver los 16 grupos `Brand` pendientes atribuibles a AviCell v3, creando
   una identidad canónica por grupo y religando atómicamente sus items.
2. Desactivar sólo el `CatalogItem` creado por AviCell v3 fila 411.

No se ejecutó SQL de reparación, un `bulk retire`, Apply, reanálisis, edición
de SupplierVersion, cambio de precio/costo, corrección del título `Samsugn`,
ni modificación del grupo sintético no-AviCell `Aple`.

## Brand governance ejecutada

La inspección previa encontró 16 grupos/618 items AviCell pendientes y ninguna
Brand canónica con identidad normalizada exacta. Se promovieron las propuestas
gobernadas por UX-005.6A: `Alcatel`, `Cubot`, `Google`, `Hisense`, `Honor`,
`Huawei`, `LG`, `Motorola`, `Oneplus`, `Oppo`, `Poco`, `Realme`, `Samsung`,
`Vivo`, `Xiaomi` y `ZTE`.

Cada operación usó `catalog.configuration.manage`, creó una Brand activa y su
aplicabilidad requerida, actualizó sólo los items con el pending id del grupo,
marcó ese pending como `RESOLVED` y dejó su raw label, clave normalizada y
procedencia de Supplier Listing sin reescritura. La auditoría registra 16
`catalog.brand_pending.canonical_created` con actor `Luis` y los conteos
afectados. No se usó matching fuzzy; en particular no se trató una errata como
una equivalencia de identidad.

Después de la operación, AviCell tiene **0** grupos `Brand` pendientes y **0**
items ligados a Brand pendiente. El único grupo pendiente total es `Aple`, de
un fixture sintético ajeno a AviCell, y permaneció sin modificación.

## Fila 411

El `CatalogItem` `8d465ac8-e2b5-4197-9ea1-ee7af1b624be`,
`Pantalla Samsugn A37 Original`, proveniente de AviCell v3 fila 411, tenía
precio base y costo de referencia en cero. v2/v3 conservan esa observación; un
valor distinto en v1 `DRAFT` no era una fuente comercial vigente inequívoca.
Por ello no se infirió ni copió importe alguno.

La UI de Lista de precios cambió únicamente su estado `ACTIVE → INACTIVE` con
`catalog.items.deactivate`. La operación individual es nivel 1 en la
clasificación vigente de ADR-013; no usa la capability ni el mecanismo nivel 2
de retiro masivo. Conserva identidad, revisiones de precio/costo, categoría,
Brand, identifiers, Resolution, Memory y Supplier Listing. El audit
`catalog.item.update` registra a Luis, capability, versiones `2 → 3` y el
estado anterior/final.

## Verificación material posterior

| Invariante | Resultado |
| --- | --- |
| AviCell v3 | `INGESTED`, `COMPLETE`, Batch `APPLIED`, 744 listings y hash de contenido sin cambio |
| Brand pending AviCell | 16 / 618 antes; 0 / 0 después |
| Grupo no-AviCell | `Aple` sigue pendiente y sin cambio |
| Canonical Brands | 16 nuevas, una por identidad normalizada; sin duplicados |
| Fila 411 | `INACTIVE`, Brand `Samsung`, precio/costo históricos siguen `0` |
| Precios/costos no relacionados | sin revisiones nuevas |
| Category / Branch | sin cambios |
| Supplier history | sin reescritura ni nueva versión |
| Autoridad y audit | servidor contextual, actor Luis, eventos append-only |

Esto cierra exclusivamente los dos hallazgos de datos de UX-005.5. No es
Owner Acceptance, integración, PR, merge, release ni deploy. El siguiente
paso permitido es el audit final de cierre de PBI-041.
