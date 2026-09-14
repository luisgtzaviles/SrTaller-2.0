# Price List Bulk Composer — Versioned Supplier Catalog Design

## Estado y autoridad

- **Estado:** Discovery completo; decisiones Owner `OD-BI-001..010` cerradas y
  promovidas a arquitectura/readiness.
- **Fecha de corte:** 2026-09-13.
- **Contexto:** PBI-040 permanece en `Owner Review`; este documento no concede
  Owner Acceptance ni cambia su estado.
- **Naturaleza:** auditoría y diseño de dominio. No materializa migraciones,
  endpoints, UI, jobs ni importaciones.
- **Siguiente PBI:** PBI-041 es `Ready — implementation not authorized`; no es
  el PBI actual mientras PBI-040 permanezca en Owner Review.
- **Autoridad vigente:** decisiones `PLD-001` a `PLD-008` y `PLD-018`,
  [Arquitectura de Catálogo y Lista de precios](../architecture/PRICE_LIST_ARCHITECTURE.md),
  DEC-005, DEC-049 y ADR-004/012/013.
- **Dirección Owner incorporada:** Composer first, proveedores sin identifiers
  estables, Supplier Catalog Versions y mappings persistentes;
  `OD-BI-001..010` aprobadas.[^owner]

Este documento usa cuatro etiquetas para no convertir el legado en regla de
producto:

| Etiqueta | Significado |
|---|---|
| **Hecho histórico** | comportamiento comprobado en código/documentación de V1 o ENL |
| **Lección útil** | intención o patrón que vale conservar |
| **Deuda / riesgo** | comportamiento que produjo pérdida de control o no escala |
| **No reutilizar** | algoritmo, estructura o atajo que V2 no debe portar |

## 1. Resumen ejecutivo

La carga masiva recomendada no es un `INSERT` de Excel ni obliga al Owner a
descargar/subir archivos. Su experiencia principal es un **Bulk Catalog
Composer**: una cuadrícula dentro de SR Taller donde se pegan columnas o bloques
desde Google Sheets, se editan celdas y se revisa el resultado. Por debajo sigue
siendo un proceso de **conciliación gobernada**:

```text
clipboard/cuadrícula del Owner
  -> análisis sin escribir producto
  -> coincidencias deterministas
  -> preview antes/después
  -> decisiones humanas sólo donde hay ambigüedad
  -> publicación atómica e idempotente
  -> reporte por fila
```

La identidad sigue siendo el `CatalogItem` Tenant-wide ya creado por PBI-040.
SKU y código de barras son sus dos identificadores internos. El proveedor no
tiene que conocerlos y puede no entregar ningún código estable. Su lista es
evidencia externa versionada, no la identidad del artículo.

```text
SupplierSource
  -> SupplierCatalogVersion (fotografía inmutable de una ronda)
    -> SupplierListing (fila observada)
      -> resolución/mapping persistente
        -> CatalogItem (identidad permanente de SR Taller)
```

Un `supplierItemCode` sigue siendo útil cuando existe, pero es opcional. Cuando
no existe, SR Taller recuerda las observaciones y mappings humanos de versiones
anteriores. Una nueva ronda se compara contra la versión previa, toda la memoria
confirmada de esa fuente y el Catalog actual. Similarity y detección de cambios
sistemáticos reducen trabajo; nunca publican una identidad ambigua.

La regla que evita la mayor parte del daño histórico es:

> Un nombre parecido puede sugerir una decisión humana; nunca autoriza una
> actualización automática.

`SupplierListing("Pantalla iPhone 11 OLED (liquidación)")` puede apuntar al mismo
item que antes llegó como `Display iPhone 11 OLED` sin renombrar el
`CatalogItem("Pantalla iPhone 11 OLED")`. Los títulos del proveedor son
observaciones; no se convierten automáticamente en aliases o nombres oficiales.

Para un match confirmado, la primera entrega puede proponer cambios de precio
base y costo de referencia. Sólo crea revisiones cuando el importe cambia.
Cambios descriptivos o de clasificación aparecen como diff y requieren
confirmación explícita. Tipo, SKU y barcode de un artículo existente no cambian
por el batch: una discordancia es conflicto.

La publicación inicial recomendada es **all-or-nothing para las filas incluidas**.
Las exclusiones son decisiones visibles; no son fallos silenciosos. Parseo,
normalización y matching ocurren fuera de la transacción. El commit revalida
Tenant, capabilities, referencias, identifiers y `expectedVersion` dentro de
una transacción acotada. Si algo quedó stale, no se aplica ninguna fila.

El import modifica identidad/clasificación autorizada, precio base Tenant y
costo de referencia. **No modifica Branch overrides**. Si el base cambia de
`1399` a `1499` y Branch A conserva override `1299`, el precio efectivo de
Branch A continúa siendo `1299`; las demás Branches heredan `1499`.

La dirección de producto aprobada para este discovery es **Composer first +
adapters futuros**. CSV, XLSX o una API de proveedor podrán alimentar después el
mismo `Bulk Catalog Batch Engine`; no se construirá un segundo motor.

`OD-BI-001..010` quedan aprobadas. La continuidad usa SupplierSource + versiones
+ listings + mappings persistentes; el código del proveedor sólo participa
cuando existe. El subset estructurado esencial del listing es permanente, los
mappings históricos exactos/únicos/consistentes pueden preseleccionarse dentro
de preview y el alcance se divide en PBI-041 más un outcome avanzado posterior
sin ID, selección ni readiness.

## 2. Hallazgos SR Taller 1.0

### 2.1 Reconstrucción del flujo

**Hecho histórico.** V1 mostraba una pantalla de actualización de precios que
aceptaba nominalmente CSV/XLS/XLSX. El navegador parseaba el archivo, intentaba
reconocer productos, presentaba una tabla editable y enviaba arreglos de altas y
actualizaciones a PHP. En creación individual aceptaba título, tipo, `vendor`,
SKU, barcode, precio, costo e inventario. En bulk, el matching visual se apoyaba
principalmente en un título fuertemente normalizado y el apply terminaba
resolviendo por barcode + Tenant.[^v1]

**Hecho histórico.** Precio, costo y existencia vivían en la variante; el mismo
flujo podía crear producto y variante o actualizar ambos mediante loops. No
existía `ImportBatch`, preview durable, versión optimista por fila, idempotency
key ni publicación transaccional del lote completo.[^v1]

### 2.2 Qué funcionaba y debe conservarse

- **Lección útil:** un Owner no debe dar de alta miles de artículos uno por uno.
- **Lección útil:** preview antes de guardar y distinción visual entre nuevo y
  actualización.
- **Lección útil:** búsqueda por nombre/SKU/barcode y generación de identificador
  cuando falta.
- **Lección útil:** datos preparados externamente en Sheets; SR Taller valida y
  gobierna, sin pretender reemplazar la limpieza ni las fórmulas del Owner.
- **Lección útil:** las operaciones posteriores necesitan snapshots para no
  depender del precio vivo.

### 2.3 Deuda y errores históricos

| Área | Hecho histórico | Deuda / riesgo |
|---|---|---|
| Archivo | La UI ofrecía XLS/XLSX, pero invocaba PapaParse para todos los formatos. | Un Excel binario podía no representar lo que la pantalla prometía. |
| Contrato | La plantilla se encontraba bajo `uploads/` e ignorada por Git. | No había schema versionado ni reproducción confiable. |
| Matching | Quitaba términos/calidades del título para comparar. | OLED, LCD, original o genérica podían colisionar. |
| Apply | La clasificación visual por título y la mutación por barcode no compartían una identidad canónica. | El preview podía explicar un item y el servidor modificar otro. |
| Scope | Barcode se buscaba por Tenant mientras otras verificaciones eran Branch-like. | Riesgo de mutación cruzada entre copias por sucursal. |
| Identifiers | SKU se generaba en navegador y barcode era aleatorio. | Carreras y ninguna garantía durable Tenant-wide. |
| Verificación | El código comprobaba SKU/barcode en la raíz aunque la respuesta los anidaba en variantes. | Existentes podían clasificarse como nuevos. |
| Preview editable | Los arreglos se construían antes de editar las celdas. | Lo visible podía diferir del payload. |
| Excluir | Quitar una fila del DOM no retiraba necesariamente la intención ya guardada en memoria. | Una fila aparentemente descartada podía llegar al apply. |
| Vacíos | Valores vacíos/no numéricos se convertían a `0`. | Precio o costo podían sobrescribirse accidentalmente. |
| Atomicidad | Inserts/updates ocurrían en loops sin transacción global. | Éxito parcial difícil de detectar o reparar. |
| Errores | Filas incompletas podían omitirse con `continue`. | “Éxito” sin todas las filas esperadas. |
| Auditoría | Conteos agregados sin decisión ni diff por fila. | Imposible explicar quién cambió qué y desde qué archivo. |
| Seguridad | Datos del archivo se interpolaban en HTML. | Superficie de contenido activo/XSS. |
| Nomenclatura | `vendor` significaba según la pantalla departamento, tipo o proveedor. | No había frontera Category/Brand/Type/Supplier. |

### 2.4 No reutilizar

