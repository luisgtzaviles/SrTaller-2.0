# Price List Domain Discovery

## Estado del documento

- **Estado:** Discovery reviewed — blocking Owner decisions resolved and
  promoted on 2026-09-11.
- **Autoridad:** evidencia/antecedentes; la arquitectura y readiness vigentes
  viven en documentos enlazados, no se infieren de todas las propuestas aquí.
- **Propietario de las decisiones:** Product Owner
- **Alcance inmediato:** `Lista de precios`
- **Contextos futuros observados:** Reparaciones/Conceptos, Caja, Inventario,
  Compras, Reportes, Pedidos y Solicitudes de clientes
- **Fuentes auditadas:** SR Taller 1.0, ENL y SR Taller 2.0
- **Fecha de corte:** 2026-09-11

### Resultado de Owner Review

El Owner aprobó PLD-001 a PLD-008 y PLD-018 y delegó las decisiones técnicas
restantes para architecture/readiness. La promoción canónica está en
[Arquitectura de Catálogo y Lista de precios](../architecture/PRICE_LIST_ARCHITECTURE.md),
[PBI-040](../backlog/pbis/PBI-040.md) y SPRINT-03. Las auditorías V1/ENL y las
propuestas no promovidas conservan valor histórico, pero no se convierten en
contrato por repetición.

## Veredicto ejecutivo

`Lista de precios` no debe nacer como una tabla de inventario ni como una hoja
copiada una vez por sucursal. Debe nacer como la consulta rápida de un
**catálogo comercial Tenant-wide**, con identidad estable de cada artículo o
servicio, un precio base del Tenant y una resolución explícita del precio
aplicable a la Branch. Esa frontera ya es coherente con ADR-004: catálogo y
precio base pertenecen al Tenant; el ajuste pertenece a la sucursal; la
operación conserva el precio histórico aplicado.[^1]

La analogía útil es una biblioteca:

- el **artículo de catálogo** es el libro;
- SKU, código de barras y código de proveedor son distintas formas de encontrar
  el mismo libro;
- el **precio base** es la etiqueta general;
- un ajuste de sucursal es una etiqueta local, no otra copia del libro;
- la existencia indica cuántos ejemplares hay en un lugar;
- el concepto aplicado a una reparación es una fotografía de la edición, precio
  y condiciones que se ofrecieron en ese momento.

La recomendación central es separar desde el primer diseño:

1. identidad y clasificación del catálogo;
2. precio de venta efectivo y su procedencia;
3. costo de referencia y su procedencia;
4. existencia, disponibilidad y movimientos;
5. oferta/código de proveedor y compras;
6. snapshots comerciales aplicados a reparaciones o ventas;
7. pagos y movimientos de Caja;
8. pedidos y señales de demanda.

V1 aporta una intención correcta —alta amigable, vista previa y actualización
por lote—, pero su motor masivo no es recuperable como fundamento: emparejaba
por un título normalizado de forma destructiva, aplicaba por código de barras
con scopes inconsistentes, podía convertir vacíos en cero y no tenía atomicidad,
idempotencia ni reporte por fila.[^2] ENL aporta mejores patrones de frontera:
catálogo global al negocio, existencia por sucursal, snapshots en órdenes,
override de precio con motivo e historial de costos. Sin embargo, mantiene un
único precio y costo global, separa servicios de productos y no contiene un
importador masivo equivalente en el árbol ni en las referencias Git
inspeccionadas.[^3]

## 1. Alcance, método y certeza

### 1.1 Pregunta de negocio

El objetivo no es decidir cómo dibujar una pantalla. Es decidir qué significa
“¿cuánto cuesta?” cuando:

- el mismo catálogo sirve a muchas sucursales;
- una sucursal puede cobrar distinto;
- el proveedor cambia costos en cientos de filas;
- un precio consultado hoy puede convertirse mañana en concepto cotizado,
  venta, consumo, compra o dato de reporte;
- cambiar el catálogo no debe reescribir una operación histórica.

### 1.2 Evidencia inspeccionada

La auditoría fue estática y read-only sobre los antecedentes:

| Fuente | Corte inspeccionado | Estado observado | Uso en este discovery |
|---|---|---|---|
| SR Taller 1.0 | `staging` — `9357b8629ed320f690ee07d106660020ce8b42e3` | checkout con archivos no versionados ajenos; no se modificó | alta, precio/costo, inventario, compras, POS e importación |
| ENL | `main` — `6140a2375f221cb2ddadb0f4f65d839aae90381a` | limpio y alineado con `origin/main` | catálogo, sucursal, OT/POS, compras, costo e historial |
| SR Taller 2.0 | `main` — `40684d7554cdf02551f941e5e3f0beabbe563125` | limpio al iniciar; CI exacta `34623060504` exitosa | contratos aceptados, roadmap, dominio y código vigente |

“No encontrado” significa no encontrado en el árbol y referencias Git
inspeccionadas; no prueba que nunca haya existido en otro servidor, respaldo o
proceso manual. Los hallazgos de V1 y ENL son antecedentes, no reglas que V2
deba copiar.

### 1.3 Convenciones

| Etiqueta | Significado |
|---|---|
| **Aceptado** | contrato ya vigente en V2 |
| **Confirmado por código** | comportamiento visible en el antecedente inspeccionado |
| **Inferencia** | conclusión razonable, no regla expresada |
| **Propuesta** | recomendación de este discovery; requiere aprobación |
| **Decisión Owner** | elección todavía necesaria |

## 2. Vocabulario y fronteras que no deben mezclarse

| Concepto | Significado recomendado | No significa |
|---|---|---|
| Artículo de catálogo | identidad estable de algo que el taller consulta, ofrece, compra o usa | una existencia física |
| Precio | valor unitario ofrecido bajo alcance, vigencia y moneda | costo, total o pago |
| Costo de referencia | dato interno con fuente y momento para decidir precio | valoración contable definitiva |
| Catálogo | conjunto gobernado de identidades y clasificaciones | inventario de una sucursal |
| Existencia | cantidad reconocida en ubicación/sucursal | disponibilidad prometible |
| Disponibilidad | cantidad que Inventory puede comprometer considerando reservas/bloqueos | precio |
| Proveedor | contraparte que ofrece o vende artículos | categoría o marca |
| Oferta de proveedor | código, costo, moneda y vigencia de un proveedor para un artículo | identidad principal del artículo |
| Concepto de Repair | línea ofrecida/aplicada a una Repair con snapshot histórico | puntero vivo que cambia con el catálogo |
| Movimiento de Caja | entrada/salida atribuida a caja, turno y actor | precio de catálogo |
| Pedido | compromiso operativo/comercial futuro todavía por definir | existencia o compra automáticamente |
| Solicitud de cliente | señal de demanda o necesidad no resuelta | pedido confirmado ni artículo creado |

Estas separaciones continúan las distinciones ya documentadas en V2: precio no
es importe; pago no es movimiento de caja; existencia no es disponibilidad;
consumo no es instalación; una refacción puede cumplir un propósito técnico sin
pertenecer al stock propio.[^4]

## 3. Auditoría de SR Taller 1.0

### 3.1 Qué implementó

V1 tenía dos entradas principales:

