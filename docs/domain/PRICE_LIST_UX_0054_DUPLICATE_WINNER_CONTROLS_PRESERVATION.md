# UX-005.4 — Duplicate Winner Controls Preservation

## Estado

- **PBI:** [PBI-041](../backlog/pbis/PBI-041.md).
- **Estado:** implementación local; Owner Review pendiente.
- **Alcance:** restaurar la decisión explícita de ganador para una contradicción
  duplicada sin sustituir la navegación UX-005.3. No cambia matching, policy,
  FULL/COMPACT, Coverage, Apply ni reglas de Catalog.

## Causa raíz y corrección

UX-005.3 conservó **Ir a fila N**, pero la tarjeta anterior sólo mostraba
**Usar fila N** si todas las filas tenían el mismo `targetItemId` existente.
Avicell v3 contiene dos contradicciones de primera observación: comparten una
identidad de proveedor pero no tienen todavía `CatalogItem`. Por tanto la UI
ocultaba la acción y el repositorio rechazaba la única decisión válida sin UUID.

La remediación permite una decisión sólo si el grupo contradictorio tiene una
identidad coherente: todas las filas apuntan al mismo CatalogItem existente, o
todas carecen de target y representan un único `NEW` prospectivo. En ambos
casos el operador debe elegir una fila. No hay heurística por precio, costo u
orden; un grupo mixto, UUID ajeno o una `titleDecision` incongruente falla
cerrado.

Al elegir, la transacción conserva exactamente una fila `APPLY`; sus hermanas
activas pasan a `EXCLUDE` con
`DUPLICATE_VALUE_CONTRADICTION_SUPERSEDED`. Para el caso prospectivo la ganadora
queda `NEW` sin UUID ni `titleDecision`; para un target conocido se reutiliza la
decisión de título persistida. Reanalyze conserva esa selección sólo mientras
la contradicción material permanezca igual.

## AviCell v3 — evidencia preservada

La inspección read-only del 2026-09-18 encontró Avicell `v3` en `INGESTED` /
Batch `RECONCILING`, con `744` filas físicas y `742` unidades efectivas:
`740` resueltas y `2` que requieren atención. Las dos unidades son:

- `468/469` — **Pantalla Samsung A30/A305 OLED Negro**.
- `611/612` — **Pantalla Samsung Tab S7 Fe T733**.

Sus cuatro RowDecisions siguen `CONFLICT / UNRESOLVED`, sin `targetItemId` ni
`titleDecision`; `published_at`, Resolution, Memory y audit de Avicell v3 son
nulos/cero. El Catalog conserva `45` items. Chrome con la sesión prepare de
Luis mostró para cada fila **Usar fila N** y **Ir a fila N**; la navegación a
468 reveló la fuente sin cambiar ninguna RowDecision. No se eligió ganador, no
se aplicó el lote y no cambió Catalog.

## Prueba aislada

La prueba PostgreSQL desechable creó dos observaciones contradictorias de una
identidad de proveedor nueva. Antes de la elección Apply fue rechazado. Elegir
explícitamente la primera fila sin UUID produjo una sola fila `NEW / APPLY`,
una hermana `EXCLUDE`, cero errores de contradicción y Batch `READY`. Reload y
reanalyze conservaron el resultado. La cobertura existente de target conocido
mantiene la `titleDecision` obligatoria y rechaza el antiguo payload incompleto.

Chrome repitió materialmente la decisión en `QA UX-002A Local v5`: dos filas
con la misma identidad y precios distintos produjeron una unidad de atención;
**Usar fila 1** dejó `1` resuelta y `0` de atención. Tras reload, abrir de nuevo
`v5` mantuvo el resultado. No se pulsó **Aplicar lote**, por lo que el Catalog
no recibió efecto alguno.

## UX y autorización

La tarjeta presenta cada par con acción primaria **Usar fila N** y acción
secundaria **Ir a fila N**, asociadas a la misma columna en escritorio y
apiladas sin solaparse a `640 px`. La navegación es sólo lectura; no selecciona
ganador ni crea writes. Sólo `catalog.import.prepare` muestra la decisión;
lectura y publicación sin prepare pueden inspeccionar pero no elegir. Las
versiones resueltas conservan navegación por ambas filas y se muestran en
**Resueltas** y **Todas**.

Chrome validó escritorio, `768 px`, `640 px`, claro/oscuro, Tab desde
**Usar fila 468** a **Ir a fila 468** y ausencia de overflow horizontal. No
hubo migración, CI, push, PR, merge ni deploy.

## Límites

UX-005.3 sigue siendo complementaria: **Ir a fila N** permite inspección o una
corrección sucesora explícita; no reemplaza **Usar fila N**. AviCell v3 no se
modificó porque el Owner no eligió los valores de negocio correctos.

Ese límite describe solamente la prueba UX-005.4. La publicación posterior de
v3 y su inspección de integridad read-only, sin reinterpretar esta evidencia,
se registran en
[UX-005.5](PRICE_LIST_UX_0055_AVICELL_POST_APPLY_INTEGRITY_VERIFICATION.md).