- Normalizar quitando palabras comerciales o técnicas.
- “Mismo título = actualizar”.
- Identifiers generados o validados sólo en browser.
- Barcode aleatorio sin constraint Tenant-aware.
- Loops de endpoints CRUD por fila.
- `float` o conversión silenciosa de vacío a cero.
- Preview cuyo estado vive sólo en el DOM.
- Éxito parcial o `continue` sin outcome explícito.
- El campo multiuso `vendor`.

Las rutas V1 auditadas están hoy detrás de `sr_legacy_module_blocked`; son
evidencia, no una capacidad que V2 pueda invocar.[^v1]

## 3. Hallazgos ENL

### 3.1 Lo que existe

**Hecho histórico.** En el SHA auditado de ENL no se encontró un importador de
catálogo/precio por CSV/XLS/XLSX en el árbol ni en referencias Git alcanzables.
ENL no ofrece un motor bulk para portar.[^enl]

**Hecho histórico.** ENL separa `products`, `services` y `product_stock`. El stock
sí se guarda por sucursal; costo y precio viven en producto/servicio. Las líneas
de orden y venta guardan snapshots. Compras registra recepción e historia de
costo, y una excepción de precio en OT conserva actor, razón y procedencia.[^enl]

### 3.2 Patrones útiles

- **Lección útil:** identidad del producto separada de stock por sucursal.
- **Lección útil:** líneas operativas con nombre/precio/costo snapshot.
- **Lección útil:** cambios excepcionales de precio con capability y razón.
- **Lección útil:** costo con fuente e historia, no sólo una celda mutable.
- **Lección útil:** recepción y movimientos dentro de una operación
  transaccional.

### 3.3 Deuda y límites

- **Deuda / riesgo:** producto y servicio tienen identidades/queries distintas;
  una Lista de precios unificada necesita un adaptador paralelo.
- **Deuda / riesgo:** precio/costo globales con stock local. Una compra local
  puede afectar el costo de referencia visto por todas las sucursales.
- **Deuda / riesgo:** Brand/Category son texto y la sincronización de categoría
  puede tolerar errores.
- **Deuda / riesgo:** `product_type` mezcla reventa, insumo y uso operativo.
- **Deuda / riesgo:** `vendor_name` no es un Supplier ni una relación estable
  proveedor-artículo.
- **No reutilizar:** tablas concretas o actualización de costo global como modelo
  multisucursal.
- **No reutilizar:** inferir que la ausencia de un importador es autorización
  para construir un script lateral.

ENL aporta patrones downstream; no resuelve staging, matching, idempotencia,
reconciliación ni publicación masiva.

## 4. Estado SR Taller 2.0 que el import debe respetar

PBI-040 ya materializa una frontera más fuerte que ambos legados:[^v2]

| Contrato actual | Consecuencia obligatoria para bulk |
|---|---|
| `CatalogItem` e identifiers Tenant-wide | todas las búsquedas y constraints incluyen Tenant; nunca se clona por Branch |
| Tipos `PART/PRODUCT/SERVICE/SUPPLY` | el input usa labels Owner; el servidor mapea a valores controlados |
| SKU y barcode internos obligatorios después de crear | vacíos en alta se generan server-side; sólo esos dos esquemas existen |
| Category `Tenant + Type + normalizedName` | exacta activa se reutiliza; nueva captura se consolida como pending |
| Brand `Tenant + normalizedName`, aplicabilidad multi-Type | exacta activa se reutiliza; puede ampliar aplicabilidad de forma auditada |
| Pending reference con raw label/usage/history | bulk no crea canon oculto ni una cola paralela |
| Canonical merge/safe delete/lifecycle | import no fusiona, elimina ni reactiva referencias implícitamente |
| Base price append-only | un cambio real crea revisión y conserva el anterior |
| Branch override append-only | queda fuera del target del primer import |
| Reference cost opcional/protegido | fuente `IMPORTED`, batch, supplier observation y fecha deben quedar trazables; jamás se filtra sin capability |
| `expectedVersion` y command idempotency | cada intención incluida se prepara con versión y se revalida al publicar |
| commit guards de Access | sesión/capabilities se revalidan dentro de la transacción |
| audit con Tenant/Branch/Station/User/Session/correlation | la publicación no reduce atribución por ser masiva |

La auditoría identificó cinco reconciliaciones necesarias antes de PBI-041.
Todas quedaron resueltas/promovidas el 2026-09-13; se preserva la lista como
trazabilidad del cambio:

1. El backlog aún dice `barcode/GTIN`; la decisión posterior de PBI-040 eliminó
   GTIN/EAN/UPC. PBI-041 debe decir sólo SKU y barcode interno. Supplier code,
   cuando exista, pertenece a una observación/source mapping, no a
   `ItemIdentifier`.
2. El read model admite costo con fuente `IMPORTED`, pero los commands públicos
   actuales de alta/cambio sólo aceptan `MANUAL`, `ESTIMATED` y `THIRD_PARTY`.
   Bulk necesita un command interno propiedad de Catalog que acepte
   `IMPORTED` con batch/fila; no debe falsear la fuente como manual.
3. `CatalogItem.version` cubre item, precio, costo y override. Invocar tres
   endpoints secuenciales para una fila se volvería stale contra sí mismo y
   perdería atomicidad. Bulk necesita **una intención de aplicación por item**,
   validada una vez y ejecutada dentro del publish de Catalog.
4. La arquitectura permite `[BORRAR]` para costo, pero el modelo actual sólo
   agrega revisiones con monto. Para retirar costo se requiere un contrato
   append-only `REVOKE`/tombstone equivalente al override. No debe simularse con
   cero ni con borrado físico.
5. La arquitectura actual reduce continuidad a `ImportSource +
   supplierItemCode` y trata `ImportBatch` como archivo/decisión. La evidencia
   Owner exige separar `SupplierSource`, `SupplierCatalogVersion`,
   `SupplierListing`, mapping persistente y `CatalogUpdateBatch`; el código de
   proveedor es sólo una señal opcional.

## 5. Qué reutilizar obligatoriamente

- `CatalogItem.itemId` opaco como identidad canónica.
- Normalizadores y constraints Tenant-aware de SKU/barcode.
- Generadores server-side y secuencias actuales para creates sin identifier.
- La identidad exacta y locks de Category/Brand.
- El mismo resolvedor de canon activo vs captura pending usado por alta/edición.
- Aplicabilidad Type→Category y Type→Brand; no una matriz propia del grid o archivo.
- `CatalogItem.version`, `expectedVersion` y respuesta stale no reveladora.
- Revisión append-only de precio/costo, currency del Tenant y minor units.
- Precedencia base Tenant → override Branch.
- Capabilities y commit guards server-side.
- Audit con actor, Station, Session y correlation.
- Ownership `catalog`: el import no obtiene acceso directo a tablas de otros
  módulos ni expone repositorios públicos.
- El historial de decisiones Owner y el mismo resolver de CatalogItem; la nueva
  memoria de proveedor agrega evidencia, no una segunda identidad comercial.

## 6. Qué no reutilizar o no convertir en atajo

- Los endpoints UI individuales como un loop de miles de requests.
- Título normalizado como identificador.
- Crear Category/Brand canónicas durante parseo.
- Escribir catálogo, precio o costo durante preview.
- Reemplazar silenciosamente SKU/barcode aportados.
- Transformar ausencia en el lote en `INACTIVE`.
- Tocar Branch overrides al actualizar el base Tenant.
- Persistir costos o mostrarlos sin capability porque “venían en el clipboard”.
- Escribir Inventory, Procurement, Repairs, Sales/Caja o Reporting.
- Reutilizar GTIN/EAN/UPC o “código interno” como tercer identifier.
- Convertir cada título observado en un alias canónico o buscar listings como si
  fueran artículos operativos.
- Sobrescribir una versión anterior del proveedor con la ronda nueva.

## 7. Experiencia de entrada: Bulk Catalog Composer

### 7.1 Comparación de alternativas

| Dimensión | Opción A — Template + upload | Opción B — Composer únicamente | Opción C — Composer first + adapters futuros |
|---|---|---|---|
| UX diaria | pasos de descargar, editar, exportar y subir | copiar/pegar/editar sin salir de SR Taller | misma fluidez del Composer; archivos sólo cuando aporten valor |
| Complejidad inicial | parser, storage temporal, mapping y compatibilidad | grid accesible, clipboard y batch engine | Composer + batch engine ahora; adapters reutilizan el engine después |
| SaaS scalability | buen transporte de lotes muy grandes | excelente para trabajo interactivo; requiere virtualización/límites | permite optimizar cada adapter sin duplicar dominio |
| Governance | validación diferida hasta upload | feedback temprano junto a Category/Brand vigentes | misma autoridad server-side para todos los inputs |
| Recuperación | corregir archivo y reimportar | corregir celdas/decisiones en el draft | ambos caminos convergen al mismo draft/batch |
| Actualización de proveedor | archivo natural, pero obliga a mapping | modo compacto identifier/costo/precio | paste compacto primero; archivo/API después |
| Integraciones futuras | riesgo de hacer del formato el dominio | sin entrada automatizada | API/CSV/XLSX alimentan el mismo modelo canónico |

**Decisión:** Opción C, conforme a la dirección Owner. El
Composer es la experiencia primaria; el núcleo se llama conceptualmente `Bulk
Catalog Batch Engine`. CSV/XLSX son adapters futuros, no una arquitectura
paralela ni una dependencia para el flujo normal.