1. **Alta individual tipo Shopify.** Capturaba título, imagen, precio, costo,
   SKU, código de barras, cantidad inicial, “Departamento” y “Tipo de
   producto”. Permitía autocompletar clasificaciones y crear texto libre para el
   tipo. Al escribir un SKU disponible generaba un código aleatorio de ocho
   dígitos. Guardaba `productos` y `variantes` en una transacción.[^5]
2. **Actualización de precios.** Ofrecía plantilla, archivo declarado como
   CSV/XLS/XLSX, modos por archivo/tipo/proveedor/búsqueda, tabla de vista previa
   con precio/costo actual y nuevo, y separación visual entre coincidencias y
   altas nuevas.[^2]

El modelo operativo colocaba identidad, clasificación, precio, costo y cantidad
en dos tablas estrechamente acopladas. Tanto `productos` como `variantes`
recibían Tenant y Branch; la existencia era un número mutable en la variante.
Inventario, órdenes de compra, etiquetas y POS consultaban o actualizaban esas
mismas filas.[^6]

### 3.2 Lo que resolvió bien

- El alta individual usa lenguaje reconocible para un comercio y separa la
  columna principal de la organización del artículo.
- La imagen, el precio, el costo y los identificadores aparecen juntos en el
  momento en que el Owner entiende el producto.
- El flujo masivo intenta mostrar **antes/después** en vez de aplicar un archivo
  a ciegas.
- Distingue visualmente artículos encontrados de artículos nuevos.
- La alta individual usa una transacción para producto + variante.
- El inventario más reciente limita la consulta a Tenant + Branch y oculta el
  costo a roles no Admin; esa intención de menor privilegio sí vale la pena
  conservar.[^6]

### 3.3 Cómo identificaba y actualizaba registros

El flujo tenía dos identidades distintas, y esa divergencia es su falla más
grave:

- En la **vista previa**, buscaba coincidencia únicamente comparando el título
  normalizado.
- La normalización quitaba acentos, puntuación y palabras comercialmente
  significativas como `OLED`, `LCD`, `pantalla`, `display`, `touch`, `original`
  y `genérico`.
- Al **guardar**, dejaba de usar el título y buscaba una variante por
  `barcode + tenant_id`.
- La lectura previa traía todo el Tenant, pero no filtraba Branch; el update
  tampoco filtraba Branch.
- La validación de SKU del alta individual sí era `tenant + branch`, mientras la
  validación de título sólo era Tenant-wide.

Ejemplo: “Pantalla iPhone 11 OLED original” y “Pantalla iPhone 11 LCD genérica”
podían normalizarse hacia una expresión peligrosamente parecida. La vista podía
clasificar una fila como actualización de un artículo, pero el servidor terminar
modificando la fila cuyo barcode llegara en el payload. No existe una identidad
canónica única que una ambas decisiones.[^2]

### 3.4 Duplicados, SKU y códigos de barras

- La generación de SKU se hacía en navegador a partir de palabras del título y
  un contador temporal.
- La comprobación masiva buscaba `sku` y `barcode` en el nivel raíz del objeto,
  aunque la respuesta los anidaba dentro de `variantes`; podía no detectar los
  ya existentes.
- El código de barras era un número aleatorio de ocho dígitos. No distinguía un
  GTIN externo de un código interno.
- La comprobación individual de código sólo garantizaba no encontrarlo en la
  Branch actual durante hasta 50 intentos; no se observó una garantía durable de
  unicidad Tenant-wide.
- Título, SKU y barcode aplicaban scopes diferentes.

Lo rescatable no es el algoritmo, sino la necesidad: poder aceptar un
identificador aportado o generar uno interno cuando falte.

### 3.5 Categorías, marcas y proveedores

V1 usaba `vendor` con la etiqueta visual “Departamento”; en otras pantallas el
mismo campo se trataba como proveedor. `product_type` era texto libre en alta,
pero la importación sólo aceptaba tres valores de “departamento”: accesorio,
refacción y servicio. No existía una frontera confiable entre categoría, tipo,
marca y proveedor.

Consecuencia: una columna podía servir para navegación, fuente de compra o
clasificación según la pantalla. V2 no debe conservar `vendor` como campo
multiuso.

### 3.6 Motor de importación/actualización masiva

La intención de producto era correcta, pero la ejecución acumuló deuda crítica:

| Área | Comportamiento V1 | Riesgo |
|---|---|---|
| Formato | la UI aceptaba CSV/XLS/XLSX, pero siempre invocaba PapaParse | Excel podía no interpretarse realmente |
| Plantilla | el XLSX existía en `uploads/`, ignorado por Git | contrato no reproducible ni versionado |
| Matching | título fuertemente normalizado | merge falso entre artículos distintos |
| Apply | barcode + Tenant, sin Branch | mutación cruzada de sucursales |
| Duplicados | sets parciales sólo del navegador | carrera y duplicado durable |
| Vacíos | saneamiento convertía vacío/no numérico en `0` | borrado accidental de precio/costo |
| Edición preview | celdas `contenteditable`; arrays se formaban antes | cambios visuales podían no llegar al payload |
| Atomicidad | loops de inserts/updates sin transacción global | lote parcialmente aplicado |
| Errores | filas incompletas se omitían con `continue` | éxito aparente con pérdidas silenciosas |
| Idempotencia | ausente | reintento podía duplicar o reaplicar |
| Concurrencia | sin versión ni revalidación | sobrescritura de cambios recientes |
| Auditoría | sólo conteos agregados | imposible explicar fila, fuente y actor |

Además, todas las rutas de alta/actualización auditadas comienzan hoy con
`sr_legacy_module_blocked`; son evidencia histórica, no una capacidad operable.[^2]

### 3.7 Relación con inventario, compras, reparaciones y Caja

- **Inventario:** el mismo registro de variante guardaba `price`, `cost` e
  `inventario`. La compra incrementaba directamente esa cantidad y reemplazaba
  el costo por el último costo recibido.[^6]
- **POS/Caja:** la venta guardaba un snapshot parcial de nombre, cantidad,
  precio y descuento, y descontaba inventario permitiendo negativos. Esto
  muestra la necesidad de snapshot, pero mezcla venta, pago e inventario dentro
  del mismo flujo.[^6]
- **Compras:** las líneas guardaban SKU, barcode, título y costo. Existía una
  `referencia_reparacion` textual/operativa, no un contrato de conceptos de
  Repair.
- **Reparaciones:** no se encontró una integración estructurada que consumiera
  el catálogo como conceptos de reparación; el presupuesto seguía siendo una
  cifra separada.
- **Reportes:** al compartir tablas mutables, un reporte histórico corría el
  riesgo de leer el precio/costo actual en vez del aplicado.

### 3.8 Conclusión V1

Conservar:

- experiencia de alta comprensible;
- vista previa antes/después;
- entrada individual y masiva;
- búsqueda por nombre/SKU/barcode;
- costo restringido por capacidad;
- snapshots al convertir catálogo en operación.

Rediseñar:

- identidad, scopes y unicidad;
- importación completa;
- categorías/marcas/proveedores;
- precio/costo versionados;
- inventario como ledger/autoridad separada;
- errores, auditoría, idempotencia y publicación atómica.

## 4. Auditoría de ENL

### 4.1 Qué implementó

ENL tiene tres familias comerciales:

- `products` para reventa, insumos y artículos operativos;
- `services` como catálogo separado;
- `product_stock` para cantidad por sucursal.

