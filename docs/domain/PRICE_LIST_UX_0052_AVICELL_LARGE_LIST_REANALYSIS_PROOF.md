# UX-005.2 — Avicell large-list reanalysis and exception walkthrough proof

## Estado

- **PBI:** [PBI-041](../backlog/pbis/PBI-041.md).
- **Entorno:** localhost; PostgreSQL 18.4; Branch y Tenant locales.
- **Objeto probado:** SupplierSource `Avicell`, versión `v2`, `FULL`,
  `COMPLETE`, 744 observaciones físicas.
- **Límite:** QA/evidence only. No se ejecutó Apply, no se eligió ganador de
  duplicado, no se aceptó la sugerencia pendiente y no se modificó producto.

## Estado autoritativo posterior a UX-005.1

| Hecho | Resultado material |
|---|---|
| Version lifecycle / batch lifecycle | `INGESTED` / `RECONCILING` |
| published_at | `NULL` |
| Observaciones físicas | 744 |
| NEW | 739 |
| PENDING_REFERENCE | 1 |
| CONFLICT | 4 observaciones físicas |
| UPDATE / REACTIVATE / UNCHANGED / CANDIDATE / AMBIGUOUS / INVALID | 0 / 0 / 0 / 0 / 0 / 0 |
| Decisiones | 739 `APPLY`, 5 `UNRESOLVED` |
| Unidades efectivas | 742 |
| Resueltas / requieren atención | 739 / 3 |
| Baseline COMPLETE/APPLIED anterior | ninguno (`NO_BASELINE`) |
| CatalogItems / Resolution Avicell / Memory Avicell | 45 / 0 / 0 |

El conteo efectivo conserva todas las observaciones: los pares 468/469 y
611/612 son dos contradicciones duplicadas, por lo que cuatro observaciones se
representan como dos decisiones de atención. Así, `739 resueltas + 2 grupos de
duplicado + 1 referencia pendiente = 742`; no se perdió ninguna fila.

## Mejora material de UX-005.1

| Estado | Antes | Después | Delta |
|---|---:|---:|---:|
| NEW | 124 | 739 | +615 |
| PENDING_REFERENCE | 616 | 1 | -615 |
| CONFLICT físico | 4 | 4 | 0 |
| Atención efectiva | 618 | 3 | -615 |

Las 615 observaciones removidas de atención no se ignoraron: ahora son `NEW`
porque su Brand no canónica es capturable de forma segura como referencia
pending sólo durante Apply. Analyze conserva la provenance raw y no crea
referencias ni CatalogItems. Las filas 1 (`XIAOMI`) y 2 (`ALCATEL`) muestran
`PENDING_BRAND_CAPTURE_ON_APPLY`; la fila 3 (`APPLE`) permanece `NEW` sin ese
warning al reutilizar la Brand canónica. Esto demuestra el comportamiento para
Brand nueva y el grupo de control canónico.

## Excepciones genuinas

### Grupo duplicado: filas 468 y 469

`Pantalla Samsung A30/A305 OLED Negro` aparece dos veces con Category y Brand
iguales, pero costo/precio contradictorios: fila 468 `$630.00 / $1599.00` y
fila 469 `$585.00 / $1499.00`. Es una sola unidad de atención. La UI muestra
los dos números de fila, resalta los campos diferentes y permite expandir
detalles; ningún ganador fue elegido porque la evidencia no autoriza inferir
cuál valor comercial es correcto.

### Grupo duplicado: filas 611 y 612

`Pantalla Samsung Tab S7 Fe T733` también es una sola unidad: fila 611
`$1220.00 / $2899.00` y fila 612 `$1970.00 / $4599.00`. Los detalles muestran
ambas observaciones y sus diferencias. Ningún ganador fue elegido.

### Fila 618: Category requiere revisión

La fila contiene `PART`, título observado `PANTALLA Vivo V30 Lite / V2314
COPIA`, Category `V2314 COPIA`, Brand `VIVO`, precio `$999.00` y costo
`$365.00`. El clasificador deja correctamente `PENDING_REFERENCE` con
`REFERENCE_REQUIRES_GOVERNANCE`: la Category es un valor desplazado/malformado,
no una etiqueta de Category segura. El valor esperado visualmente puede sugerir
`Pantallas`, pero no fue inferido ni cambiado.