**Reconciliación posterior:** la sección 10 de arquitectura y PBI-041 ya fueron
actualizados por autoridad Owner a Composer first + adapters futuros. Este
discovery no implementa ni inicia el PBI.

### 7.2 Tres modos sobre el mismo engine

**Agregar artículos** muestra el grid completo. El Owner puede pegar una o varias
columnas o un rectángulo desde Sheets, editar y completar:

| Columna | Create | Update | Regla |
|---|---|---|---|
| Tipo | requerida | match/validación | Refacción, Servicio, Producto o Insumo; no cambia un item existente |
| Título | requerido | diff revisable | display preservado; nunca identidad automática |
| Descripción | opcional | blank=no change | `[BORRAR]` la limpia |
| Categoría | requerida | diff revisable | canon activo compatible o captura pending explícita |
| Marca | opcional | diff revisable | canon activo compatible, captura pending o `[BORRAR]` |
| SKU | opcional | match-only | vacío genera en create; discordancia en existente es conflicto |
| Código de barras | opcional | match-only | vacío genera en create; discordancia en existente es conflicto |
| Precio base | requerido | blank=no change | decimal exacto no negativo; `0` es explícito |
| Costo de referencia | opcional | blank=no change | sólo si actor autorizado; no permite clear en el primer slice |
| Código del proveedor | opcional | match | sólo dentro del `SupplierSource`; nunca requerido ni Catalog identifier |

**Actualizar precios** muestra una vista compacta con `Identifier`, `Costo de
referencia` y `Precio base`. `Identifier` acepta SKU, barcode, código del
proveedor o un listing/mapping de la versión seleccionada. Si el proveedor no
tiene código, el target se obtiene de la memoria de reconciliación y conserva
explicación. Los campos ausentes significan **sin cambio**.

**Nueva versión de proveedor** comienza por seleccionar/crear el
`SupplierSource`, mostrar la última versión vigente, declarar la nueva ronda y
pegar su lista. No exige identifier. El Composer congela una versión de fuente,
compara sus listings con versiones anteriores/mappings/Catalog y crea después
una o más propuestas de `CatalogUpdateBatch`.

```text
Fuente:            Proveedor X
Versión anterior:  Septiembre 2026
Nueva versión:     Octubre 2026

1,500 listings observados
1,215 mappings históricos exactos
173 matches probables
62 nuevos
31 ambiguos
19 patrones sistemáticos detectados (métrica transversal, no filas adicionales)
```

El Owner revisa primero patrones, ambiguos, nuevos y conflictos. Los mappings
históricos exactos permanecen inspeccionables y se confirman al aplicar el batch,
no mediante 1,215 clics individuales si OD-BI-009 lo aprueba. Los tres modos
convergen en el mismo análisis y publicación Catalog.

No se exponen UUIDs. Un futuro export de SR Taller puede portar un `itemId`
protegido como señal adicional, pero el Composer ordinario y los datos del
proveedor no dependen de detalles internos.

### 7.3 Interacción de cuadrícula

El Composer es captura tabular especializada, no una hoja de cálculo completa:

- selección de celda y rango;
- edición directa;
- `Tab`/`Shift+Tab`, flechas y `Enter` con comportamiento documentado;
- paste de una celda, columna, múltiples columnas o rectángulo TSV;
- paste vertical de `480 / 520 / 620` desde la celda inicial de Costo;
- fill/down explícito para valores repetidos, con undo antes de publish;
- agregar/quitar filas del draft;
- errores por celda y estado/resumen por fila;
- navegación, foco y announcements accesibles, además de virtualización sin
  perder posición/selección.

No calcula fórmulas ni ofrece gráficos, macros, worksheets, merged cells,
formatos arbitrarios o pivot tables.

Ejemplo: al copiar seis columnas y tres filas desde Sheets, el Owner selecciona
la primera celda compatible y pega el rectángulo:

```text
REFACCIÓN  Pantalla iPhone 11 OLED  Pantallas  Apple  1399  480
REFACCIÓN  Pantalla iPhone 12 OLED  Pantallas  Apple  1499  520
REFACCIÓN  Pantalla iPhone 13 OLED  Pantallas  Apple  1699  620
```

El Composer muestra el mapping de esas seis columnas antes de distribuirlas. Si
después copia sólo `480`, `520`, `620` sobre Costo, aplica el vector vertical a
partir de la celda seleccionada y conserva el before/after por fila.

Un paste que exceda el rango crea las filas necesarias hasta el límite. No
trunca ni desplaza datos ocultamente. Antes de aplicar muestra dimensiones y
errores. Clipboard se interpreta como texto plano tab/newline; HTML, fórmulas y
formatos visuales no se ejecutan. Las comillas, tabs y saltos dentro de celdas
siguen un parser documentado y los valores originales quedan disponibles en el
diff.

El browser puede dar feedback inmediato de formato, pero la clasificación
visible queda marcada como provisional hasta recibir la validación server-side.
El estado del grid se autosalva como draft versionado de Supplier Version o
Catalog Update Batch según el modo; no vive sólo en el DOM.

### 7.4 Controles Catalog-aware

- **Tipo:** lista cerrada. Insumo se puede administrar/importar, pero no aparece
  en la Lista de precios comercial.
- **Category:** selector de canónicas activas compatibles con Type y entrada de
  texto para proponer una captura pending.
- **Brand:** canónicas activas aplicables al Type y entrada pending. La lista es
  ayuda;
  no constituye una relación Category→Brand de dominio.
- **Estado progresivo:** `NEW`, `UPDATE`, `UNCHANGED`, `PENDING REFERENCE`,
  `CONFLICT` o `INVALID`, con razón visible como `MATCH BY SKU`.
- **Resolución inline:** Associate existing, Create canonical o Leave pending se
  guardan como intención del batch. Crear canon/pending no escribe producto hasta
  publish y usa los mismos locks/constraints de PBI-040.

### 7.5 Adapters CSV/XLSX futuros

Un adapter futuro carga sus filas en un Composer draft para que el Owner use el
mismo preview, resolution y commit. No publica por su cuenta.