El producto conserva SKU, nombre, descripción, marca y categoría como texto,
código de barras, costo, precio de venta y banderas operativas. La existencia se
separa por `product_id + sucursal_id`. Servicios conserva precio, duración,
categoría y semántica propia de consumo/operación.[^7]

El alta individual de producto es más cercana a la necesidad Owner: nombre,
descripción, precio, costo, SKU, barcode, cantidad inicial, tracking, marca,
categoría, estado, visibilidad e imágenes múltiples. Valida montos no negativos,
duplicado de barcode y tipos reales de imagen. SKU tiene soporte de esquema,
pero no aparece con el mismo preflight explícito del barcode en el endpoint
auditado.[^8]

### 4.2 Lo que resolvió bien

- Separa **identidad del producto** de **existencia por sucursal**.
- Una orden o venta guarda `name_snapshot`, cantidad, precio unitario y total;
  cambios futuros del catálogo no deberían reescribir la línea histórica.
- Los productos agregados a una OT capturan también un snapshot de costo.
- La edición excepcional de precio en OT requiere permiso específico, motivo,
  Branch correcta, transacción, precio base y procedencia `catalog/override`.
- La recepción de compra crea movimiento de inventario, registra la recepción y
  deja historia del cambio de costo.
- El costo puede compararse con la última compra y el administrador puede
  sincronizarlo explícitamente dejando fuente, actor y referencia.[^9]

Estos patrones son más valiosos para V2 que las tablas concretas de ENL.

### 4.3 Lo que resolvió mal o dejó como deuda

- Producto y servicio están en tablas y recorridos separados. Para una búsqueda
  de precios unificada, el consumidor debe consultar dos catálogos.
- Precio y costo viven globalmente en producto/servicio; no existe precio por
  sucursal.
- El stock sí es Branch-scoped, pero la recepción calcula un promedio ponderado
  usando stock total y sobrescribe el costo único del producto. Una compra local
  puede cambiar la referencia de costo para todas las sucursales.
- Marca y categoría son texto; la sincronización de categoría es tolerante a
  fallos y puede ignorar errores.
- `product_type` mezcla destino comercial (`resale`), naturaleza de inventario
  (`supply`) y uso interno (`ops`).
- El proveedor de una compra es `vendor_name`; no se encontró maestro de
  proveedores ni relación proveedor-artículo con código externo.
- La búsqueda de OT sólo busca por nombre, limita a 20 y divide servicio de
  producto. La búsqueda de producto para POS sí añade stock local, pero el
  precio sigue siendo global.[^10]
- Se detectan capacidades del esquema en runtime en varios flujos. Es una
  adaptación pragmática a despliegues desiguales, pero aumenta complejidad y
  oculta el contrato real.

### 4.4 Importación masiva

No se encontró un importador de catálogo/precio por CSV/XLS/XLSX en el árbol
actual ni en búsquedas de todas las referencias Git alcanzables del checkout.
Sólo se encontraron exportación XLSX y cargas de otros dominios. Por tanto, ENL
no ofrece un motor equivalente que V2 pueda reutilizar; su aporte está en los
patrones de consumo, historial y stock, no en bulk import.[^3]

### 4.5 Relación con operaciones futuras

- **Repair/OT:** catálogo vivo para elegir, snapshot para ejecutar y override
  trazable para la excepción.
- **Caja/POS:** el catálogo aporta la línea vendida; la orden/pago conserva su
  propia verdad.
- **Inventory:** stock Branch-scoped y movimientos separados.
- **Compras:** recepción transaccional y costo histórico, aunque su alcance
  multisucursal necesita rediseño.
- **Reportes:** snapshots y cost history permiten explicaciones históricas
  mejores que una lectura del catálogo actual.

### 4.6 Conclusión ENL

Conservar:

- catálogo separado de stock;
- snapshots comerciales;
- override con permiso, actor y motivo;
- historial de costos con fuente;
- recepción y movimientos transaccionales;
- imágenes y campos amigables de alta.

Rediseñar:

- precio/costo multisucursal;
- catálogo unificado para búsqueda;
- tipos como semántica + capacidades;
- categorías/marcas gobernadas;
- proveedor y códigos de proveedor;
- bulk import completo.

## 5. Comparación V1 vs ENL vs necesidad V2

| Dimensión | V1 | ENL | Necesidad recomendada V2 |
|---|---|---|---|
| Identidad | producto/variante duplicados por Branch | producto global del negocio | Item Tenant-wide con ID estable |
| Servicios | mezclables por texto/tipo | tabla separada | búsqueda unificada, semántica específica |
| Precio | en variante Branch-like, scopes inconsistentes | global | base Tenant + ajuste efectivo Branch |
| Costo | mutable en variante | global con historia | referencia con fuente/scope; valoración aparte |
| Existencia | número en variante | tabla por Branch | Inventory Branch/location-owned |
| Proveedor | `vendor` ambiguo | nombre libre en compra | Supplier + SupplierItemReference |
| Categoría/marca | campos ambiguos/libres | texto libre | IDs canónicos Tenant/platform y reconciliación |
| SKU/barcode | aleatorios y scope inconsistente | globales, barcode validado | identificadores tipados y únicos Tenant-wide |
| Alta individual | simple, Shopify-like | rica y segura | conservar claridad y reducir campos por tipo |
| Bulk | existe, pero inseguro | no encontrado | staging + matching determinista + publish |
| Repair concept | no estructurado | snapshot en OT | snapshot versionado y decisión por concepto |
| Caja/venta | acoplada a pago/stock | líneas snapshot | consumidor; nunca owner del catálogo |
| Auditoría | mínima/agregada | mejor por operación | batch/fila/cambio/procedencia |
| Muchas Branches | copias y filtros inconsistentes | stock local, precio global | una identidad; capas de precio reutilizables |

## 6. Estado actual de SR Taller 2.0

### 6.1 Lo que ya está aceptado

ADR-004 fija tres invariantes relevantes:

1. catálogos personalizados y precio base son Tenant-scoped;
2. una Branch puede declarar un ajuste sin modificar la base ni otras Branches;
3. la Orden conserva el precio histórico aplicado.[^1]

DEC-049 añade que cada objeto de persistencia tiene un solo owner lógico; sólo
su infraestructura escribe; el scope Tenant o Tenant+Branch es explícito; otros
módulos consumen contratos o proyecciones, no tablas ajenas.[^11]

El modelo comercial validado separa recomendación técnica, cotización
versionada, conceptos, decisiones por concepto, trabajo autorizado, ejecución y
pagos. Un cambio manual de precio requiere autoridad y motivo; cambiar el precio
después de autorización no debe reescribir la historia.[^12]

### 6.2 Lo que existe en producto/código

No existe todavía módulo, tabla ni contrato público de pricing, catálogo,
inventory, compras o cash. La policy ejecutable sólo registra `access`,
`customers`, `repairs`, `stations`, `tenancy` y `users`.[^13]

Repairs sí posee catálogos de marca/modelo/equipo para intake. `repair_brands`
implementa valores platform/tenant, normalización, pending reconciliation,
versión y eventos append-only. Es un precedente técnico útil, pero sigue siendo
propiedad de Repairs; Lista de precios no debe escribir esas tablas ni asumir
que “marca del dispositivo” y “marca del artículo comercial” son el mismo
agregado.[^13]

El `Presupuesto inicial` actual es una aproximación, no precio final. Repair
Detail sólo reserva visualmente `Conceptos` y declara que refacciones, servicios
y conceptos personalizados aparecerán cuando Lista de precios y Caja estén
disponibles.[^14]