## Evaluación de acciones y copy

`Aceptar 1 sugerencia` invoca el bulk decision endpoint para
`PENDING_REFERENCE` con decisión `APPLY`. No crea una referencia en ese click,
pero marca la fila 618 para publicación; un Apply posterior llevaría
`V2314 COPIA` a la ruta de captura pending. Por tanto el control genérico es
**inseguro y engañoso en este contexto**: facilita publicar una Category
malformada. No fue accionado.

La tarjeta de la fila 618 explica técnicamente que «La categoría o marca
recibida requiere revisión», pero el rótulo principal `Referencia pendiente` y
los botones `Incluir` / `Excluir del lote` no explican al manager qué valor
debe corregir ni las consecuencias. Recomendación de copy futura: **Categoría
requiere revisión**, con una descripción de la causa y una acción explícita de
corrección, no aceptación masiva.

Los grupos duplicados comunican bien las dos filas y los valores contrastados,
pero la copy dice «Elige cuál fila quieres usar» mientras no hay acción
`Usar fila N` para estos artículos nuevos sin target canónico. Es una fricción
concreta: no se eligió ganador por falta de decisión de negocio, pero el flujo
debería ofrecer una elección explícita cuando el Owner sí disponga de ella.

## Corrección desde excepción a fuente

`Mostrar lista` abre la grilla y, en esta sesión, la selección previa dejó
visible la fila 618. La versión `INGESTED` es correctamente inmutable: sus
campos están disabled. La tarjeta de excepción no contiene `Ir a fila 618`, no
focaliza la celda Category y no ofrece una ruta de corrección/reanálisis sin
iniciar otra captura. Un operador no puede corregir v2 en sitio y no debe
reconstruir a mano una lista de 744 filas.

Esto es un defecto de UX, no de clasificación ni de seguridad. Se recomienda
**UX-005.3 — Exception-to-Source Correction Navigation**: enlazar la tarjeta
a la fila/celda, explicar que la versión inmutable requiere una corrección
derivada, preservar contexto y permitir reanálisis sin reconstruir la lista.
También debe corregir la affordance de elección de ganador en los duplicados
nuevos.

## Chrome material walkthrough

Chrome local mostró Avicell v2 como «En revisión», `744 filas recibidas`, los
tabs `Requieren atención 3`, `Resueltas 739` y `Todas 742`. Se inspeccionaron
ambas tarjetas duplicadas, sus detalles y la tarjeta 618; la vista Resueltas
mostró filas `NEW` de Xiaomi, Alcatel y Apple. `Mostrar lista` expuso las
filas 611, 612 y 618 y confirmó que los controles de la grilla son de sólo
lectura. No se usó `Aplicar lote`, `Aceptar 1 sugerencia`, `Incluir`,
`Excluir del lote` ni `Reanalizar versión`.

## Seguridad pre-Apply

Antes y después del walkthrough, v2 conserva `published_at = NULL`, Batch
`RECONCILING`, 45 CatalogItems y cero Resolution/Memory para Avicell. No hubo
Apply, audit de publicación, aprendizaje durable ni mutación de Catalog. Las
cinco RowDecision físicas no resueltas permanecen sin cambio; por ello no se
fuerza `READY`.

## Resultado

UX-005.1 eliminó 615 falsas excepciones de referencia sin suprimir la revisión
de datos: sólo permanecen dos decisiones comerciales por duplicado y una
Category realmente malformada. Avicell v2 está correctamente detenido antes de
Apply y requiere decisiones de negocio/corrección explícitas. La sucesora
explícita v3 se publicó después por decisión Owner; sus resultados y hallazgos
post-Apply se registran sin reescribir este proof histórico en
[UX-005.5](PRICE_LIST_UX_0055_AVICELL_POST_APPLY_INTEGRITY_VERIFICATION.md).