Si se ofrece template, será XLSX sin macros con `Datos`, `Ayuda` y `Catálogos`,
`schemaVersion`, moneda y snapshot de referencias. CSV será UTF-8 values-only.
Excel y Google Sheets soportan dropdowns basados en rangos, pero no preservan de
forma idéntica toda validación avanzada al convertir archivos. Por eso esos
dropdowns son ayuda; Catalog valida nuevamente. Véanse las guías oficiales de
[Microsoft Excel](https://support.microsoft.com/en-us/excel/get-started/create-a-drop-down-list),
[Google Sheets](https://support.google.com/docs/answer/186103?hl=en-GB) y
[compatibilidad Sheets/Excel](https://support.google.com/docs/answer/9331167?hl=en).

SR Taller no ejecuta fórmulas de la hoja. La vía más segura desde Google Sheets
es copiar valores al Composer o CSV de valores. Si se acepta XLSX con celdas de fórmula, el parser usa
únicamente el valor cacheado y marca la fila para advertencia; fórmulas sin valor
cacheado son inválidas. Macros, archivos cifrados y vínculos externos se
rechazan. Los reportes CSV escapan celdas que empiecen con `=`, `+`, `-` o `@`
para no introducir fórmulas al abrirlos.

## 8. Matching strategy

### 8.1 Cuatro universos de comparación

Una nueva fila se compara, siempre dentro del mismo Tenant, contra:

1. la versión previa de ese `SupplierSource`;
2. todas las observaciones históricas confirmadas de esa fuente;
3. la proyección vigente de mappings fuente→`CatalogItem`;
4. el Catalog actual, incluidos identifiers y lifecycle.

No se usa el orden físico de la fila, filename, costo ni precio como identidad.
Una posición parecida puede ayudar a revisar, nunca a mapear.

### 8.2 Jerarquía de señales

1. `itemId` sólo en export confiable generado por SR Taller.
2. SKU interno o barcode interno exactos, cuando el Owner los haya agregado a
   su Sheet.
3. `SupplierSource + supplierItemCode` exacto y previamente confirmado, cuando
   el proveedor sí entregue código.
4. Firma exacta de una observación anterior cuyo historial confirmado apunta de
   forma consistente a un solo `CatalogItem` activo.
5. Continuidad estructural determinista contra la versión anterior: Type y
   atributos identity-bearing compatibles, sin contradicción de identifiers ni
   mappings.
6. Transformación sistemática o similitud estructural como sugerencia colectiva.
7. Type + Category/Brand hints + título normalizado contra Catalog como candidato
   humano.

No se decide por “la primera señal que aparezca”. Todas las señales fuertes
presentes deben resolver al **mismo item**. Si dos apuntan a items distintos, la
fila es `CONFLICT`. Las señales 5–7 nunca publican un mapping sin confirmación.

La firma de observación se construye con campos de identidad de fuente
normalizados y versionados; excluye costo, precio calculado, fila, filename y
tags clasificados como transitorios. Cambiar el algoritmo crea una nueva versión
de firma: no reinterpreta silenciosamente historia.

### 8.3 Cambios sistemáticos

El sistema alinea primero pares ya conocidos por código o mapping confirmado y
busca transformaciones repetidas en el resto. No empieza por un regex global.

```text
825 de 900 pares ancla:
  versión A comienza con "Display"
  versión B comienza con "Pantalla"
  modelo/calidad restante coincide
  contradicciones observadas: 0

Sugerencia de esta versión:
  Display -> Pantalla
  173 listings candidatos
```

La explicación muestra población, cobertura, excepciones y una muestra. El
Owner puede aceptar el grupo para esa versión, reducir su alcance o revisar
fila por fila. La regla no se vuelve global ni renombra Catalog. Cada mapping
aceptado se registra individualmente; ese historial, no el regex, es el
aprendizaje durable.

### 8.4 Tags transitorios de proveedor

| Clase sugerida | Ejemplos | Efecto |
|---|---|---|
| `IDENTITY_BEARING` | OLED, Incell, capacidad, modelo; `original` si distingue calidad real | permanece en firma/candidato; quitarlo podría fusionar artículos |
| `SOURCE_METADATA` | liquidación, oferta, últimas piezas, promo; `nuevo` cuando sólo significa novedad de la ronda | se conserva como observación; puede excluirse de firma sólo tras confirmación |
| `AMBIGUOUS` | original, premium, nuevo u otra palabra cuyo significado dependa de la fuente | requiere decisión; no se quita ni incorpora automáticamente |

`(liquidación)` puede sugerirse como metadata transitoria, pero la primera vez
necesita confirmación. La decisión se limita a esa fuente/versión o patrón
explícitamente seleccionado; nunca se convierte sola en regla global. El texto
raw permanece en la observación.

### 8.5 Clasificaciones

| Resultado | Condición | Acción |
|---|---|---|
| `EXACT_MATCH` | identifiers/source code o firma histórica consistente resuelven al mismo item y nada contradice | preseleccionar target y calcular diff |
| `PROBABLE_MATCH` | sin señal fuerte; un candidato claro por Type + referencias + título normalizado | decisión humana: vincular o crear |
| `AMBIGUOUS_MATCH` | dos o más candidatos razonables o señales incompletas | bloquear hasta elegir/excluir |
| `NEW` | ninguna señal fuerte ni candidato útil | proponer create |
| `DUPLICATE_INSIDE_BATCH` | fingerprint/key repetida dentro de la versión/batch | ninguna fila gana por orden; resolver/excluir |
| `INVALID` | tipo, importe, identifier o campo inválido | corregir o excluir |
| `CONFLICT` | señales fuertes divergen, Type difiere, identifier intenta cambiar, scope/lifecycle incompatible o versión stale | corregir/reconciliar; no auto-apply |
| `NO_CHANGE` | match exacto y diff efectivo vacío | publicar no crea revisiones |

### 8.6 Respuestas a los casos Owner

| Caso | Resultado recomendado |
|---|---|
| Mismo SKU; costo `480→520` | exact match; nueva revisión de costo `IMPORTED` si hay capability y confirmación |
| Mismo título; distinto SKU | no actualizar; `NEW` con alerta de posible duplicado o `PROBABLE_MATCH` humano |
| Mismo SKU; título diferente | match del item; título aparece como diff descriptivo a confirmar; Type distinto sería conflicto |
| Mismo barcode; SKU diferente | `CONFLICT`; no reemplazar identifier ni escoger uno |
| `Pantalla iPhone 11 OLED` vs `Pantalla Iphone 11 Oled` | mismo valor de comparación; sin signal fuerte sólo candidato humano; no auto-update |
| OLED vs Incell | artículos/candidatos distintos; la normalización no elimina la calidad |
| Una fila coincide con más de un item | `AMBIGUOUS_MATCH` o `CONFLICT`; exige selección humana/exclusión |
| `Display iPhone 11 OLED` → `Pantalla iPhone 11 OLED` en muchas filas | patrón explicado y propuesta grupal; Owner confirma; no renombra Catalog por defecto |
| `Pantalla iPhone 11 OLED (liquidación)` | sugerir tag de source metadata; mantener mapping sólo tras historia exacta o confirmación |

Dos filas con la misma clave y contenido idéntico siguen siendo duplicado
visible. La UI puede ofrecer “excluir duplicados exactos”, pero nunca elegir la
última fila. Si comparten clave y difieren en precio/costo/título, es conflicto.

### 8.7 Aprendizaje permitido

| Conocimiento | Reuso en ronda futura |
|---|---|
| supplier code único confirmado | match exacto preseleccionado; batch-level confirmation |
| firma exacta observada varias veces y siempre mapeada al mismo item | match histórico preseleccionado si target sigue activo y sin contradicción |
| mapping corregido por Owner | sólo la resolución vigente se propone; historia anterior permanece auditable |
| transformación sistemática confirmada | sus mappings individuales ayudan; la transformación vuelve a ser sugerencia, no regla automática |
| similitud/fuzzy | ordenar candidatos y agrupar; confirmación obligatoria |
| title/tag del proveedor | evidencia de fuente; nunca alias o rename canónico automático |

Incluso un match histórico exacto no publica solo: queda incluido en el preview y
requiere `APLICAR CAMBIOS` con autorización. Target inactivo, historia que apunta
a varios items, cambio de Type, identifier contradictorio o nueva clasificación
de tag degradan el resultado a conflicto/confirmación.

En la primera lista de 1,500 filas sin códigos, cada fila válida no coincidente
se propone como `NEW`; duplicados de firma quedan bloqueados y candidatos contra
Catalog requieren decisión. Al commit, Catalog genera SKU/barcode server-side y
se guarda listing→nuevo item. En la segunda ronda, esa relación —no el título
canónico— evita volver a crear los mismos 1,500 artículos.

## 9. Normalization strategy

Se mantienen tres valores separados:

| Capa | Propósito | Ejemplo |
|---|---|---|
| `rawValue` | evidencia exacta de la celda | `  Pantalla  iPhone 11 OLED ` |
| `comparisonValue` | búsqueda/detección | `pantalla iphone 11 oled` |
| `displayValue` | valor aceptado para Catalog | `Pantalla iPhone 11 OLED` |

En Supplier Catalog existen además dos destinos distintos:

- `supplierObservedValue`: lo que esa fuente dijo en esa versión; no cambia
  aunque el Catalog se renombre;
- `catalogProposedValue`: cambio que el Owner podría aplicar al item; inicia
  vacío y nunca se deriva automáticamente del título del proveedor.

Para comparación se reutiliza la normalización PBI-040: NFD, quitar diacríticos,
case-fold español, colapsar whitespace y trim. No hay stemming, singularización,
traducción ni eliminación de palabras. `Pantalla` y `Pantallas`, OLED e Incell
siguen siendo distintos.

Para display se recorta y colapsa whitespace, pero se preservan casing,
puntuación y términos técnicos. La regla Owner “primera letra de cada palabra”
**no debe aplicarse automáticamente**, porque produciría `Iphone`, `Ipad`,
`Usb-c`, `Oled`, `Amoled`, `Esim`, `5g` o alteraría `Galaxy A15`. Puede existir
una sugerencia visual no destructiva; el valor sólo cambia si el Owner la acepta.

Descripción conserva el texto y sólo normaliza espacios de borde. Una sugerencia
de mayúscula inicial puede mostrarse cuando sea inequívoca, pero no debe alterar
listas, acrónimos, URLs, códigos ni saltos de línea automáticamente.

Las firmas de Supplier Listing usan normalización propia versionada y decisiones
de tags. No modifican `normalizeCatalogText` ni agregan aliases a Catalog. Así,
el motor puede recordar que tres expresiones de Proveedor X terminaron en el
mismo item sin hacer que cualquier usuario que escriba “liquidación” encuentre
o renombre ese artículo en Lista de precios.

## 10. Integración con pending references

Un valor nuevo no crea canon durante parseo ni durante preview:

```text
"Pantallas Premium" en 300 filas
  -> un normalized key Tenant + Type
  -> una propuesta de captura pending
  -> usageCount proyectado = 300
  -> decisión explícita del Owner
  -> al publicar, una sola pending reference compartida por los items
```

La constraint/lock actual de PBI-040 vuelve a consultar canon activo justo antes
de crear pending. Si otro usuario creó `Pantallas Premium` entretanto, publish
reutiliza el canon exacto compatible o queda stale para una nueva revisión; no
crea el duplicado.

Se deben separar dos conceptos en los conteos:

- `unresolvedDecisionCount`: filas que todavía no pueden publicarse. Debe ser 0.
- `pendingReferenceCreationCount`: referencias `Por revisar` que el Owner eligió
  conscientemente crear. Puede ser mayor que 0 conforme `OD-BI-004 Approved A`.

`Resolver`, `Associate existing`, `Create canonical`, `Canonical Merge`, safe
delete y lifecycle permanecen en la superficie gobernada de Catalog. El import
sólo captura o vincula; nunca hace merge ni borra referencias.

## 11. Update semantics

Ingerir una nueva `SupplierCatalogVersion` sólo agrega evidencia inmutable. No
actualiza Catalog. El `CatalogUpdateBatch` posterior contiene las decisiones
aplicables. Por ello pueden coexistir:

```text
Supplier Listing:  Pantalla iPhone 11 OLED (liquidación), costo observado 390
CatalogItem:       Pantalla iPhone 11 OLED
ReferenceCost:     510 hasta que el Owner decida publicar 390
BasePrice:         1499, calculado/decidido por Avicell
```

### 11.1 Matriz por campo

| Campo | Create | Existing exact match |
|---|---|---|
| Type | requerido | inmutable; diferencia = conflicto |
| Título | requerido | por default no cambia desde Supplier Listing; sólo diff Catalog explícito conforme OD-BI-002 |
| Descripción | opcional | blank=no change; valor=update; `[BORRAR]`=null |
| Category | requerida/canon o pending | cambio explícito compatible; blank=no change; no se borra |
| Brand | opcional/canon o pending | cambio explícito; blank=no change; `[BORRAR]`=null |
| SKU | opcional; server genera | match-only; no se regenera ni reemplaza |
| Barcode | opcional; server genera | match-only; no se regenera ni reemplaza |
| Precio base | requerido | blank=no change; valor distinto=nueva revisión; igual=no-op |
| Costo | opcional | blank=no change; distinto=nueva revisión; igual=no-op; clear diferido por OD-BI-005 A |
| Status | `ACTIVE` | no está en el primer Composer; ausencia nunca inactiva |

Una nueva lista de proveedor no es una foto autoritativa del catálogo completo.
Que un item ya no aparezca **no** lo inactiva ni elimina.

### 11.2 Caso principal

```text
Antes
  costo de referencia: 480 (revisión C10)
  precio base:          1399 (revisión P20)

Catalog Update Batch B42
  costo:                520
  precio:               1499

Después de publish
  costo vigente:        520 (nueva revisión C11, source IMPORTED, batch B42)
  precio base vigente:  1499 (nueva revisión P21, batch B42)
  C10 y P20:            conservadas
```

Actor, Tenant, Station, Session, correlation, batch, fila y `expectedVersion`
quedan registrados. Si un importe es idéntico al vigente, no se crea una
“revisión falsa”.

### 11.3 Tres historias de costo, no una

| Concepto | Significa | Owner | Alcance de PBI-041 candidato |
|---|---|---|---|
| `SupplierObservedCost` | monto que una fuente listó en una versión | Catalog sólo como evidencia de mantenimiento | ingerir, proteger, comparar y poder proponerlo |
| `ReferenceCostRevision` | referencia interna que Avicell decidió usar | Catalog/Pricing | publicar explícitamente desde el batch, con source version/listing |
| `ProcurementPurchaseCost` | costo real de orden/recepción/valuación | Procurement/Inventory futuros | fuera de alcance |

```text
CatalogItem #8421 — Proveedor X
Ago: 480  Sep: 520  Oct: 510  Nov: 390 (liquidación)
```

Esa serie no cambia por sí misma el ReferenceCost. El Owner puede seleccionar
`510` en octubre y no publicar `390` en noviembre si liquidación no representa
su referencia operativa. PBI-041 necesita conservar procedencia suficiente para
esa decisión; comparación avanzada entre proveedores, alertas, tendencia,
margen y compras quedan diferidos.

## 12. Supplier version y Catalog update pipeline

Una fotografía externa y una decisión interna tienen lifecycles distintos.

### SupplierCatalogVersion

```text
DRAFT (Composer autosave)
  -> INGESTING (validar + normalizar + fingerprint)
  -> INGESTED (fotografía inmutable)

DRAFT/INGESTING -> CANCELLED o FAILED
INGESTED --corrección posterior--> SUPERSEDED por otra versión inmutable
```

`INGESTED` no significa reconciliado ni aplicado. Una corrección de octubre no
edita “Octubre v1”: crea “Octubre v2”, apunta `correctsVersionId` a v1 y conserva
ambas. La versión puede calcular continuamente conteos de mapped/probable/new/
ambiguous, pero esos conteos son proyección, no su identidad.

### CatalogUpdateBatch

```text
DRAFT (selección de listings + propuestas Owner)
  -> ANALYZING (match + classify + diff)
  -> RECONCILING
  -> READY
  -> COMMITTING
  -> COMPLETED

DRAFT/ANALYZING/RECONCILING/READY -> CANCELLED
ANALYZING --fallo--> FAILED
COMMITTING --fallo técnico--> FAILED (cero writes de producto)
COMMITTING --stale--> RECONCILING (recalcular preview)
```

Una Supplier Version puede alimentar cero, uno o varios Catalog Update Batches:
por ejemplo, aplicar hoy filas resueltas y crear después otro batch con las
excluidas. Un batch puede también nacer de alta manual/compacta sin Supplier
Version. La primera entrega no necesita combinar varias versiones en un solo
batch; se conserva una relación explícita listing→row decision, no una supuesta
relación 1:1.

El browser puede cerrar después de pegar/editar. Ambos drafts conservan estado
versionado y el análisis es reanudable/idempotente. Un adapter futuro termina
creando el mismo Supplier Version o batch; no publica por su cuenta.

Nada antes de `COMMITTING` escribe `CatalogItem`, referencias, precio ni costo.
`READY` significa: todas las filas incluidas resueltas, capabilities aplicables
conocidas y preview vigente. No significa publicado.

## 13. Dry-run / preview

La cabecera muestra:

- total de Supplier Listings o filas de datos;
- mappings históricos reconocidos;
- persistieron/desaparecieron/nuevos/cambiaron contra versión previa;
- probable renames y patrones sistemáticos detectados;
- nuevos;
- actualizaciones;
- sin cambios;
- pending references que se crearían;
- decisiones sin resolver;
- duplicados dentro del batch;
- conflictos;
- inválidos/errores;
- exclusiones explícitas;
- items afectados que tienen Branch overrides.

Cada fila permite ver raw value, valor normalizado, target propuesto, por qué
coincidió, versión leída y before/after por campo. Los costos sólo existen en esa
respuesta si el actor tiene capability vigente. Filtros permiten resolver por
grupo: por ejemplo, las 300 filas que comparten `Pantallas Premium` usan una sola
decisión de referencia, pero conservan outcome individual.

Preview nunca promete el resultado futuro: al publicar se revalida todo. Un
cambio concurrente devuelve la fila/batch a reconciliación con un diff nuevo.

El diff de versiones es evidencia de la fuente, no instrucciones de lifecycle:

```text
Proveedor X — Septiembre -> Octubre
1,210 listings persistieron/mapped
57 desaparecieron de la fuente
63 aparecieron por primera vez
170 cambiaron título/costo/hints
10 probable renames
8 ambiguos
```

“Desapareció” sólo significa que el proveedor ya no lo listó en esa versión. No
inactiva ni elimina el `CatalogItem`, no revoca precio y no modifica stock.

## 14. Idempotency

| Nivel | Clave | Resultado |
|---|---|---|
| SupplierSource | Tenant + source ID; nombre normalizado evita duplicado accidental | rename conserva identidad/historia |
| Ingestar versión | Tenant + source + `clientRequestId` | retry devuelve la misma versión |
| Versión declarada | source + periodo/label + revision | mismo hash devuelve la existente; hash distinto exige “crear corrección” |
| Contenido | source + content hash + schema version | detecta contenido repetido sin usar filename como identidad |
| Listing | version + row fingerprint | detecta repetida dentro de esa fotografía |
| Crear update batch | Tenant + operación + `clientRequestId` | retry devuelve el mismo batch |
| Publish | Tenant + update batch + `clientRequestId` | retry devuelve el mismo resultado, nunca reaplica |
| Cambio | target + expectedVersion + diff efectivo | mismo valor produce `NO_CHANGE`, no una revisión |

El nombre del archivo o el origen del clipboard no forman parte de identidad.
Los casos se resuelven así:

- **misma versión pegada dos veces:** replay de la versión existente;
- **mismo contenido, otro mes:** nueva Supplier Catalog Version sólo mediante
  intención explícita de nueva ronda;
- **corrección del mismo mes:** nueva revisión inmutable enlazada con
  `correctsVersionId`; la previa queda `SUPERSEDED`, no sobrescrita;
- **dos Owners ingiriendo la misma versión:** lock/unique por source+label+
  revision; uno obtiene el resultado existente o un conflicto de corrección;
- **reconciliación interrumpida:** se reanuda el draft/versionado, no se vuelve a
  crear listings ni mappings.

Repetir una Supplier Version no reaplica Catalog. Repetir su Catalog Update
Batch devuelve el outcome previo; crear otro batch explícito contra la misma
versión produce `NO_CHANGE` salvo que Catalog haya cambiado realmente.

IDs de nuevos items/revisiones se reservan de forma determinista en la intención
persistida antes de commit. Un retry no genera identidades diferentes.

## 15. Concurrency

Dos Owners pueden editar Sources/Versions/batches simultáneamente. Optimistic
version protege drafts y resoluciones: un autosave stale no reemplaza decisiones
del otro navegador. Congelar una Supplier Version bloquea su identidad y sus
fingerprints; corregirla crea una versión nueva.

Ningún análisis bloquea Catalog durante preview. Al publish:

1. se bloquea/revalida cada identidad fuerte y referencia dentro del Tenant;
2. se verifican `expectedVersion`, lifecycle y applicability;
3. se aplican constraints Tenant-aware de SKU/barcode y source mapping;
4. se revalidan Session/capabilities mediante commit guards;
5. si cualquier intención quedó stale, todo el commit se revierte.

Si dos batches cambian el mismo item, el primero que publica puede ganar; el
segundo vuelve a `RECONCILING` y muestra el nuevo before/after. Nunca
last-write-wins. Si trabajan items disjuntos, ambos pueden completar.

Dos decisiones concurrentes que intentan mapear el mismo supplier code o firma
exacta a targets distintos producen conflicto. La corrección Owner queda como un
nuevo evento que supersede la resolución anterior; no reescribe la evidencia de
la versión donde ocurrió.

## 16. Modelo conceptual, ownership y retención

Todos estos conceptos pertenecen al módulo `catalog` únicamente para mantener
su identidad/precio. No constituyen Procurement.

| Concepto | Identidad/alcance | Responsabilidad |
|---|---|---|
| `SupplierSource` | ID estable + Tenant | nombre mínimo de la fuente externa y lifecycle; no contacto, pago ni compra |
| `SupplierCatalogVersion` | source + version ID interno | fotografía inmutable de una ronda, content hash, label/revision, received/ingested actor/time y lineage de corrección |
| `SupplierListing` | version + listing ID/ordinal | observación de fila: raw/normalized fields, signature, optional supplier code, costo observado y hints |
| `SupplierListingResolution` | listing + resolución versionada | target CatalogItem, outcome, evidence/method, actor/time; una corrección supersede, no borra |
| `SupplierReconciliationMemory` | source + señal/firma | proyección reconstruible de mappings confirmados, evidence count, first/last seen y target vigente |
| `CatalogUpdateBatch` | Tenant + batch ID | selección/decisiones para modificar Catalog; state machine, expectedVersions, capabilities y publish outcome |
| `CatalogUpdateRowDecision` | batch + row ID | create/update/no-change/excluded/conflict, before/after y links a listings/revisiones |

Un Supplier Listing resuelve como `UNRESOLVED`, `MAPPED`, `NEW_CANDIDATE` o
`EXCLUDED`. Un `MAPPED` apunta a un solo CatalogItem; un CatalogItem puede recibir
muchos listings a través de versiones/fuentes. Cambiar el target agrega una
resolución `CORRECTED` que supersede la previa y actualiza la proyección de
memoria. No existe cascade desde mapping hacia lifecycle de Catalog.

`SupplierSource` mínimo conserva sólo `sourceId`, Tenant, display name,
normalized name, status, version y audit. No guarda dirección, contacto,
condiciones, cuentas por pagar, órdenes, recepción ni inventario. Procurement
futuro podrá vincular su Supplier a este source mediante contrato, no escribir
sus tablas.

“Fotografía exacta” significa el contenido que el Owner declaró e ingirió en SR
Taller al congelar la versión. Si antes lo limpió en Sheets, no se afirma que sea
una copia forense del mensaje/archivo original del proveedor. Durante `DRAFT` se
conservan raw pasted value y correcciones; después de `INGESTED` cualquier cambio
crea una versión correctiva, nunca edita la fotografía.

### 16.1 Evidencia de Supplier Catalog Version

La versión conserva conceptualmente:

- source, internal version ID, label/revision y `correctsVersionId`;
- received/ingested timestamps, actor, Station, Session y correlation;
- input kind, schema/signature algorithm versions, content hash y row count;
- por listing: ordinal, exact supplier title, optional description/code,
  parsed/normalized values, row fingerprint, observed cost/currency,
  Category/Brand hints y tags clasificados;
- mapping outcome, CatalogItem target, método/evidencia y resolución humana;
- diferencias contra versión previa y conteos agregados.

`Precio base` calculado por Avicell no es Supplier Listing evidence: pertenece a
la propuesta del Catalog Update Batch. Si una misma cuadrícula contiene costo de
fuente y precio público, el schema conserva esa procedencia por columna.

### 16.2 ImportBatch reformulado

El anterior `ImportBatch` se divide conceptualmente:

- **Supplier Catalog Version:** “esto fue lo recibido”. Es inmutable y no tiene
  `created/updated` de Catalog como outcome principal.
- **Catalog Update Batch:** “esto decidió aplicar el Owner”. Conserva total,
  creates, updates, no-change, exclusions, conflicts, rejected, pending refs,
  versions, capabilities, correlation y revision IDs.

No hay relación 1:1 obligatoria. Un update batch puede incluir un subconjunto de
una versión; varias correcciones pueden generar batches distintos. Cada row
decision conserva el listing de origen para explicar precio/costo/mapping.

### 16.3 Retención conforme OD-BI-006

`OD-BI-006 Option A` permanece aprobada:

- **90 días:** clipboard/file raw payload completo, celdas no mapeadas,
  artefactos temporales de parseo y mensajes diagnósticos detallados;
- **permanente:** Source/version metadata, hash, schema/signature version,
  outcomes, mappings/resolutions, Catalog diffs/revision IDs y audit mínimo;
- **propuesta pendiente OD-BI-008:** qué subset estructurado del Supplier Listing
  —título exacto, costo observado, hints y tags— debe permanecer para comparar
  versiones y explicar historia después de 90 días.

Los costos observados y raw values reciben la misma protección server-side que
el costo de referencia. Logs técnicos sólo contienen IDs, conteos y códigos de
error; nunca filas completas ni montos masivos.

## 17. Rollback y business reversal

Son dos operaciones distintas:

### Fallo técnico durante commit

La transacción PostgreSQL revierte todos los writes de producto. El batch queda
`FAILED` o vuelve a `RECONCILING` si fue stale. No existe resultado parcial
oculto.

### “Deshacer” días después

No es rollback de base de datos. Es una **reversión de negocio**:

- precio/costo: nueva revisión compensatoria, sólo si la revisión vigente sigue
  siendo la del batch; si alguien cambió después, requiere decisión humana;
- items creados: se pueden desactivar sólo si las dependencias downstream lo
  permiten; nunca se borra historia o reutiliza identifier;
- pending references: sólo se resuelven/retiran mediante governance y no se
  eliminan si tienen uso;
- merges canónicos: no son acción de import y nunca se “deshacen” como parte del
  batch;
- Repair/Caja/Inventory futuros: sus snapshots/movimientos no se reescriben.

Una Supplier Catalog Version nunca se “revierte”: era evidencia válida de lo
recibido. Si estaba equivocada o incompleta, una corrección nueva la marca
`SUPERSEDED`. Un mapping incorrecto se corrige con otra resolución y la memoria
vigente deja de proponer el target anterior; el evento original permanece para
explicar lo sucedido.

La reversión masiva automática queda fuera del primer PBI. El reporte sí debe
dar evidencia suficiente para una corrección gobernada.

## 18. Semántica Tenant / Branch

- SupplierSource, SupplierCatalogVersion, SupplierListing, reconciliation
  mappings, update batch, item, identifiers, Category, Brand, precio base y
  costo de referencia pertenecen al Tenant.
- Branch del contexto se conserva para atribución, no cambia el target.
- El primer import no crea, edita ni revoca Branch overrides.
- Cada lookup y unique incluye Tenant; un identifier de otro Tenant no produce
  candidato ni error revelador.
- La moneda se obtiene de configuración Tenant y se confirma en metadata. No se
  hardcodea MXN; Avicell inicia en MXN.

Ejemplo obligatorio:

| Estado | Base Tenant | Override A | Precio efectivo A | Otra Branch |
|---|---:|---:|---:|---:|
| Antes | 1399 | 1299 | 1299 | 1399 |
| Después del import | 1499 | 1299 | 1299 | 1499 |

Preview informa cuántos items actualizados tienen overrides para evitar sorpresa,
pero no pide una decisión por cada Branch ni modifica su precedencia aprobada.

## 19. Authorization y protección de costo

| Acción | Requisito mínimo |
|---|---|
| Abrir/guardar Composer draft | `catalog.import.prepare` |
| Crear/renombrar SupplierSource mínimo e ingestar versión | `catalog.import.prepare` |
| Descargar template futuro sin datos actuales | `catalog.import.prepare` |
| Export/template futuro de actualización con catálogo | `catalog.import.prepare` + lectura de catálogo autorizada |
| Incluir costos existentes en export | además `catalog.reference_cost.read` |
| Pegar/editar/validar/matchear | `catalog.import.prepare` |
| Proponer identidad/clasificación/pending | `catalog.import.prepare`; publish exigirá `catalog.manage` |
| Publicar cambios de item | `catalog.import.publish` + `catalog.manage` |
| Publicar precio base | además `catalog.prices.manage` |
| Ingestar/ver costo observado | `catalog.import.prepare` + `catalog.reference_cost.manage/read` |
| Publicar costo como ReferenceCost | además `catalog.reference_cost.manage`; preview del valor requiere `catalog.reference_cost.read` |

`catalog.import.publish` no es una super-capability que salta permisos de campos.
El servidor calcula los requisitos del diff y exige la intersección completa al
confirmar y dentro del commit.

Si el actor no puede gestionar/leer costo, no puede ingestar esa columna como
Supplier Listing ni mapearla a ReferenceCost. El backend no la guarda como
staging visible, no la devuelve en preview/error/export/version comparison y no
permite inferir si difería. Un usuario autorizado a modificar pero no a leer
costo no es un caso útil para bulk; la primera entrega debe exigir ambas
capabilities para esa columna y fallar cerrada.

ADR-013 mantiene publicación en nivel 1 mientras sea reversible, con capability,
confirmación explícita, idempotencia y audit. Umbrales de valor, auto-publicación
externa o acciones irreversibles obligarían a reclasificarla. Session expirada o
capability revocada entre preview y publish bloquea el commit.

Seguridad del Composer: clipboard como texto plano, límites de filas/columnas/
celda, contenido neutralizado al renderizar/exportar, CSRF, rate limits y errores
no reveladores. Los adapters de archivo futuros añaden límites de bytes, firma y
MIME, rechazo de macros/cifrado/enlaces, límites de ZIP descomprimido y ratio,
parser sin ejecución de fórmulas y filename sanitizado.

## 20. Performance

La meta no es “una transacción gigante”; es un límite medido y explícito:

| Volumen | Tratamiento recomendado |
|---:|---|
| 1,000 | prueba material obligatoria de la primera entrega |
| 10,000 | target inicial candidato, sujeto a benchmark PostgreSQL y presupuesto acordado |
| 50,000 | caracterización obligatoria; si excede presupuesto, rechazo completo o PBI posterior de publicación particionada |

Estrategia:

- paste procesado en chunks y estado durable server-side; el browser no es la
  única copia del batch;
- grid virtualizado con navegación/foco estables; el paste se procesa en chunks
  y no bloquea la interfaz;
- staging Tenant-scoped en PostgreSQL y procesamiento set-based;
- bulk lookup de SKU, barcode, source code, observation signature, historical
  mapping y normalized title; sin N+1;
- comparación de versiones set-based por source/version/signature; detection de
  patterns trabaja primero sobre pares ancla, no producto cartesiano de 1,500×Catalog;
- indexes por Tenant+source+version, content hash, listing fingerprint/signature,
  mapping target y batch+row/classification; uniques por Tenant+scheme+
  identifier y Tenant+source+supplier code sólo cuando el código no sea null;
- preview paginado y conteos agregados server-side;
- original temporal de un adapter futuro eliminado después de parseo;
- commit sólo con filas incluidas, orden de locks estable y duración medida;
- hard cap rechazado antes de staging/publicación, no truncado silenciosamente.

Para el primer PBI se recomienda all-or-nothing hasta el máximo materialmente
validado. Si 50,000 no cabe en una transacción dentro del presupuesto, dividir
en commits parciales cambia el producto: necesita checkpoints, compensación y
reporte de parcialidad, por lo que debe ser un diseño/PBI posterior, no un fallback
oculto.

## 21. Futuras integraciones protegidas

| Contexto futuro | Qué consume | Qué conserva como verdad propia |
|---|---|---|
| Inventory | `CatalogItem.itemId`, flags stockable y descripción mínima | stock, ubicación, reservas, movimientos, valuación |
| Caja/Sales | item + precio/revision resuelta | línea de venta snapshot, descuento, obligación, pago |
| Repairs/Concepts | item + snapshot de nombre/clasificación/precio | concepto ofrecido/autorizado/aplicado y decisión histórica |
| Procurement | mapping Source/Listing→CatalogItem mediante contrato | Supplier legal/comercial, oferta, orden, recepción y costo de compra |
| Reporting | eventos/revisiones autorizados | proyecciones; nunca corrige Catalog |

La importación crea/reconcilia una identidad comercial común; no crea “producto
de inventario”, “producto de caja” o “refacción de reparación” paralelos. Los
consumidores referencian el ID estable y copian snapshots cuando la historia lo
exige.

```text
Inventory stock       -> CatalogItem #8421
Caja sale line        -> CatalogItem #8421 + snapshot
Repair concept        -> CatalogItem #8421 + snapshot
Supplier Oct listing  -> CatalogItem #8421 (sólo reconciliación/fuente)
```

Inventory, Caja y Repairs nunca usan `SupplierListing` como identidad principal.
Cambiar/corregir un mapping no reescribe sus operaciones históricas.

## 22. Edge cases y resultado esperado

| Caso | Resultado |
|---|---|
| Composer sin filas | draft válido, pero no puede pasar a READY |
| Paste con más columnas que el modo | preview de dimensiones y bloqueo; nunca truncar |
| Encabezado futuro duplicado/desconocido | mapping bloqueado hasta resolver |
| CSV con BOM/separador regional | detectar como sugerencia; Owner confirma |
| `1,399` ambiguo | confirmar locale antes de minor units; nunca `float` |
| `0` | valor monetario explícito válido |
| celda monetaria vacía en update | no change |
| celda monetaria vacía en create | precio inválido; costo ausente válido |
| fórmula sin cached value | inválida |
| SKU/barcode con ceros iniciales | tratar como texto y preservar |
| dos identifiers de la fila apuntan a distintos items | conflicto |
| identifier ya existe en otro Tenant | se comporta como inexistente; sin filtración |
| Category inactiva/merged | no usar silenciosamente; resolver al survivor/canon vigente o conflicto |
| Brand exacta activa pero sin Type | propuesta explícita de ampliar applicability usando el contrato PBI-040 |
| 300 labels nuevas equivalentes | una pending consolidada y 300 usos proyectados |
| el mismo item aparece dos veces con distinto precio | conflicto; no gana la última fila |
| item cambia después del preview | stale; batch vuelve a reconciliación |
| usuario pierde capability antes de commit | cero writes; authorization changed |
| mismo bloque pegado/reimportado | batch reconocido; si se confirma, no-op salvo cambios reales del estado base |
| mismo source+versión+hash pegado dos veces | replay de Supplier Version existente |
| mismo contenido en un mes nuevo | nueva versión sólo por intención Owner explícita |
| corrección del mismo mes | nueva revisión enlazada; anterior `SUPERSEDED`, nunca overwrite |
| supplier code ausente en 1,500 filas | usar mappings/observations/version comparison; no generar código ficticio de proveedor |
| mismo raw title históricamente mapeado a dos items | memoria inconsistente; ambiguous y corrección humana |
| cambio masivo Display→Pantalla | detectar con pares ancla, explicar y pedir confirmación grupal |
| sufijo `(liquidación)` | conservar raw; sugerir source metadata; no renombrar Catalog ni quitarlo ciegamente |
| proveedor elimina una fila de su lista | ningún cambio automático |
| base cambia con override Branch | override se conserva y sigue prevaleciendo |
| proceso cae durante análisis | análisis reanudable/idempotente; producto intacto |
| proceso cae durante commit | transacción revierte; retry de publish no duplica |

## 23. Owner Decisions cerradas

La dirección **Opción C — Composer first + adapters futuros** y las decisiones
`OD-BI-001..010` quedan aprobadas. No se reabren dentro de PBI-041.

### Decisiones aprobadas

| ID | Estado | Resultado |
|---|---|---|
| `OD-BI-001` | **Reformulada / Approved** | SupplierSource→Version→Listing→mapping persistente→CatalogItem; supplier code es opcional y sólo señal fuerte cuando existe |
| `OD-BI-002` | **Approved A** | precio/costo se proponen en matches confiables; cambios descriptivos/clasificación requieren opt-in explícito |
| `OD-BI-003` | **Approved A** | preservar casing limpio; sugerencias no destructivas, nunca Title Case forzado |
| `OD-BI-004` | **Approved A** | publicar con una captura `Por revisar` elegida conscientemente; unresolved decisions sí bloquean |
| `OD-BI-005` | **Approved A** | diferir `[BORRAR]` de costo; cero nunca significa ausencia |
| `OD-BI-006` | **Approved A** | raw/staging completo 90 días; audit/diffs mínimos permanentes |
| `OD-BI-007` | **Approved A** | target inicial 10,000 filas sujeto a benchmark; 50,000 sólo caracterización |
| `OD-BI-008` | **Approved A** | subset estructurado esencial permanente; raw completo y columnas no mapeadas expiran a 90 días |
| `OD-BI-009` | **Approved A** | mappings exactos, únicos y consistentes pueden preseleccionarse; siempre permanecen visibles en preview y requieren confirmación del batch |
| `OD-BI-010` | **Approved B** | PBI-041 entrega Composer + Supplier Intake; reconciliación avanzada es outcome diferido sin ID/readiness |

`OD-BI-001` significa que un código de proveedor, si aparece mañana, se agrega
como evidencia del mapping; su ausencia no bloquea ni provoca códigos ficticios.
La continuidad normal puede venir de observaciones/mappings confirmados y
comparación de versiones.

### OD-BI-008 — Retención estructurada de Supplier Listings — Approved A

**Problema.** OD-BI-006 elimina raw payload a 90 días, pero comparar octubre con
septiembre y mostrar costo histórico requiere conservar parte de la observación.

**Ejemplo Avicell.** En un año se necesita explicar que Proveedor X llamó
“Display iPhone 11 OLED” al item #8421 y ofreció `480`, aunque el clipboard
original ya expiró.

**Opciones.** A) conservar permanentemente el subset estructurado esencial:
título exacto, supplier code si existe, costo/currency observado, hints/tags,
normalized signature y mapping; borrar a 90 días el payload completo y columnas
no mapeadas. B) conservar permanentemente título/signature/mapping, pero borrar
costo observado a 90 días. C) conservar sólo hash/fingerprint/mapping después de
90 días, sin replay legible de la versión.