### 6.3 Roadmap, backlog y tensiones por reconciliar

- `CURRENT_STATE` y Roadmap son snapshots del cierre candidato de PBI-039; el
  gate que ellos declaran —merge del PR documental y CI exacta del nuevo
  `main`— ya se observó satisfecho en `40684d7` con CI `34623060504`
  `SUCCESS`.[^17]
- El roadmap coloca `Pricing Catalog` antes de Quote/Authorization y
  Payments/Cash; define la fase como “precios de referencia sin inventario”.
- Inventory, Costs, Purchases, Margins y reporting dependiente de costos siguen
  en Stage 2.[^15]
- PBI-039 registró después una dirección Owner diferente para el downstream:
  `Price List -> Caja foundation -> Caja flows -> Repair Concepts`.[^14]
- La IA vigente coloca `Lista de precios` directamente bajo `Operación`; la
  dirección Owner de este discovery propone el grupo futuro `Listas` con
  `Lista de precios`, `Pedidos` y `Solicitudes de clientes`.[^16]

Estas divergencias no bloquean el discovery ni la primera Lista de precios, pero
deben reconciliarse antes de seleccionar PBIs posteriores. Este documento no
elige Sprint ni cambia esas fuentes.

## 7. Modelo de dominio recomendado

La siguiente es una propuesta conceptual, no una lista de tablas.

### 7.1 Núcleo

| Concepto | Responsabilidad | Invariantes recomendadas |
|---|---|---|
| `CatalogItem` | identidad y descripción estable | Tenant-scoped; ID opaco; no depende de título/SKU |
| `ItemKind` | semántica primaria: part/product/service/supply | controlado; no texto libre por fila |
| `ItemCapability` | sellable, stockable, purchasable, usable-in-repair | evita deducir conducta sólo por tipo |
| `ItemIdentifier` | SKU y código de barras interno | scheme + valor normalizado; unicidad Tenant |
| `Category` | clasificación de negocio | ID canónico Tenant; activa/inactiva; reconciliable |
| `Brand` | fabricante/marca opcional | platform o Tenant; no obligatoria para servicio/insumo |
| `ItemImage` | referencias visuales | orden, estado y ownership del objeto |
| `BasePrice` | precio comercial base | Tenant, moneda, vigencia, versión y fuente |
| `BranchPriceAdjustment` | sustitución/ajuste aplicable a una Branch | no altera base ni otra Branch |
| `EffectivePrice` | resultado de resolución para consulta | valor + moneda + fuente + versión + vigencia |
| `ReferenceCost` | costo operativo no contable | fuente, alcance, fecha, moneda, versión y visibilidad |
| `SupplierItemReference` | relación artículo-proveedor | supplier + supplier code; no reemplaza item ID |
| `ImportBatch` | intención y evidencia de carga | archivo/hash/actor/target/estado/resultado |
| `ImportRowDecision` | create/update/no-op/error/conflict | conserva match, diff y resolución humana |

### 7.2 Ejemplo operativo

```text
CatalogItem
  itemId: interno e inmutable
  tipo: REFACCIÓN
  categoría: PANTALLA
  marca: APPLE
  nombre: Pantalla iPhone 11 OLED
  SKU: REF-IPH11-OLED-0042
  código de barras: SR00000042

Precio base Tenant:     $1,399 MXN
Ajuste Branch Centro:   $1,449 MXN
Ajuste Branch Norte:    ninguno

Consulta en Centro:     $1,449 — fuente “ajuste Centro”
Consulta en Norte:      $1,399 — fuente “base Tenant”
Existencia en Centro:   dato futuro de Inventory, no del precio
```

Si mañana el base sube a $1,499, una cotización emitida ayer conserva $1,449 y
la versión/fuente que explicó ese precio.

### 7.3 Variantes y compatibilidad

No abrir un modelo de variantes genérico en el primer slice sin casos validados.
Cuando costo, SKU o barcode cambian materialmente —OLED vs LCD, original vs
genérica— conviene iniciar con artículos distintos. La compatibilidad con
dispositivos debe ser una relación explícita futura; no debe inferirse quitando
palabras del título, como hacía V1.

## 8. Ownership recomendado

### 8.1 Autoridades

| Información/acción | Owner recomendado | Consumidores |
|---|---|---|
| Item, clasificación, identifiers | Product Catalog | Pricing, Repair/Quoting, Inventory, Procurement, Caja |
| Precio base/ajuste/resolución | Pricing | búsqueda, Quoting, Caja, Reportes |
| Costo proveedor/oferta | Procurement futuro | Pricing, Inventory, Reportes |
| Costo de valoración y existencia | Inventory futuro | Quoting, Procurement, Reportes |
| Concepto ofrecido/autorizado | Quoting & Authorization futuro | Repair, Payments, Reportes |
| Pieza aplicada/instalada | Repair para hecho técnico | Inventory/Warranty |
| Reserva/consumo/movimiento | Inventory | Repair, Caja, Reportes |
| Venta/obligación/pago | Sales/Payments según discovery futuro | Caja, Repair, Reportes |
| Movimiento/apertura/cierre | Cash | Payments, Reportes |
| Pedido | contexto futuro por definir | Catalog, Inventory, Procurement |
| Solicitud/demanda | contexto futuro por definir | Catalog, Procurement, Reporting |
| Reporte | cada source conserva autoridad; Reporting proyecta | usuarios autorizados |

Para el primer ciclo puede existir una sola capacidad modular
`Catalog & Pricing` por cohesión y WIP, con ownership interno explícito. Eso no
autoriza a convertirla en owner permanente de stock, compras, Caja o Repair.
Antes de materializarla, Arquitectura deberá registrar el nombre, contratos,
dependencias y objetos conforme DEC-005/DEC-049.

### 8.2 Tratamiento inicial del costo

El Owner necesita importar costo antes de que Procurement/Inventory existan.
Por ello se propone `ReferenceCost`, etiquetado inequívocamente:

- fuente `manual` o `supplier_import`;
- archivo/batch y actor;
- Tenant o Branch objetivo;
- moneda y momento de observación;
- no se presenta como “costo promedio”, “última compra” o “valor de inventario”;
- acceso restringido por capability.

Cuando Compras/Inventory existan, publicarán costos autoritativos de su propio
lenguaje. Pricing podrá consumirlos o conservar snapshots, pero no escribir sus
tablas. Así se evita repetir ENL, donde una recepción local puede modificar un
costo global.

## 9. Alcance Tenant/Branch recomendado

### 9.1 Frontera principal

- **Identidad del artículo:** Tenant-scoped.
- **Categoría y extensión de marca:** Tenant-scoped; valores globales curados se
  consumen por referencia.
- **SKU/barcode interno:** únicos dentro del Tenant.
- **Precio base:** Tenant-scoped.
- **Ajuste:** Branch-scoped, siempre dentro del Tenant.
- **Precio efectivo:** se resuelve con Tenant + Branch confiables del servidor.
- **Stock, ubicación, movimientos y Caja:** Branch-scoped en sus futuros
  contextos.
- **Concepto aplicado:** Tenant + Branch + operación, con snapshot.

### 9.2 Escalar a muchas sucursales

