# UX-005.3 — Exception-to-Source Correction Navigation

## Estado

- **PBI:** [PBI-041](../backlog/pbis/PBI-041.md).
- **Estado:** implementación local; Owner Review pendiente.
- **Alcance:** navegación de excepciones a la fila física de origen y corrección
  local explícita. No cambia matching, clasificación, policy, Apply ni el
  catálogo antes de Apply.

## Contrato materializado

- Cada navegación usa `rowDecisionId`, no el número visible ni el índice de la
  lista filtrada. Al revelar la cuadrícula mantiene la fila física, incluyendo
  los pares duplicados `468/469` y `611/612` de Avicell v2.
- La navegación a un campo requerido revela **Todas** sólo cuando ese campo es
  autorizado y realmente está disponible. Un costo sin permiso nunca se revela
  ni se enfoca.
- La referencia pendiente de Avicell fila 618 ofrece **Corregir fila** y lleva
  el foco a `Categoría`; muestra el valor recibido `V2314 COPIA` sin inferir una
  categoría canónica.
- Abrir **Corregir fila** prepara una corrección únicamente en memoria. No crea
  una versión, no escribe una RowDecision, no cambia Catalog, Resolution ni
  Memory. La nueva `SupplierCatalogVersion` sucesora se crea únicamente al
  Guardar o Revisar lista de forma explícita.
- Al persistir una corrección se conserva el snapshot del padre y se liga la
  sucesora mediante `supersedesVersionId`. El Batch predecesor se marca como
  sustituido por corrección: queda visible como evidencia, pero el servidor
  rechaza Analyze, decisiones masivas/individuales y Apply sobre esa revisión.
  La sucesora conserva el flujo normal de edición, Analyze y revisión.

## AviCell v2 — prueba local sin Apply

Avicell v2 conserva 744 filas físicas, `739 NEW`, `1 PENDING_REFERENCE` y
cuatro filas de conflicto agrupadas en dos decisiones humanas. Chrome comprobó
que **Ir a fila** revela las filas 468/469 y que **Corregir fila 618** abre la
cuadrícula editable sobre Categoría con foco continuo. No se editó el valor, no
se guardó una sucesora, no se reanalizó y no se aplicó el lote.

## Regresiones

`bulk-catalog-composer-ergonomics.test.mjs` cubre identidad física, revelado de
columnas autorizado y costo protegido. La prueba PostgreSQL UX-005.3 cubre la
inmutabilidad del snapshot, la relación sucesora, el marcador de revisión
sustituida y el rechazo server-side de Apply/Reanalyze del predecesor. No se
requiere migración: el marcador es metadata del Batch ya existente, no una
nueva autoridad ni un nuevo lifecycle persistido.

## Límites

No se corrige automáticamente `V2314 COPIA`, no se crea una referencia pending
ni un CatalogItem por navegar. La corrección de negocio sigue requiriendo un
valor humano explícito y Apply sigue siendo la única operación que puede
publicar efectos de Catalog.

UX-005.4 restaura el control de decisión de duplicados como una acción distinta:
**Ir a fila N** continúa siendo navegación sin escritura y no puede elegir una
fila; **Usar fila N** conserva la decisión humana atómica. Ver
[Duplicate Winner Controls Preservation](PRICE_LIST_UX_0054_DUPLICATE_WINNER_CONTROLS_PRESERVATION.md).

La sucesora v3 se publicó posteriormente con decisiones explícitas. El estado
post-Apply, incluido el linaje preservado de fila 618, queda documentado en
[UX-005.5](PRICE_LIST_UX_0055_AVICELL_POST_APPLY_INTEGRITY_VERIFICATION.md).