**Consecuencias.** A habilita historial y comparación completos con costo
protegido; acumula más evidencia sensible. B pierde historia larga de ofertas.
C minimiza datos, pero degrada el valor del catálogo versionado.

**Resolución Owner:** A, con acceso a costos por capability y política futura
de retención configurable si legal/operación lo exige.

### OD-BI-009 — Reuso automático de mappings históricos exactos — Approved A

**Problema.** Confirmar manualmente 1,215 filas conocidas cada mes elimina el
beneficio del aprendizaje; reutilizarlas sin revisión puede propagar un mapping
incorrecto.

**Ejemplo Avicell.** La firma exacta de un listing fue confirmada en agosto y
septiembre contra #8421, el item sigue activo y no hay señal contradictoria.

**Opciones.** A) preseleccionar mappings exactos, únicos y consistentes; el Owner
los confirma en bloque al `APLICAR CAMBIOS`. Toda similarity, pattern o tag nuevo
requiere confirmación aparte. B) exigir confirmación de cada mapping en cada
versión. C) publicar mappings históricos sin preview/confirmación de batch.

**Consecuencias.** A reduce trabajo sin write silencioso. B es seguro pero no
escala. C es rápido, pero contradice el gobierno aprobado.

**Resolución Owner:** A.

### OD-BI-010 — Un PBI XL o dos outcomes consecutivos — Approved B