Crear una copia del artículo por Branch multiplica duplicados y hace imposible
una actualización segura. Para evitar también cientos de overrides manuales se
recomienda modelar el ajuste de Branch mediante un **libro/perfil de precios
asignable**:

```text
Base Tenant
  ↓
Perfil de ajuste asignado a una o varias Branches
  ↓
Excepción específica de Branch, si se autoriza
  ↓
Precio efectivo con procedencia visible
```

Conceptualmente sigue siendo el ajuste de la Branch aceptado por ADR-004; el
perfil sólo reutiliza administración. El Owner debe decidir si el primer ciclo
necesita perfiles compartidos o únicamente base + excepción Branch. El modelo
no debe impedir añadirlos después.

“Restaurar precio de sucursal” debe significar **eliminar el override y volver a
heredar**, no copiar el precio base actual dentro de la Branch. Esta distinción
evita que cambios futuros del Tenant queden congelados silenciosamente.

## 10. Tipos, categorías y marcas

### 10.1 Tipos iniciales propuestos, todavía no contrato

| Tipo Owner | Semántica candidata | Sellable | Stockable | Purchasable | Repair |
|---|---|---:|---:|---:|---:|
| Refacción | componente usado o vendido para reparar | normalmente | normalmente | normalmente | sí |
| Producto | artículo físico de reventa | sí | normalmente | normalmente | opcional |
| Servicio | trabajo/capacidad comercial | sí | no | no | sí |
| Insumo | material consumible del taller | decisión | normalmente | sí | posible consumo |

El tipo no debe codificar todas las reglas. “Insumo no vendible” y “producto sin
tracking de stock” son combinaciones posibles; por eso se proponen capabilities
explícitas. El set inicial debe ser controlado. Añadir tipos nuevos requiere una
decisión de producto, no que cada fila invente una etiqueta.

### 10.2 Categoría

- Tenant-scoped y con ID estable.
- Inicialmente plana; no introducir jerarquía sin navegación real que la use.
- Puede limitarse o sugerirse por tipo, pero no formar parte de la identidad.
- Un valor nuevo de importación entra a reconciliación; no crea cien categorías
  por mayúsculas, acentos o errores.
- Renombrar conserva ID e historia.

### 10.3 Marca

- Opcional; útil principalmente para artículos físicos.
- Permite catálogo curado de plataforma + extensiones Tenant.
- La importación puede proponer marcas desconocidas a una cola de
  reconciliación.
- No reutilizar directamente `repair_brands` sin una decisión de shared catalog
  o mapping explícito. Similaridad lingüística no concede co-ownership.

## 11. SKU y código de barras

> **Decisión Owner posterior — PBI-040 Owner iteration (2026-09-11):** para el
> slice actual existen únicamente SKU y código de barras internos de SR Taller.
> El segundo puede representarse después con Code 128, pero la simbología no es
> otro identificador. Esta decisión sustituye las recomendaciones preliminares
> de GTIN/EAN/UPC y de un código interno separado; la auditoría histórica de
> V1/ENL se conserva como evidencia, no como contrato vigente.

### 11.1 Recomendación

- `itemId` es la identidad técnica inmutable.
- SKU es identificador humano interno, estable y único Tenant-wide.
- Un SKU aportado por Owner se normaliza y valida antes de reservarlo.
- Un SKU automático se genera server-side desde un namespace estable y una
  secuencia/entropía segura; no depende únicamente del título y no cambia al
  renombrar.
- Barcode se modela como el segundo scheme interno (`BARCODE`) y valor
  normalizado Tenant-wide; si falta se genera server-side y si llega explícito
  se preserva.
- Code 128 es una representación imprimible futura de ese mismo valor, no un
  scheme ni identificador adicional.
- El código del proveedor vive en `SupplierItemReference`, no en SKU.
- Una Branch no genera otro SKU para ajustar precio.

### 11.2 Matching por identificador

Orden recomendado de confianza:

1. `itemId` exportado previamente por SR Taller;
2. SKU interno Tenant-wide;
3. código de barras interno exacto;
4. `supplierId + supplierItemCode`;
5. sugerencia humana por título/marca/categoría.

El nivel 5 nunca actualiza automáticamente. Sirve para decir “posible
coincidencia”, no para fusionar.

## 12. Carga masiva y reconciliación

### 12.1 Principio

La importación no es “subir Excel y guardar”. Es un proceso de publicación con
evidencia:

```text
Upload → Mapear → Normalizar → Emparejar → Validar → Preview/Diff
       → Resolver conflictos → Aprobar → Aplicar draft → Publicar → Reportar
```

### 12.2 Entrada

- Soportar CSV y XLSX reales mediante parser controlado; no declarar formatos
  que el motor no entienda.
- La plantilla es versionada y descargable desde el producto.
- Para XLSX se leen valores calculados; las fórmulas siguen perteneciendo a
  Google Sheets/Excel, no se ejecutan como lógica de negocio en SR Taller.
- Locale, separador decimal, moneda y encabezados se declaran; `480`, `480.00`
  y `$480 MXN` no se interpretan por regex silenciosa.
- Imagen masiva puede aceptar URL/referencia en un slice posterior; no debe
  bloquear la primera importación de precios.

### 12.3 Dos contratos de archivo

Para evitar repetir artículos por cada Branch:

1. **Catálogo/base:** una fila por artículo con identidad, clasificación, costo
   de referencia y precio base; el wizard fija proveedor, moneda y target.
2. **Ajustes de Branch:** una fila por artículo + Branch/perfil con el precio o
   ajuste local; exige identificador determinista.

Una exportación de SR Taller debe incluir `itemId` para que futuras rondas sean
inequívocas, aunque el usuario siga viendo SKU/barcode.

### 12.4 Estados de fila

| Estado | Significado | Puede publicarse |
|---|---|---:|
| `CREATE` | identidad nueva y válida | sí |
| `UPDATE` | match determinista y diff permitido | sí |
| `NO_CHANGE` | mismo valor/version | no-op |
| `ERROR` | formato o regla inválida | no |
| `DUPLICATE_IN_FILE` | identificador repetido en el lote | no |
| `CONFLICT` | identificadores apuntan a artículos distintos | no |
| `AMBIGUOUS` | sólo parecido textual | no, requiere humano |
| `STALE` | cambió la versión desde preview | no, revalidar |

### 12.5 Semántica de actualización

- Vacío significa **no cambiar** por default.
- Cero es un valor explícito y distinto de vacío.
- Borrar requiere token/acción explícita (`CLEAR`) y permiso.
- Una fila ausente no desactiva el artículo.
- Un archivo de proveedor actualiza por default costo/oferta/precio permitido;
  no renombra identidad ni reclasifica automáticamente.
- Categoría/marca desconocida queda pendiente; el lote puede aplicar las filas
  seguras y reportar las bloqueadas sólo si la política de publicación parcial
  fue aprobada explícitamente.
- Duplicados de SKU/barcode/supplier code se resuelven antes del apply.

### 12.6 Atomicidad, concurrencia e idempotencia

- El preview conserva `expectedVersion` y se revalida al aplicar.
- `fileHash + templateVersion + targetScope + idempotencyKey` identifica el
  intento; un retry no duplica.
- Para miles de filas, se puede procesar en chunks internos, pero el público ve
  una revisión draft y un **publish atómico**. Nunca una mitad de la lista con
  precios nuevos y otra con precios viejos.
