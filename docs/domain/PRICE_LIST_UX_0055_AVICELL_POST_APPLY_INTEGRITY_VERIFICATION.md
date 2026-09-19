# UX-005.5 — AviCell Large-List Post-Apply Integrity Verification

- **Fecha:** 2026-09-18
- **Alcance:** inspección local, PostgreSQL y Chrome estrictamente de sólo lectura.
- **Fuente / versión:** `Avicell` / `v3` (`382ec711-78c3-4a46-ba65-b1cb974c4b2a`).
- **Resultado:** **FAIL — cierre de PBI-041 bloqueado por dos hallazgos materiales; no se corrigió ni mutó dato alguno.**

## Preflight y ciclo de publicación

| Evidencia | Resultado |
| --- | --- |
| Salud local | `/livez`, `/readyz` y frontend: `200` |
| Migraciones locales | 75 aplicadas; PostgreSQL permanece `Etc/UTC` |
| Version / Batch | `INGESTED` / `APPLIED` (el Batch es la autoridad de publicación) |
| Modo / intención | `FULL` / `COMPLETE` |
| Publicación | `2026-09-18T19:26:15.110Z`, por Luis (`fe67f3c1-8794-461c-be72-7321b958000e`) |
| Linaje | v3 sucede explícitamente a v2; v1 permanece `DRAFT`, v2 `RECONCILING`, v3 `APPLIED` |

La UI local mostró `Aplicada`, `744 filas recibidas`, `Lote aplicado`, cero
atención y `742 nuevo · 2 sin cambio · 2 excluidas`. No ofrece **Aplicar
lote**, **Reanalizar** ni edición de la versión publicada. La acción visible
**Retirar artículos creados por este lote** no se ejecutó: exige
`catalog.items.bulk_retire` y ADR-013 nivel 2.

## Contabilidad material

| Concepto | Conteo | Explicación |
| --- | ---: | --- |
| Observaciones físicas | 744 | filas `1..744`, 744 `listing_id` distintos |
| Unidades efectivas | 742 | dos grupos contradictorios eligen un ganador cada uno |
| `NEW / APPLY` | 742 | cada una produjo un `CREATED` y un CatalogItem distinto |
| `UNCHANGED / EXCLUDE` | 2 | son exactamente las copias hermanas descartadas |
| Resoluciones | 742 `CREATED`, 2 `EXCLUDED` | una por observación física, sin ambigüedad |
| CatalogItems atribuibles | 742 creados; 0 actualizados; 0 reactivados | los 742 comparten el instante de publicación |
| Price / cost revisions | 742 / 742 | base Tenant; 0 revisiones de precio por Branch |
| Memory | 742 `CONSISTENT` | vinculada sólo a AviCell después de Apply |

Por tanto, el texto de UI **“2 sin cambio”** no describe dos artículos
preexistentes: son las dos observaciones físicas excluidas de los grupos
duplicados, y su exclusión es la razón de `744 - 2 = 742` resultados
efectivos.

## Duplicados y corrección de fuente

| Grupo | Ganador aplicado | Hermano excluido | Efecto persistido |
| --- | --- | --- | --- |
| filas 468/469, `Pantalla Samsung A30/A305 OLED Negro` | 469, precio `149900`, costo `58500` | 468, costo `63000` | un CatalogItem (`e6644212-…`), una resolución `CREATED`; 468 tiene `EXCLUDED` y no creó artículo |
| filas 611/612, `Pantalla Samsung Tab S7 Fe T733` | 611, precio `289900`, costo `122000` | 612, costo `197000` | un CatalogItem (`c4981b0e-…`), una resolución `CREATED`; 612 tiene `EXCLUDED` |

La fila 618 conserva su predecesora inmutable v2 con Category
`V2314 COPIA\"`, `PENDING_REFERENCE` y `UNRESOLVED`. La sucesora v3 usa
`Pantallas`, es `NEW / APPLY`, creó `25b80283-…` y conserva `VIVO` como
referencia Brand pendiente. No existe `V2314 COPIA` ni como Category canónica
ni como Category pendiente; `Pantallas` es la Category canónica usada por los
742 resultados. No hubo explosión de categorías.

## Proveedor, referencias y provenance

La procedencia de cada `CREATED` conserva Source AviCell, v3, `listing_id`,
observación física, resolución, CatalogItem y el instante de publicación. La
verificación halló 742 resoluciones, 742 CatalogItems distintos, cero enlaces
de versión erróneos y cero timestamps de creación distintos del instante de
Apply. Los 742 audit events `catalog.bulk.publish.row` son `SUCCEEDED`, usan
`catalog.import.publish`, identifican a Luis, estación y sesión, y tienen 742
resources/correlations distintos. El contexto resultante es tenant-wide:
ningún efecto está en otro Tenant; el precio se escribe como precio base y no
se inventa Branch.