**Problema.** Grid, versiones inmutables, mappings, governance, atomic apply y
detección sistemática forman un alcance mayor que el PBI-041 Planned original.

**Ejemplo Avicell.** El primer outcome ya permite pegar 1,500 filas, crear su
versión, resolver mappings y aplicar Catalog. El segundo reduce excepciones al
detectar `Display→Pantalla` y tags como liquidación.

**Opciones.** A) un solo PBI `XXL` con todo, sin checkpoint intermedio. B) dos PBIs
verticales: primero Composer + version snapshot + mapping manual/exacto + preview
+ atomic apply; después comparación avanzada + systematic change/tag assistance
+ resolución grupal. C) dividir por backend/UI.

**Consecuencias.** A retrasa feedback y concentra riesgo. B entrega valor real y
preserva un límite de outcome. C deja capas sin experiencia operable.

**Resolución Owner:** B. El segundo outcome queda documentado como `Advanced
Supplier Reconciliation`, sin PBI ID, selección ni readiness.

## 24. Recomendación final

Adoptar un Bulk Catalog Composer respaldado por un batch engine propio de
Catalog, no un cargador CRUD. La combinación recomendada es:

1. Composer tabular como experiencia primaria, con paste rectangular, teclado,
   edición y draft durable.
2. Tres modos del mismo engine: alta completa, actualización compacta y nueva
   Supplier Catalog Version.