- El lote conserva archivo original, actor, Branch/Tenant target, timestamps,
  conteos y decisión por fila.
- El resultado ofrece CSV/XLSX descargable con errores y conflictos.
- Rollback comercial significa volver a publicar una revisión anterior o una
  revisión compensatoria; no borrar auditoría.

Este diseño aplica las reglas V2 de concurrencia, idempotencia, historial y
jobs/reports aislados, sin elegir todavía tablas ni tecnología de colas.[^11]

## 13. Flujo de actualización de proveedor

Ejemplo recomendado:

1. Proveedor entrega su lista.
2. Owner limpia nombres y columnas en Google Sheets y calcula precios con sus
   fórmulas.
3. Owner exporta CSV/XLSX.
4. En SR Taller elige proveedor, moneda, lista base o perfil/Branch y propósito
   `actualizar costos/precios`.
5. El sistema conserva el archivo y muestra mapping de columnas.
6. Empareja por `itemId`, SKU, barcode o código de proveedor.
7. Presenta: 820 actualizaciones, 135 sin cambio, 24 nuevas, 8 ambiguas y 3
   errores.
8. Owner resuelve ambiguas: vincular, crear o excluir.
9. Se revalida y aplica como revisión draft.
10. Owner autorizado publica.
11. SR Taller entrega reporte y deja trazabilidad.

En la siguiente lista del mismo proveedor, `SupplierItemReference` permite
comparar la oferta nueva con la anterior sin depender de cómo escribió el
título. La ausencia de una fila no significa que el proveedor la descontinuó;
esa es otra decisión explícita.

## 14. Búsqueda rápida para cotización

La primera experiencia debe responder en segundos sin fingir una cotización
formal:

- un solo campo que prioriza barcode/SKU exacto y después tokens de nombre;
- filtros por tipo, categoría y marca;
- resultados con imagen, título, tipo, categoría, marca, SKU y **precio efectivo
  de la Branch actual**;
- etiqueta visible `Base Tenant` o `Ajuste sucursal`;
- costo sólo con capability separada;
- cuando Inventory exista, disponibilidad como badge claramente independiente,
  con frescura visible;
- estados explícitos `sin precio`, `inactivo`, `precio vencido` o `sólo
  referencia`;
- búsqueda tolerante a acentos, pero nunca equivalencia destructiva OLED/LCD,
  original/genérico o modelo distinto.

La frase al empleado debe ser: “precio de referencia vigente en esta sucursal”.
Una promesa al cliente, descuento, vigencia o autorización pertenece a la futura
cotización.

## 15. Relación futura con Repair Concepts

Seleccionar un item no debe pegar un puntero vivo. Debe crear un snapshot con:

- `itemId` y versión/referencia;
- tipo y título mostrado;
- cantidad/unidad;
- precio unitario, moneda y total;
- fuente de precio y versión efectiva;
- costo de referencia snapshot, sólo si el caso lo necesita y está autorizado;
- Branch, actor, momento y correlación;
- override/promoción con actor, permiso y motivo;
- estado dentro de la cotización/decisión.

El catálogo responde “qué podría ofrecerse y a qué precio ahora”. Quoting
responde “qué se ofreció, en qué versión y qué aceptó el cliente”. Repair
responde “qué se necesitó y qué se ejecutó”. Inventory responde “qué se reservó
o consumió”. Esta separación soporta la autorización parcial ya validada en
V2.[^12]

Una `Venta personalizada` excepcional puede existir en el futuro, pero no debe
crear silenciosamente un artículo permanente. Debe conservar texto, precio,
actor y motivo como línea ad hoc.

## 16. Relación futura con Caja

Lista de precios no registra cobros. Caja tampoco debe modificar precios.

- Pricing entrega precio efectivo/procedencia.
- Sales/Quoting forma la obligación o línea comercial.
- Payments registra pago, aplicación, devolución y saldo.
- Cash registra entrada/salida física u operativa, caja/turno y conciliación.
- Reportes combinan proyecciones sin transferir ownership.

Ejemplo: consultar “Cambio de pantalla $1,399” no crea dinero. Autorizarlo crea
una obligación comercial futura. Recibir $500 crea un pago/aplicación; si fue
efectivo, además origina un movimiento de Caja. Son cuatro hechos distintos.

## 17. Relación futura con Inventory

Inventory referencia `itemId`, pero conserva su propia autoridad sobre:

- existencia por Branch/ubicación;
- disponibilidad;
- reserva/liberación;
- recepción, transferencia y ajuste;
- consumo y devolución;
- lote/serie si se validan;
- valoración de inventario cuando se decida.

Lista de precios puede funcionar antes de Inventory, como exige el roadmap. Un
resultado de búsqueda sin Inventory no debe mostrar `0 en existencia`; debe
mostrar “existencia no disponible”. Cuando exista, stock y precio siguen siendo
columnas distintas.

## 18. Relación futura con Compras

Procurement debe ser owner de:

- proveedor;
- orden de compra;
- oferta/código de proveedor;
- costo acordado/recibido;
- recepción comercial y su evidencia.

La recepción puede publicar un nuevo costo observado para consumo de Pricing o
Inventory. No debe sobrescribir directamente el costo de catálogo. El método de
costo —última compra, promedio ponderado, lote, Branch o Tenant— requiere su
propio discovery; V2 ya documenta costo como ownership desconocido.[^4]

## 19. Relación futura con Pedidos

`Pedido` todavía no tiene contrato Owner suficiente. Como frontera provisional:

- representa una intención/compromiso de surtir o vender, no una existencia;
- puede referenciar `itemId` y guardar snapshot de descripción/precio;
- no ajusta stock hasta que Inventory acepte una reserva/movimiento;
- no se confunde con orden de compra a proveedor;
- no pertenece al ciclo inmediato.

Antes de diseñarlo se necesita decidir si “Pedido” es pedido de cliente,
traspaso, encargo a proveedor o agrupación comercial; cada significado cambia
ownership y lifecycle.

## 20. Relación futura con Solicitudes de clientes

Una solicitud es una señal de demanda: “tres clientes preguntaron por batería de
iPhone 13 y no la tenemos”. Puede:

- referenciar un item existente;
- conservar descripción libre si el item aún no existe;
- registrar Branch, cliente/contacto autorizado, fecha, cantidad deseada y
  resultado;
- alimentar reportes o una futura decisión de compra.

No debe crear automáticamente catálogo, pedido, compra, reserva ni promesa. Su
valor es hacer visible demanda no satisfecha sin falsear compromisos.

## 21. Reportes futuros

Reporting debe consumir hechos con tiempo y procedencia:

- precio base y ajustes vigentes/anteriores;
- import batches, conflictos y cambios;
- consultas sin conversión, si se decide medirlas de forma no invasiva;
- conceptos ofrecidos/aceptados/rechazados;
- ventas, costos snapshot y margen explicable;
- demanda por solicitudes;
- compras y cambios de costo;
- stock/movimientos por Branch.

No calcular margen histórico con `precio actual - costo actual`. Debe usar los
snapshots y fuentes correspondientes al hecho reportado. Reportes tenant-wide
agregan Branches sin otorgar operación cruzada.[^1]

## 22. Riesgos principales