Apple es el control correcto: sus 124 artículos v3 reutilizan el único Brand
canónico `Apple`, sin crear `APPLE`. Sin embargo, el contrato vigente de
captura segura crea **Brand pendiente**, no Brand canónico, para una marca
nueva. De los 742 CatalogItems creados, 124 usan Brand canónico y 618 usan
Brand pendiente. Ejemplos deduplicados: `alcatel` (1), `realme` (20),
`samsung` (203), `vivo` (21) y `xiaomi` (68), todos `PENDING` y con su
observación original preservada. Esto respeta la implementación actual de
UX-005.1, pero **no satisface el criterio de esta verificación que exigía
Brand canónico/resuelto después de Apply**.

Las muestras de filas 1, 250, 500, 618 y 744 confirman que precio y costo
efectivos coinciden exactamente con su observación ganadora. No hay creación
duplicada por identidad `kind + normalized title + category + referencia
Brand`. Pero la fila 411, `PANTALLA SAMSUGN A37 ORIGINAL`, sí permanece en v3
como `NEW / APPLY`, con `basePriceMinor = 0` y `referenceCostMinor = 0`, y
creó `8d465ac8-…`. La misma observación cero está conservada en v2. Por ello,
el cleanup de captura que debía retirar/corregir esa observación **no quedó
materializado en la sucesora publicada**. No se infiere una regla global sobre
costo cero; se registra sólo esta discrepancia trazable.

## Contratos verificados sin re-ejecutar Apply

- Apply es transaccional en el contrato PostgreSQL: la suite aislada verifica
  publicación atómica, persistencia de versiones inmutables y efectos de
  Tenant únicos. V3 no se volvió a aplicar.
- El guard de lifecycle devuelve el resultado sólo para el mismo
  `clientRequestId`/hash; una segunda publicación distinta se rechaza. La
  regresión aislada cubre esta idempotencia.
- Para una futura lista `COMPLETE`, el selector de Coverage busca el último
  `COMPLETE + APPLIED` anterior. V1 (`DRAFT`) y v2 (`RECONCILING`) no califican;
  v3 es el primer baseline autoritativo de AviCell. La UI de v3 correctamente
  informa que no existía baseline anterior.
- La caracterización conocida de 10k sigue como deuda/riesgo documentado; esta
  verificación no la reoptimiza.

## Gates ejecutados

`./scripts/pnpm-governed exec node --no-maglev --test --test-concurrency=1`
sobre contratos Bulk, modelo Composer, Coverage y autorización: **16 PASS**.
`./scripts/pnpm-governed run test:pbi041:postgresql`: **7 PASS**, 75
migraciones, contenedor desechable eliminado. Estos tests no mutaron los datos
del Owner.

## Clasificación y siguiente decisión

| Hallazgo | Clasificación | Impacto |
| --- | --- | --- |
| fila 411 aplicada con precio y costo cero pese al cleanup esperado | `DATA_INTEGRITY_BLOCKER` | requiere decisión/acción Owner separada; no se repara en UX-005.5 |
| 618 nuevas marcas quedan pending, no canónicas | `DOMAIN_ACCOUNTING_DEFECT` | contradice el criterio de aceptación canónico de esta verificación; requiere decisión de modelo, no una corrección silenciosa |

No hay discrepancia no explicada en la contabilidad `744 → 742`, duplicados,
Category, tenant scope, Resolution, Memory, audit o atomicidad. Sí quedan los
dos hallazgos anteriores, por lo que el resultado no está listo para el audit
final de cierre de PBI-041. No hubo Apply adicional, reparación de datos,
cambio de producto, push, PR, merge ni deploy.

## Remediación Owner posterior — UX-005.7

El resultado `FAIL` anterior describe el corte read-only del 2026-09-18. El
Owner autorizó después una corrección local y proporcionada por las operaciones
de dominio existentes. UX-005.7 creó y enlazó las 16 Brands pendientes AviCell
(618 CatalogItems), dejando cero grupos/ítems AviCell pendientes; `Aple`,
pendiente sintético no-AviCell, no se tocó.

La fila 411 se cambió únicamente de `ACTIVE` a `INACTIVE` con
`catalog.items.deactivate`: su precio/costo en cero siguen preservados, no se
usó el valor ambiguo de v1 `DRAFT`, ni se modificaron título, categoría,
SupplierVersion, Listing, Resolution o Memory. AviCell v3 sigue
`COMPLETE/APPLIED` con 744 observaciones y el mismo contenido publicado. La
evidencia de la mutación, audit y consultas de integridad está en
[UX-005.7](PRICE_LIST_UX_0057_AVICELL_OWNER_DATA_REMEDIATION.md).