3. SupplierSource mínimo + Version/Listing inmutables; no Supplier/Procurement
   maestro.
4. Mapping persistente Listing→CatalogItem como memoria; supplier code opcional,
   no requisito.
5. SKU/barcode internos siguen siendo identidad Catalog, aunque la fuente nunca
   los conozca.
6. Comparación de versiones y similarity sólo sugieren; exact history puede
   preseleccionarse conforme OD-BI-009; nada publica sin Apply.
7. Tags/transforms se explican y confirman por versión; no regex global ni alias
   canónico automático.
8. Captura pending consolidada usando exactamente el governance PBI-040.
9. Preview sin writes, con source observation y Catalog proposal separados.
10. Supplier Catalog Version y Catalog Update Batch son agregados/lifecycles
    distintos y no requieren relación 1:1.
11. Publicación all-or-nothing, idempotente, versionada y con revalidación de
   capability/scope.
12. Supplier observed cost, ReferenceCost y Procurement cost permanecen
    separados.
13. Base Tenant como único target inicial; Branch overrides intactos.
14. CSV/XLSX/API son adapters futuros del mismo engine.
15. Límite inicial medido de 10,000 y 50,000 como caracterización, no promesa.
16. Reporte por listing/fila y reversal gobernado, no borrado de historia.