| Riesgo | Probabilidad/impacto | Mitigación de diseño |
|---|---|---|
| Falso match masivo | alto/crítico | IDs deterministas; fuzzy sólo sugerencia |
| Copias por Branch | alto/alto | identidad Tenant + capas de precio |
| Vacío convertido en cero | alto/alto | patch semantics explícita |
| Publicación parcial | medio/crítico | draft + publish atómico + idempotencia |
| Costo sin significado | alto/alto | `ReferenceCost` con fuente; valoración separada |
| Código interno tratado como formato externo | medio/alto | único barcode interno, normalización y representación Code 128 separada |
| Categorías/marcas duplicadas | alto/medio | canon + pending reconciliation |
| Precio nuevo reescribe Repair | medio/crítico | snapshots versionados |
| Branch sin precio visible | medio/alto | fallback/procedencia y estado explícito |
| Costo expuesto a empleado | medio/alto | capability y proyección mínima |
| Un Branch altera costo global | medio/alto | scope/proveedor/valoración separados |
| Servicio forzado a modelo de stock | alto/medio | tipos + capabilities |
| Import de miles bloquea operación | medio/alto | job limitado + staging + publicación |
| Proveedor renombra y duplica items | alto/alto | supplier reference y reconciliación |
| Reporte usa valores actuales | alto/alto | hechos/snapshots temporales |
| Orden downstream contradictorio | medio/alto | reconciliar roadmap vs PBI-039 antes de PBIs futuros |
| IA contradictoria | medio/medio | decisión Owner y actualización canónica posterior |

## 23. Ledger de decisiones Owner

Las decisiones aprobadas se muestran como resueltas; las decisiones técnicas
delegadas se resolvieron en la arquitectura sin reescribir la recomendación
histórica de este discovery.

| ID | Decisión | Recomendación de partida | Urgencia |
|---|---|---|---|
| PLD-001 | ¿Confirmar los cuatro tipos? | Refacción, Producto, Servicio, Insumo + capabilities | Resuelta Owner |
| PLD-002 | ¿Insumo aparece en búsqueda/venta? | no; si se vende se modela Producto | Resuelta Owner |
| PLD-003 | ¿Quién ve costo? | capability separada; backend omite sin permiso; preferencia personal default oculta | Resuelta Owner |
| PLD-004 | ¿Qué significa costo inicial? | Reference Cost opcional con procedencia, no valoración | Resuelta Owner |
| PLD-005 | ¿Base + Branch o perfiles compartidos desde inicio? | base Tenant + override Branch; perfiles después | Resuelta Owner |
| PLD-006 | ¿Moneda e impuestos? | Tenant operating currency; Avicell MXN; sin FX/impuestos iniciales | Resuelta Owner |
| PLD-007 | ¿Matching masivo permitido? | ID/SKU/barcode, supplier code opcional o history exacta; fuzzy manual | Resuelta Owner; refinada por OD-BI-001/009 |
| PLD-008 | ¿Aplicación con errores? | unresolved/conflict/invalid/stale = 0; pending referencia deliberada y exclusión explícita permitidas | Resuelta Owner; refinada por OD-BI-004 |
| PLD-009 | ¿SKU automático por default? | sí si falta, server-side, Tenant-wide | Resuelta técnica |
| PLD-010 | ¿Código de barras automático? | si falta, server-side; barcode interno único y Code 128 sólo representación | Sustituida por decisión Owner de iteración PBI-040 |
| PLD-011 | ¿Categoría plana? | sí, Tenant-scoped, lifecycle | Resuelta técnica |
| PLD-012 | ¿Marca compartida con Repairs? | CommercialBrand separada; mapping futuro explícito | Resuelta técnica |
| PLD-013 | ¿Precios programados/vigencia? | history/effectiveFrom desde inicio; sin scheduling/backdating UI | Resuelta técnica |
| PLD-014 | ¿Historia y rollback visibles? | revisions desde inicio; rollback masivo posterior | Resuelta técnica |
| PLD-015 | ¿Imágenes obligatorias? | opcionales, PBI-042 después de Files | Resuelta técnica |
| PLD-016 | ¿Venta personalizada? | sólo futura, con permiso y motivo | posterior |
| PLD-017 | ¿Secuencia Quote/Caja/Repair Concepts? | reconciliar roadmap y PBI-039 después de Price List | posterior |
| PLD-018 | ¿IA `Listas` reemplaza `Operación > Lista de precios`? | sí; sólo Lista de precios inicialmente, sin placeholders | Resuelta Owner |
| PLD-019 | ¿Qué significa Pedido? | validar con 3 escenarios reales antes de modelar | posterior |
| PLD-020 | ¿Qué datos guarda Solicitud? | discovery separado; no iniciar ahora | posterior |

## 24. Propuesta de slices/PBIs de implementación

Esta sección conserva la descomposición propuesta durante discovery. Las
decisiones posteriores crearon EPIC-015; PBI-040 es `Done candidate`, PBI-041
es Ready/no autorizado y PBI-042 Planned/Unassigned. Esas fuentes posteriores
prevalecen.

### Slice 0 — Contrato Owner y readiness

- Resolver PLD-001 a PLD-008 y PLD-018.
- Nombrar owner modular y contratos públicos.
- Reconciliar roadmap/IA sólo en sus fuentes autorizadas.
- Threat model de importación, imágenes y costo.

### Slice 1 — Catalog foundation

- Item Tenant-wide, tipos/capabilities, categorías, marcas e identifiers.
- Lifecycle activo/inactivo e historia mínima.
- Sin inventario, compras, Caja ni Repair Concepts.

### Slice 2 — Pricing foundation multisucursal

- Precio base, ajuste Branch/perfil, resolución efectiva y procedencia.
- Moneda/vigencia y query contract.
- Sin promociones, impuestos complejos ni cotización formal.

### Slice 3 — Alta individual Owner-friendly

- Crear/editar con título, descripción, imagen, costo de referencia, precio,
  categoría, marca, SKU y barcode.
- Campos condicionales por tipo y generación segura de identificadores.
- Historia, permisos y conflictos visibles.

### Slice 4 — Lista y búsqueda rápida

- Búsqueda unificada, filtros y precio efectivo Branch.
- Escaneo exacto SKU/barcode.
- Cost visibility separada y estados sin precio.

### Slice 5 — Bulk import foundation

- **Propuesta histórica sustituida:** CSV/XLSX/template como entrada inicial.
- **Contrato vigente:** Composer durable con paste, Source/Version/Listing,
  mapping, preview/diff, idempotencia, apply atómico y reporte; CSV/XLSX son
  adapters futuros del mismo engine.
- Sólo Catalog/precio base/Reference Cost; Branch overrides intactos.

### Slice 6 — Supplier update/reconciliation

- **Contrato vigente:** SupplierSource mínimo, no Supplier maestro; comparación
  básica entre versiones, mapping persistente y actualización no destructiva.
- Reconciliación sistemática/tags/grupos queda como outcome avanzado diferido
  sin PBI ID/readiness.

### Slices futuros, fuera del ciclo inmediato

1. Consumidor de precio para Quote/Repair Concepts con snapshot y decisión por
   línea.
2. Consumidor Sales/Caja sin transferir ownership del precio.
3. Inventory: stock, disponibilidad, reservas y movimientos por Branch.
4. Procurement: compras, recepción y costo autoritativo.
5. Reporting: historia de precio/costo, margen y demanda.
6. Pedidos.
7. Solicitudes de clientes.

## 25. Criterios de readiness sugeridos para el futuro PBI inicial