Esto conserva la ergonomía que V1 intentó resolver, los patrones downstream
útiles de ENL y todos los invariantes materializados en PBI-040, sin copiar su
deuda.

## 25. Propuesta de siguiente PBI y readiness

PBI-041 queda refinado conforme `OD-BI-010 B` como **Initial Bulk Catalog
Composer + Versioned Supplier Intake**. Sigue siendo vertical y termina en un
checkpoint Owner funcional; no se divide en “tablas/backend/UI” ni inicia
ahora.

Resultado mínimo propuesto:

1. grid accesible con paste rectangular, autosave, alta/actualización compacta;
2. SupplierSource mínimo y SupplierCatalogVersion/Listing inmutables;
3. matching por identifiers/código opcional/firma histórica exacta, resolución
   manual y mapping persistente corregible;
4. pending references y Catalog governance PBI-040;
5. version comparison básica: persisted/disappeared/new/changed/ambiguous;
6. preview/diff, apply atómico de Catalog, revisiones, idempotencia, audit y
   reporte;
7. una segunda Supplier Version de prueba que reutilice memoria exacta sin
   depender de supplier code.

El outcome siguiente —sin numerarlo— agrega
detección sistemática `Display→Pantalla`, clasificación asistida de tags,
aceptación grupal y comparación avanzada. CSV/XLSX/API permanecen adapters
posteriores del mismo engine.

La readiness se considera satisfecha únicamente por el expediente canónico
[PBI-041 Definition of Ready](../quality/evidence/pbi-041/DEFINITION_OF_READY.md),
que demuestra lo siguiente:

- los contratos equivalentes de PBI-040 están materializados en la rama actual,
  aunque su Owner Acceptance/closure continúe pendiente y siga siendo el WIP;
- OD-BI-001..010 están resueltas y promovidas sin contradicción;
- arquitectura y backlog reemplacen “template/upload first” por “Composer first
  + adapters futuros” sin crear dos engines;
- arquitectura/backlog separen Source/Version/Listing/Resolution de
  CatalogUpdateBatch, retiren GTIN/EAN/UPC y hagan supplier code opcional;
- se retire `[BORRAR]` para costo del alcance inicial conforme OD-BI-005 A;
- existe un fixture sintético determinista de 1,500 filas para el checkpoint;
  cualquier lista Owner real futura debe anonimizarse y no persistirse en Git;
- filas, columnas, tamaño de celda/paste, tiempos y retención tienen presupuestos
  explícitos; el benchmark de implementación decide si se anuncia 10,000;
- se diseñen lifecycles, ownership, correction lineage y retención de
  SupplierCatalogVersion/CatalogUpdateBatch sin loop de endpoints individuales;
- threat model cubra clipboard/HTML activo, grid exhaustion, costos, CSRF,
  revocación de capability, Tenant leakage e idempotency/concurrency; ZIP bomb,
  fórmulas y MIME se añaden cuando exista adapter de archivo;
- migration/rollback plan, test matrix, observabilidad y Definition of Ready
  propios estén completos;
- el checkpoint Owner incluya una fuente sin códigos, primera versión de 1,500
  filas, segunda ronda, mapping corregido, conflictos, pending references y base
  con Branch override;
- la matriz pruebe que Supplier Listing nunca se vuelve identidad de Inventory,
  Caja o Repairs;
- estimación `XL` esté acordada para el outcome inicial. La selección e
  implementación requieren autoridad Owner posterior; PBI-040 Owner Review no
  las inicia automáticamente.

## Fuentes y trazabilidad

[^v1]: SR Taller 1.0, SHA `9357b8629ed320f690ee07d106660020ce8b42e3`: `public_html/sistema/views/inventario/actualizacion_precios.php`; `public_html/sistema/funciones/actualizacion_precios/js/actualizacion_precios.js`; `obtener_productos_variantes.php`; `guardar_actualizacion.php`; `crear_producto.php`; `guardar_en_bd_interna.php`; `generar_codigo_barras.php`. Síntesis previa en [Price List Domain Discovery, sección 3](PRICE_LIST_DOMAIN_DISCOVERY.md#3-auditoría-sr-taller-10).
[^enl]: ENL, SHA `6140a2375f221cb2ddadb0f4f65d839aae90381a`: `products`, `services`, `product_stock`, `order_items`, `work_order_items`; acciones de producto, OT, POS y recepción de compras. Búsqueda de importadores en árbol y refs alcanzables sin coincidencia de catálogo/precio. Síntesis en [Price List Domain Discovery, sección 4](PRICE_LIST_DOMAIN_DISCOVERY.md#4-auditoría-de-enl).
[^v2]: SR Taller 2.0, branch `feature/pbi-040-catalog-pricing-core`, HEAD auditado `aecd6c43b36c4243e3b5c22807fffacb015d6f11`: `src/modules/catalog/domain/catalog-item.ts`; `src/modules/catalog/application/catalog.service.ts`; `src/modules/catalog/application/ports/catalog-repository.port.ts`; `src/modules/catalog/infrastructure/persistence/kysely-catalog.repository.ts`; migraciones Catalog; [PBI-040](../backlog/pbis/PBI-040.md); [Implementation Evidence](../quality/evidence/pbi-040/IMPLEMENTATION_EVIDENCE.md).
[^owner]: `MASTER GOAL — PBI-041 BULK CATALOG COMPOSER ARCHITECTURE + PBI READINESS`, dirección Owner recibida el 2026-09-13: `OD-BI-001..010` aprobadas y PBI-041 acotado al outcome inicial.

PRICE LIST BULK COMPOSER

VERSIONED SUPPLIER CATALOG DESIGN COMPLETE — OWNER DECISIONS PROMOTED