Un PBI de implementación no debería declararse Ready hasta que:

- PLD-001 a PLD-008 tengan respuesta Owner;
- el owner modular y la frontera Catalog/Pricing estén revisados;
- base/ajuste/perfil tengan precedencia y semántica de reset;
- costo de referencia no se confunda con valoración;
- SKU/barcode tengan namespaces y reglas de duplicado;
- bulk import tenga matching, blank/zero/clear, atomicidad e idempotencia
  acordados;
- el primer slice excluya explícitamente Inventory, Caja, Repair Concepts,
  Pedidos y Solicitudes;
- exista escenario Owner de una Branch y de muchas Branches;
- exista ejemplo de primera importación y de actualización del mismo proveedor;
- el roadmap, IA y checklist se reconcilien mediante autoridad separada.

## 26. Recomendación para Owner Review

La decisión más pequeña que desbloquea buen diseño no es “qué columnas tendrá la
tabla”, sino confirmar esta frase:

> Un artículo tiene una identidad compartida por el Tenant; cada Branch consulta
> un precio efectivo derivado de una base y un ajuste explicable; importar una
> lista propone cambios versionados y reconciliables, y toda operación futura
> conserva su propio snapshot.

Si el Owner acepta esa frontera, la siguiente sesión debe resolver PLD-001 a
PLD-008 con tres ejemplos concretos:

1. una pantalla con dos calidades y dos proveedores;
2. un servicio sin inventario con precio diferente en dos Branches;
3. una actualización de 1,000 filas donde 20 cambiaron de SKU/nombre, 5 tienen
   barcode duplicado y 30 no aparecen en el archivo nuevo.

No se recomienda implementar primero un CRUD genérico ni portar el motor de V1.
El primer valor visible debe ser una búsqueda de precio confiable apoyada por
identidad y resolución multisucursal correctas; el bulk import debe entrar como
slice propio, no como script auxiliar sin dominio.

## Fuentes

[^1]: SR Taller 2.0, [ADR-004 Shared-schema Multitenancy](../decisions/proposed/ADR-004-shared-schema-multitenancy.md), líneas 127–186 y 236–254: catálogo/precio base Tenant, ajuste Branch, precedencia y snapshot histórico.
[^2]: SR Taller 1.0, SHA `9357b8629ed320f690ee07d106660020ce8b42e3`: `public_html/sistema/views/inventario/actualizacion_precios.php`; `public_html/sistema/funciones/actualizacion_precios/js/actualizacion_precios.js`, líneas 1–240 y 402–480; endpoints `obtener_productos_variantes.php` y `guardar_actualizacion.php`. Todas las rutas funcionales auditadas están bloqueadas por `legacy_lockdown.php`.
[^3]: ENL, SHA `6140a2375f221cb2ddadb0f4f65d839aae90381a`: búsqueda de `csv`, `xlsx`, `Papa.parse`, `PhpSpreadsheet`, `SpreadsheetReader` e import/catalog/price en árbol y todas las refs Git sin coincidencia de importador de catálogo/precio. La afirmación se limita a ese checkout y referencias alcanzables.
[^4]: SR Taller 2.0, [Money Model](MONEY_MODEL.md), líneas 13–54; [Inventory Domain](INVENTORY_DOMAIN.md), líneas 15–67 y 93–124; [Ownership Matrix](OWNERSHIP_MATRIX.md), líneas 53–76.
[^5]: SR Taller 1.0, mismo SHA: `public_html/sistema/views/compras/crear_producto.php`, líneas 6–145; `public_html/sistema/funciones/crear_producto/js/crear_producto.js`, líneas 1–246; `guardar_en_bd_interna.php`, líneas 20–117; `generar_codigo_barras.php`, líneas 23–52.
[^6]: SR Taller 1.0, mismo SHA: `public_html/sistema/funciones/inventario/funciones/obtener_productos.php`, líneas 70–181; `orden_de_compra/funciones/actualizar_inventario_interno.php`, líneas 30–45; `pos/funciones/guardar_pago_directo.php`, líneas 160–203.
[^7]: ENL, mismo SHA: `sql/main/db2pcbusqfkk6v.sql`, definiciones `products` 1599–1626, `product_stock` 1684–1690, `purchase_orders` 1706–1740, `services` 1748–1766, `order_items` 1255–1267 y `work_order_items` 1943–1956.
[^8]: ENL, mismo SHA: `views/admin/product_detail.php`; `admin/acciones/product_save.php`, especialmente validación, barcode 146–155, persistencia 173–304 e imágenes 306–370.
[^9]: ENL, mismo SHA: `app/acciones/work_order_item_add.php`, líneas 84–120 y 187–232; `work_order_item_price_update.php`, líneas 16–22, 104–138 y 172–301; `purchase_order_receive_confirm.php`, líneas 26–264; `sql/migrations/2026_05_09_product_cost_history.sql`; `app/helpers/purchase_orders.php`, líneas 612–753.
[^10]: ENL, mismo SHA: `app/acciones/search_items.php`, líneas 10–54; `product_search.php`; `service_search.php`; `pos_order_item_add.php`, líneas 138–200.
[^11]: SR Taller 2.0, [DEC-049 Persistence Ownership](../decisions/dec-049-persistence-ownership/DECISION_PROPOSAL.md), líneas 252–360; [Data Architecture](../architecture/DATA_ARCHITECTURE.md), líneas 51–76 y 158–210.
[^12]: SR Taller 2.0, [Modelo comercial integrado](../domain-model/integrated-repair-domain-model/MODELO_COMERCIAL_INTEGRADO.md), líneas 3–59; [Cotizaciones y decisiones por concepto](../domain-validation/reception-minimum-and-commercial-authorization/COTIZACIONES_Y_DECISIONES_POR_CONCEPTO.md), líneas 3–89.
[^13]: SR Taller 2.0, `architecture/dec-005-policy.json`, líneas 1–80; `src/infrastructure/database/migrations/20260908123000_repairs_create_brand_catalog.ts`, líneas 5–106.
[^14]: SR Taller 2.0, [PBI-039](../backlog/pbis/PBI-039.md), líneas 124–152 y 1845–1879; `apps/dev-preview-web/src/pages/RepairDetailPage.tsx`, líneas 566–573; `src/modules/repairs/domain/new-repair-field-policy.ts`, líneas 52–54.
[^15]: SR Taller 2.0, [MVP Operating Roadmap](../product/MVP_OPERATING_ROADMAP.md), líneas 108–125; [Dependency Map](../backlog/DEPENDENCY_MAP.md), líneas 33–46 y 109–113; [EPICS](../backlog/EPICS.md), líneas 96–164.
[^16]: SR Taller 2.0, [Design System and Application Shell V1](../design-system/DESIGN_SYSTEM_AND_APPLICATION_SHELL_V1.md), líneas 205–218 y 327–343; dirección Owner de este Master Goal para la navegación futura `Listas`.
[^17]: SR Taller 2.0, verificación read-only del 2026-09-11: merge `40684d7554cdf02551f941e5e3f0beabbe563125` en `main`/`origin/main` y [Authoritative Linux CI `34623060504`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34623060504) con conclusión `success`; [Current State](../CURRENT_STATE.md), líneas 1–16, define ese merge + CI exacta como gate de materialización.

PRICE LIST DOMAIN DISCOVERY

OWNER REVIEW COMPLETED — DECISIONS PROMOTED
