# Arquitectura de Catálogo y Lista de precios

## Estado y autoridad

- **Estado:** Accepted; PBI-040 baseline 2026-09-11, bulk architecture/
  readiness 2026-09-13 y retiro seguro `OD-RESET-001..005` reconciliado
  2026-09-14.
- **Autoridad de producto:** decisiones Owner `PLD-001` a `PLD-008` y
  `PLD-018`, aprobadas en `MASTER GOAL — PRICE LIST ARCHITECTURE + PBI
  READINESS`.
- **Autoridad técnica:** este documento resuelve las decisiones técnicas
  delegadas por el mismo Master Goal dentro de ADR-002/004/010/011/012/013,
  DEC-005, DEC-044, DEC-049, DEC-050 y DEC-051.
- **Alcance:** frontera lógica y contratos de entrega. No materializa módulos,
  tablas, migraciones, endpoints, UI, jobs ni integraciones.
- **Discovery de origen:** [Price List Domain Discovery](../domain/PRICE_LIST_DOMAIN_DISCOVERY.md).
- **Bulk discovery y decisiones:**
  [Price List Bulk Composer](../domain/PRICE_LIST_BULK_IMPORT_AUDIT_AND_DOMAIN_DESIGN.md),
  con `OD-BI-001..010` aprobadas el 2026-09-13.
- **Retiro seguro:** decisiones Owner `OD-RESET-001..005`, aprobadas el
  2026-09-14 durante Owner Review de PBI-041.

## Tenant catalog field policy foundation

Catalog quality configuration is Tenant-wide. Its persistent authority is a
versioned policy head plus append-only versions; a missing Tenant row resolves
to product defaults. The policy registry is finite and domain-fixed FULL
minimums (Type, Title, Category and Base Price) cannot be weakened. Read and
manage access are explicit `catalog.configuration.*` permissions and each is
composed with the corresponding reference-cost permission because the policy
includes the sensitive Reference Cost field. This foundation does not alter
Composer capture, Analyze, Apply or manual Catalog mutations until a later
authorized consumer adopts it.

The Bulk Catalog Composer consumer validates `REQUIRED` against the effective
resulting value: incoming explicit data or a safely resolved, preserved
`CatalogItem` value may satisfy it; SupplierSource defaults, observation
history, title parsing and ambiguous identity never may. Analyze records typed
reconciliation attention before applicability. Apply rereads the current
Tenant policy inside its transaction, protecting against a stale analysis or a
direct request. Policy revisions are deliberately not snapshot on a Supplier
CatalogVersion; the current policy is authoritative at Reanalyze and Apply.
`ESSENTIAL` and `OPTIONAL` do not block, and an excluded row is not an
effective mutation.

## Resultado ejecutivo

SR Taller tendrá una identidad de artículo compartida por Tenant y un precio
efectivo calculado para la Branch confiable. El primer ciclo materializará un
único módulo funcional `catalog`, con dos responsabilidades internas explícitas:

1. **Catalog:** identidad, tipo, categorías, marcas comerciales e
   identificadores.
2. **Pricing:** precio base, override de Branch, costo de referencia e
   historial de revisiones.

No son dos módulos físicos ni dos desplegables. Separarlos ahora obligaría a
crear contratos y coordinación antes de que exista un consumidor independiente;
fusionarlos sin nombres internos ocultaría ownership. Se reconsiderará una
separación física cuando Pricing tenga reglas, ciclo o consumidores que cambien
independientemente del catálogo.

`Lista de precios` es una proyección de consulta del módulo `catalog`, no un
agregado, inventario ni libro de Caja.

## 1. Modelo conceptual aceptado

| Concepto | Identidad y alcance | Autoridad | Invariante inicial |
|---|---|---|---|
| `CatalogItem` | ID opaco, Tenant | `catalog` | una identidad no se copia por Branch |
| `ItemKind` | `PART`, `PRODUCT`, `SERVICE`, `SUPPLY` | `catalog` | el tipo no sustituye capacidades |
| `ItemCapability` | sellable, stockable, purchasable, applicable-to-repair | `catalog` por ahora | cada flujo valida capability, no infiere sólo del tipo |
| `CommercialCategory` | Tenant, plana | `catalog` | obligatoria; activa/inactiva; sin árbol inicial |
| `CommercialBrand` | Tenant | `catalog` | opcional; distinta de `repair_brands` |
| `ItemIdentifier` | Tenant + scheme + valor normalizado | `catalog` | unicidad y no reutilización por scheme |
| `BasePriceRevision` | Tenant + item + moneda + vigencia | `catalog` / Pricing | append-only; un valor efectivo a la vez |
| `BranchPriceOverrideRevision` | Tenant + Branch + item + vigencia | `catalog` / Pricing | sustituye la base; revocar restaura herencia |
| `ReferenceCostRevision` | Tenant + item + moneda + fuente | `catalog` / Pricing | opcional, interno y no contable |
| `SupplierSource` | ID opaco, Tenant | `catalog` | fuente externa mínima; no es Supplier de Procurement |
| `SupplierCatalogVersion` | Tenant + source + version ID | `catalog` | fotografía inmutable después de `INGESTED`; corrección crea otra versión |
| `SupplierListing` | Tenant + version + listing ID | `catalog` | observación externa, no identidad comercial |
| `SupplierListingResolution` | Tenant + listing + secuencia | `catalog` | historia append-only de mapping/corrección humana |
| `SupplierReconciliationMemory` | Tenant + source + firma versionada | `catalog` | proyección reconstruible; exactitud no crea alias canónico |
| `CatalogUpdateBatch` | Tenant + batch ID | `catalog` | intención de mutar Catalog separada de la evidencia del proveedor |
| `CatalogUpdateRowDecision` | Tenant + batch + row ID | `catalog` | decisión/diff/version esperada por fila |
| `CatalogRetirementPlan` | Tenant + plan ID | `catalog` | fotografía server-side temporal del conjunto activo y su hash; ligada a actor/Branch/Station/Session |
| `CatalogRetirementEvent` | Tenant + event ID | `catalog` | evidencia append-only de ejecución o rechazo, con sensibilidad y reautenticación |

Un Supplier legal/comercial, compras, existencias, pagos, movimientos de Caja,
Repair Concepts, pedidos y solicitudes de clientes no pertenecen a `catalog`.

## 2. Tipos, capacidades y visibilidad

Los cuatro tipos iniciales son:

| Tipo | Uso | ¿Lista de precios? | Defaults de capability |
|---|---|---:|---|
| Refacción | parte física aplicada o potencialmente aplicada a una Repair | Sí | sellable, stockable, purchasable, applicable-to-repair |
| Producto | bien para reventa, incluido un termo u otro no telefónico | Sí | sellable, stockable, purchasable |
| Servicio | trabajo cobrable, interno o tercerizado | Sí | sellable, applicable-to-repair; no stockable |
| Insumo | bien de consumo interno | No | stockable/purchasable; no sellable por default |

Un bien interno que deba venderse al público se registra como Producto. Cambiar
capabilities no cambia automáticamente su tipo ni borra historia. El primer PBI
no ofrece edición libre de capabilities: aplica defaults gobernados y permite
que el modelo evolucione sin usar el tipo como contrato eterno.

Los artículos tienen lifecycle `ACTIVE` / `INACTIVE`. Inactivar los retira de
búsquedas operativas y nuevas selecciones; no borra revisiones, identificadores
ni snapshots. Los artículos y sus identificadores no tienen hard delete
ordinario y los identificadores retirados no se reutilizan. Una referencia
canónica administrativa sí puede eliminarse físicamente cuando su owner
revalida, dentro de una transacción, que no existe uso canónico ni dependencia
estructural que requiera integridad. La historia de negocio nunca se elimina en
cascada.

## 3. Alcance Tenant/Branch y precio efectivo

- Identidad, categoría, marca, identificadores, moneda operativa y precio base:
  Tenant-scoped.
- Override: Tenant + Branch; la Branch debe pertenecer al mismo Tenant.
- Contexto operativo: Tenant y Branch siempre derivan de estación/sesión
  confiables. Nunca se aceptan libres desde el cliente.
- Administración tenant-wide usa su contexto administrativo explícito; no
  simula una estación ni enumera otro Tenant.

Resolución inicial:

```text
effectivePrice(item, trustedBranch, instant)
  = active Branch override at instant
  ?? active Tenant base price at instant
  ?? NOT_PRICED
```

La respuesta incluye `amount`, `currency`, `source` (`BRANCH_OVERRIDE` o
`TENANT_BASE`), `priceRevisionId` y `effectiveFrom`. Revocar un override agrega
una revisión de terminación; no copia el precio base vigente. Perfiles
compartidos están reservados para un PBI posterior y podrán insertarse entre
base y Branch sin migrar identidad.

Precio inicial significa precio final mostrado al cliente. Impuestos,
facturación, descuentos, FX y múltiples monedas concurrentes quedan fuera.

## 4. Moneda y temporalidad

`tenancy` es owner de `Tenant.operatingCurrency` porque es configuración de la
organización, no del artículo ni de una Branch. `catalog` la consume mediante un
contrato público mínimo. Avicell inicia configurado en `MXN`; no se permite
hardcodear MXN en dominio, API o UI.

En el primer ciclo:

- cada Tenant tiene exactamente una moneda ISO-4217 configurada;
- precios y costos importados deben coincidir con ella;
- cambiar moneda después de publicar precios no está habilitado y requiere un
  PBI de conversión/reconciliación explícito;
- toda revisión conserva moneda aunque la configuración futura cambie;
- `effectiveFrom` es el instante de commit del servidor; no hay backdating ni
  programación futura inicial;
- base, override y costo se conservan como revisiones append-only con actor,
  fuente, correlation y versión esperada.

## 5. Categorías, marcas e imágenes

Categorías son Tenant-scoped, planas, obligatorias y con lifecycle. Cada
categoría declara exactamente un tipo comercial aplicable; el servidor rechaza
asignaciones incompatibles y la UI filtra el combobox por el Tipo vigente. Una
categoría inactiva permanece visible en historia pero no se asigna a nuevos
artículos. Jerarquías, tags y categorías Platform quedan diferidos.

`CommercialBrand` es Tenant-scoped, opcional, tiene una sola identidad por
nombre normalizado dentro del Tenant y puede declarar uno o varios tipos
aplicables. No se duplica por categoría. Tampoco comparte tabla ni identidad con
el catálogo `repair_brands`: Apple como fabricante comercial y Apple como marca
del equipo pueden verse iguales sin ser la misma autoridad. Una futura relación
explícita puede mapear ambos IDs mediante contratos; no hay sync por nombre ni
promoción automática.

Un valor nuevo capturado explícitamente desde el combobox operativo no nace como
categoría o marca canónica. El alta del artículo conserva el texto normalizado en
una referencia pendiente propia de `catalog`, junto con Tipo aplicable, actor,
Branch, Station, Session, primera/última observación y cantidad de usos. Un blur
o cancelar el formulario nunca persisten una referencia.

Configuración > Catálogos > Lista de precios es la superficie de reconciliación.
`Resolver` ofrece exactamente dos resultados: asociar a una referencia canónica
activa y compatible, o crear una referencia canónica con nombre, aplicabilidad y
lifecycle gobernados. Ambos resultados reasignan los artículos de forma
transaccional a la identidad canónica y conservan intactos el valor capturado y
su trazabilidad. No existe una identidad provisional en `catalog_categories` o
`catalog_brands`, ni acciones distintas de “aprobar” o “fusionar” para expresar
la misma decisión.

La administración expone un contexto de Tipo con default `Todos` para Category
y Brand, tanto en canónicas como en pendientes. Category coincide por su único
Tipo; Brand coincide cuando su conjunto de aplicabilidad incluye el Tipo. La
proyección consume el mismo contrato de aplicabilidad que Nuevo artículo y no
mantiene una matriz paralela de combinaciones.

La identidad de Category es `Tenant + Type + normalizedName`; por ello el mismo
nombre puede existir en Tipos distintos, pero nunca dos veces dentro del mismo
Tipo. Brand conserva identidad `Tenant + normalizedName` y aplicabilidad
multi-Tipo. La normalización exacta común hace trim, case folding español,
colapsa espacios y elimina marcas diacríticas mediante NFD. No aplica stemming,
singular/plural ni fuzzy matching: `Pantalla` y `Pantallas` siguen siendo
decisiones humanas distintas.

Antes de persistir una captura pendiente, el servidor serializa la identidad y
busca primero el canon activo del mismo Tenant/contexto. Una coincidencia exacta
de Category se reutiliza; una Brand exacta se reutiliza y, si falta el Tipo, se
amplía su aplicabilidad dentro de la misma transacción y audit del alta. Un lock
de identidad Tenant-scoped coordina carreras entre alta canónica, captura y
edición; los uniques físicos conservan Category por Tenant+Type y Brand por
Tenant. Los conflictos son tipados y nunca revelan coincidencias de otro Tenant.

Una captura histórica que ya duplique al canon no se borra: Reconciliación la
preselecciona y asocia al canon compatible, conserva texto, actor, Branch,
Station, Session, primera/última observación y usos, y registra destino/resultado
en audit. Crear otro canon queda deshabilitado en UI y rechazado server-side.

El lifecycle administrativo usa una regla común, con consulta de dependencias
propia de cada bounded context:

- referencia activa sin uso ni dependencia: `Editar | Eliminar`;
- referencia activa usada: `Editar | Desactivar`;
- referencia inactiva usada: `Editar | Reactivar`;
- captura pendiente: `Resolver`.

La elegibilidad del read model sólo orienta la UI. El backend bloquea la
referencia, vuelve a consultar uso canónico y dependencias estructurales y
responde un conflicto tipado si apareció una referencia concurrente. Los
eventos de eliminación conservan el snapshot previo y no dependen de que la
fila canónica siga existiendo.

Una referencia canónica puede descubrirse posteriormente como duplicada de
otra. Esa decisión usa `Canonical Merge`, no `Edit`, `Resolve` ni hard delete:

- `Edit` conserva la identidad y modifica sus atributos;
- `Resolve` asigna identidad canónica a una captura todavía pendiente;
- `Canonical Merge` consolida dos o más identidades previamente aceptadas en
  una superviviente explícita.

Category sólo permite merge dentro del mismo Tenant y Tipo. Brand permite merge
dentro del Tenant y el resultado conserva la unión de Tipos aplicables. En una
única transacción el servidor bloquea las referencias y sus recursos
dependientes, revalida versión, lifecycle, Tenant y compatibilidad, reasigna
artículos y destinos de pendientes resueltos, materializa la identidad
superviviente y registra el evento append-only. Un fallo revierte todo el
comando; las carreras con alta, edición, eliminación, reconciliación u otro
merge se serializan o terminan en conflicto tipado.

La fuente queda marcada con `mergedIntoId`, actor y timestamp. Deja de aparecer
en listas, filtros y selecciones ordinarias, pero no se borra ni se convierte en
una referencia `unused` eliminable. El evento de merge conserva Tenant, fuentes,
superviviente, nombres anteriores, relaciones reasignadas, aplicabilidad antes y
después y metadata de actor/correlation. Los counts se recalculan sobre las
relaciones reasignadas y el survivor tampoco es hard-deletable mientras sea
destino de esa historia.

Nuevo artículo y Editar artículo usan el mismo combobox y el mismo resolvedor
server-side de Category/Brand. En ambos flujos una coincidencia exacta reutiliza
canon, Brand puede ampliar aplicabilidad de forma auditada y un valor realmente
nuevo crea una captura pendiente con uso, actor y first/last seen; nunca crea
canon silenciosamente.

El Analyze de una carga `FULL` sin identidad existente puede clasificar una
fila como `NEW` cuando sus referencias no canónicas sean capturables de forma
segura. Esa clasificación conserva el valor raw y metadata de captura pending,
pero no escribe ningún recurso durable. La captura se realiza exclusivamente
por el Apply autorizado y transaccional, mediante el mismo resolvedor anterior.
Inputs ambiguos, desplazados o malformados, required faltantes, candidates,
duplicados y filas `COMPACT` sin target no obtienen este camino y permanecen
atención explícita; no hay fuzzy matching ni creación canónica automática.

### 5.1 Patrón transversal de reconciliación

Repairs y Catalog comparten este lenguaje de producto:

```text
Referencia capturada → Reconciliación pendiente → Referencia canónica
```

Compartir el patrón y las primitives de interacción no une los bounded contexts.
Cada módulo conserva sus tablas, IDs, normalización, reglas de compatibilidad,
eventos y capabilities. La resolución nunca reescribe la captura histórica: deja
registrados texto original, primera/última observación, actor, uso, resultado y
destino canónico. Las búsquedas y filtros operativos enumeran únicamente
referencias canónicas activas; un artículo pendiente sigue siendo visible sin
convertir su captura en una opción de filtro.

La imagen es metadata opcional del artículo, nunca identificador ni criterio de
matching. `Files` será owner del objeto binario y `catalog` de la asociación de
negocio. Como Files no está materializado, imagen queda en PBI-042; PBI-040 no
acepta URLs externas permanentes ni crea almacenamiento lateral.

## 6. SKU, código de barras y normalización

### SKU

- Todo artículo activo tiene un SKU interno Tenant-wide.
- Si el usuario no aporta uno, el servidor genera uno al crear: prefijo estable
  por tipo (`REF`, `PRO`, `SER`, `INS`) + secuencia opaca del Tenant, por ejemplo
  `REF-000042`.
- El título nunca participa en identidad ni en la generación.
- Un SKU aportado se recorta, normaliza a mayúsculas y acepta `A-Z`, `0-9`, `.`,
  `_` y `-`; la forma normalizada debe ser única dentro del Tenant.
- La concurrencia se resuelve con constraint + reserva transaccional; no con
  `check then insert` en navegador.

### Código de barras

Todo artículo tiene un código de barras interno Tenant-wide. Si queda vacío, el
servidor lo genera con una secuencia opaca, por ejemplo `SR00000042`; si se
aporta, lo recorta, normaliza a mayúsculas, valida y preserva. El valor puede
representarse posteriormente con simbología Code 128: esa simbología no crea un
tercer identificador ni cambia el valor de dominio. Un valor exacto identifica
como máximo un item dentro del Tenant. No hay GTIN, EAN, UPC ni código de
fabricante en PBI-040.

Un código de proveedor, cuando existe, pertenece a la observación/versionado de
`SupplierListing` y puede ser señal de reconciliación. Es opcional y nunca se
promueve a SKU, barcode, alias canónico ni ID de URL. Los IDs de URL siguen
siendo opacos: SKU/barcode no habilitan enumeración ni autorización.

## 7. Costo de referencia y menor privilegio

`ReferenceCost` es opcional y puede ser manual, importado, estimado para un
servicio o directo de un tercero. Cada revisión declara `sourceType`, fuente
humana/import batch, `observedAt` y actor. No es costo promedio, última compra,
valuación de inventario ni autoridad contable.

Capacidades iniciales:

| Capability | Permite |
|---|---|
| `price_list.read` | consultar artículos vendibles y precio efectivo |
| `catalog.manage` | Category/Brand y compatibilidad transitoria de item; no reemplaza los sucesores explícitos |
| `catalog.items.create` | crear CatalogItem; requiere además `catalog.prices.manage` y costo cuando corresponda |
| `catalog.items.update` | corregir atributos no financieros de un CatalogItem |
| `catalog.items.deactivate` | desactivar/reactivar un CatalogItem individual; no concede retiro masivo ni hard delete |
| `catalog.prices.manage` | cambiar precio base |
| `catalog.branch_prices.manage` | crear/revocar override de Branch autorizada |
| `catalog.reference_cost.read` | recibir costo de referencia |
| `catalog.reference_cost.manage` | registrar/corregir costo de referencia |
| `catalog.import.read` | consultar fuentes, versiones, diff, coverage y resultados de carga sin preparar |
| `catalog.import.prepare` | crear, editar, analizar y resolver un batch sin publicar; conserva compatibilidad temporal de lectura heredada |
| `catalog.import.publish` | publicar un batch `READY`, compuesta con las authorities de efecto reales |
| `catalog.items.bulk_retire` | preparar y ejecutar retiro masivo de CatalogItems; no concede hard delete ni reversión de updates |
| `catalog.suppliers.delete` | eliminar una SupplierSource sólo cuando toda su historia sea borrador seguro; no concede delete de CatalogItem ni de evidencia publicada |

La API de búsqueda omite el campo de costo salvo que el request pida
`includeReferenceCost=true` y el servidor confirme
`catalog.reference_cost.read`. Sin capability nunca se devuelve el valor, ni
como `null`, metadata, error diferencial, export o sugerencia. Para un usuario
autorizado, la preferencia `priceListShowReferenceCost` pertenece a `users`, es
personal, inicia `false` y sólo controla si el cliente solicita/muestra el dato;
no concede permisos.

La transición UX-004.1 conserva roles existentes por **capability**, nunca por
nombre: `catalog.manage` recibe los tres sucesores de item y
`catalog.import.prepare` recibe `catalog.import.read`. No se otorgan por esta
migración publish, retiro masivo, borrado de proveedor, precio, costo, Branch
price ni configuración. El servidor conserva el fallback de `catalog.manage`
para las operaciones individuales mientras Category/Brand siga bajo esa
authority; `catalog.import.read` no permite preparar un batch.

UX-004.2 conecta ese registry con Lista de precios sin colapsar lectura y
mutación: `price_list.read` permite lista, filtros, precio efectivo y detalle
comercial seguro; no recibe costo de referencia. El endpoint de detalle no
exige `catalog.manage` y no serializa costo. La creación exige
`catalog.items.create` más `catalog.prices.manage` por el precio base
obligatorio, y añade `catalog.reference_cost.manage` sólo cuando escribe un
costo. Metadata, lifecycle individual, precio, costo, override de Branch y
retiro masivo quedan sujetos a sus capabilities respectivas; el retiro masivo
conserva íntegramente ADR-013 nivel 2. La UI usa capabilities de sesión y no
nombres de rol; el servidor sigue siendo la autoridad final.

UX-004.3 separa materialmente Bulk Composer: `catalog.import.read` abre sólo
historial, versiones, coverage, comparación y resultados; no carga recursos
de edición ni expone controles de preparación. `catalog.import.prepare` habilita
crear Source/Draft, editar, analizar, resolver y purgar borradores, pero no
publica. `catalog.import.publish` permite Apply de un lote `READY` visible al
publisher, sin exigir que sea quien lo preparó. Apply vuelve a leer el lote
autoritativo y compone sólo los efectos presentes: create, update, reactivate,
precio y costo; no convierte publish en super-capability. La segregación queda
habilitada por capability, no obligatoria: un mismo usuario puede tener las
tres capacidades. Un rol publisher recibe `catalog.import.read` explícitamente;
la compatibilidad temporal prepare→read se mantiene para roles heredados.

UX-004.4 prueba la composición sin codificar perfiles: cada decisión obtiene
la unión actual de Roles aplicables a Tenant y Branch, y una mutación de rol se
observa en la siguiente operación protegida. Atención puede limitarse a
`price_list.read`; costo, preparación, publicación y efectos de item/precio
siguen siendo grants independientes. La UI consume esa proyección sólo para
presentación y el servidor vuelve a autorizar rutas y efectos directos. No hay
permisos directos de User ni decisiones por nombre de rol.

Crear/editar individualmente es nivel 1 de ADR-013 con capability específica,
versionado y auditoría. Publicar un batch también queda clasificado nivel 1 en
el primer ciclo: es reversible mediante revisiones, no altera snapshots ya
aplicados y exige la capability separada `catalog.import.publish`, confirmación
del diff e idempotencia. Se reconsidera nivel 2 si aparecen thresholds,
descuentos extraordinarios, auto-publicación externa o impacto irreversible.

El retiro masivo es una acción distinta y queda clasificado explícitamente
como **nivel 2 de ADR-013**. Exige `catalog.items.bulk_retire`, reautenticación
PIN del mismo actor, plan/preview server-side, confirmación exacta, ejecución
Tenant-scoped transaccional, audit append-only y revalidación de contexto,
sesión, capability y conjunto de items al ejecutar. El control es de un solo
uso y nunca eleva privilegios ni reutiliza `catalog.manage` como sustituto.

Eliminar una `SupplierSource` segura también es nivel 2 de ADR-013. Exige la
capability asignable `catalog.suppliers.delete`, reautenticación del mismo
actor, dos confirmaciones explícitas y revalidación transaccional. La acción se
bloquea si existe una Version `INGESTED`, Resolution, ReconciliationMemory o
evidencia de retiro. No existe fallback a `catalog.manage` o
`catalog.import.prepare`.

## 8. Contratos públicos y consumidores

`catalog/index.ts` expondrá sólo contratos framework-free; los nombres finales
se validarán al materializar DEC-005:

| Contrato | Consumidor permitido | Contenido |
|---|---|---|
| `CatalogSearch` | shell Lista de precios; futuros Repair/Sales | items activos vendibles + precio efectivo Branch |
| `CatalogItemReader` | futuros Inventory/Procurement/Reporting | identidad/clasificación/identificadores mínimos |
| `EffectivePriceResolver` | futuros Repair Concepts, Sales/Quote | valor, moneda, fuente y revision ID en un instante |
| `CatalogSnapshotFactory` | futuros Repair/Sales | valores inmutables para copiar a su propia línea |
| eventos de revisión publicados | futuros Reporting/proyecciones | hecho mínimo, actor/correlation, sin costo salvo contrato autorizado |

No se expone repositorio, tabla, query builder, entidad interna ni write genérico.
Los consumidores pueden resolver y luego guardar su **snapshot propio**; nunca
guardan sólo un puntero vivo para una operación histórica.

- Repairs es owner de Repair Concept y su snapshot.
- Sales/Quote será owner de líneas, descuentos, autorización y totales.
- Payments es owner de pagos.
- Cash es owner de movimientos/sesiones de Caja.
- Inventory es owner de existencia, reserva, consumo, ubicación y valuación.
- Procurement será owner de Supplier, compra, recepción y costo de compra.
- Customer Orders/Requests serán owners de compromisos y señales de demanda.
- Reporting consume eventos/proyecciones; no corrige `catalog`.

## 9. Contrato de búsqueda rápida

La ruta `Listas > Lista de precios` usa un solo campo para nombre, SKU o código.
Reglas:

1. match exacto de SKU/barcode antes de búsqueda textual;
2. nombre por tokens normalizados para acentos/case, sin convertir coincidencia
   aproximada en identidad;
3. sólo `ACTIVE` y tipos Refacción/Producto/Servicio;
4. precio efectivo de la Branch confiable, moneda y procedencia visibles;
5. Tipo, categoría y marca se componen como filtros opcionales y navegables:
   Tipo limita las categorías según su aplicabilidad gobernada y Tipo +
   Categoría limita marcas a pares conocidos de artículos activos vendibles. La
   segunda lista es una proyección de lectura Tenant-scoped, no una relación
   maestra Category→Brand: Brand conserva una sola identidad Tenant-wide y su
   propia aplicabilidad por Tipo;
6. cambiar Tipo o Categoría conserva sólo los filtros que siguen siendo
   compatibles; los demás vuelven de forma determinista a Todos/Todas;
7. orden total estable y paginación; sin cargar todo el Tenant al browser;
8. costo omitido por default y protegido según la sección anterior;
9. misma respuesta no reveladora para IDs ajenos/inexistentes y filtros
   Tenant en cada query.

Objetivo de aceptación: con 10,000 items sintéticos por Tenant, una búsqueda
indexada devuelve la primera página dentro del presupuesto que fije PBI-040 y
permite cotizar en segundos; el benchmark se registra, no se promete desde este
documento.

## 10. Importación, reconciliación y actualización de proveedor

### 10.1 Entrada canónica: Composer first

PBI-041 usa una cuadrícula durable dentro de SR Taller. El Owner pega desde
Google Sheets una celda, columna o bloque rectangular, edita y revisa. CSV,
XLSX y APIs de proveedor son **adaptadores futuros del mismo engine**: no forman
parte del primer outcome y nunca tendrán una ruta de matching/publicación
paralela.

Contrato mínimo del Composer:

- paste como texto plano; una celda, columna o bloque rectangular;
- edición directa, selección, agregar/quitar filas de draft y undo pre-publish;
- `Tab`, `Shift+Tab`, flechas y `Enter`, con foco visible y anuncios accesibles;
- grid virtualizado, errores por celda y estado por fila;
- alta completa, actualización compacta y nueva Supplier Catalog Version sobre
  el mismo batch engine;
- draft versionado y recuperable; el browser no es la única copia;
- una corrección de una revisión `INGESTED` prepara una copia local y sólo crea
  una sucesora explícita al Guardar/Revisar; la predecesora permanece evidencia
  pero queda bloqueada server-side para Analyze, decisiones y Apply;
- sin fórmulas, macros, merged cells, worksheets ni formatting engine.

`Fill down` no forma parte del outcome inicial porque no existe una aprobación
Owner específica; paste rectangular cubre el llenado múltiple sin introducir
otra semántica de transformación. Puede evaluarse después sin cambiar el engine.

El request se rechaza antes de staging cuando excede cualquiera de estos hard
caps iniciales: 10,000 filas, 32 columnas, 200,000 celdas no vacías, 4,096
caracteres Unicode por celda o 10 MiB UTF-8 de clipboard. Los límites de cada
campo de dominio pueden ser menores y se validan por separado. No hay truncado.

En update, columna ausente y celda vacía significan **sin cambio**. En create,
vacío sólo es válido para opcionales. `0` numérico es valor explícito y nunca
ausencia. El primer slice no ofrece revocación masiva de costo. Los importes se
convierten a minor units sin `float`, conservan moneda ISO y deben coincidir con
la moneda operativa del Tenant. El casing limpio se preserva; no se fuerza
Title Case.

### 10.2 Evidencia externa e identidad interna

```text
SupplierSource
  -> SupplierCatalogVersion
    -> SupplierListing
      -> SupplierListingResolution
        -> CatalogItem

SupplierListingResolution history
  -> SupplierReconciliationMemory (read model reconstruible)

SupplierListing(s)
  -> CatalogUpdateBatch
    -> CatalogUpdateRowDecision
      -> revisiones/identidades Catalog publicadas
```

`CatalogItem.itemId` es la identidad comercial permanente. `SupplierListing` es
una observación externa versionada: Inventory, Repairs, Caja y Procurement nunca
la usan como identidad principal. Una versión conserva source, label/revision,
content hash, schema version, signature algorithm version y correction lineage.
Después de `INGESTED` su contenido es inmutable; una corrección crea otra versión
con `correctsVersionId`. La relación Version→Batch no es obligatoriamente 1:1.

Cada Source posee una secuencia monotónica Tenant+Source. El servidor asigna
`v1`, `v2`, ... al guardar una nueva carga; el cliente no elige ni deriva el
número desde fecha, filename o descripción. Un lock de la Source serializa
creaciones concurrentes, los números consumidos no se reutilizan y varias
versiones del mismo día son válidas. La descripción es metadata opcional de
historia: nunca participa en identidad, matching u orden.

Una fila ausente en la versión siguiente sólo queda `DISAPPEARED` en la
comparación de proveedor. No inactiva CatalogItem, no revoca precio/costo ni
modifica Branch overrides.

### 10.3 Matching y memoria de reconciliación

Señales fuertes, en orden compatible con las presentes: `itemId` confiable,
SKU interno, barcode interno, `supplierItemCode` opcional y mapping histórico
de observación exacta. Dos señales que resuelven a items distintos producen
`CONFLICT`; duplicados en la misma versión nunca usan last-row-wins.

Un mapping histórico es `TRUSTED_HISTORICAL_MATCH` cuando coincide el mismo
Tenant, SupplierSource y firma exacta compatible; proviene de Resolution
publicada; toda la historia apunta de forma única/consistente al mismo
CatalogItem; el target continúa vigente; Category/Brand son compatibles; y no
existe contradicción de identifier o Tipo. Resuelve identidad para
`UNCHANGED`, `UPDATE` o `REACTIVATE` sin otro click de reconciliación, permanece
visible en preview y nunca auto-publica: `Aplicar lote` continúa explícito. Una
corrección agrega
`SupplierListingResolution`, conserva la anterior y actualiza la proyección de
memoria con target, evidence count, first/last seen y conflicto histórico.

Si esa memoria exacta, única y consistente apunta a un `CatalogItem` retirado,
la fila conserva el `targetItemId` y se clasifica `REACTIVATE`: el mismo publish
atómico cambia `INACTIVE→ACTIVE` y aplica cualquier diff permitido de metadata,
precio o costo. No existe `REACTIVATE_AND_UPDATE`; `REACTIVATE` incluye el diff
completo. Identidad, SKU, barcode, Listings, mappings y revisiones previas se
conservan. Una candidatura ambigua, inconsistente, incompatible o ajena sigue
`AMBIGUOUS`/`CONFLICT` y nunca se convierte en write. Así `ACTIVE CATALOG EMPTY`
no se confunde con `NO HISTORICAL CATALOG MEMORY`.

Después de agotar señales fuertes exactas, `CANDIDATE_MATCH` puede consultar
historia del mismo SupplierSource mediante un índice acotado de rasgos, filtrar,
rankear y explicar candidatos. Su resultado siempre requiere elección humana y
nunca crea mapping, alias, rename, precio, costo o publish. Título/estructura
probable, similitud, pattern nuevo o tag nuevo sólo producen esa reconciliación
humana. No hay fuzzy write, actualización automática por título ni alias
canónico derivado de observations. Detección sistemática
`Display→Pantalla`, clasificación avanzada de tags y aceptación grupal
pertenecen al outcome diferido **Advanced Supplier Reconciliation**, sin PBI ID,
selección ni readiness.

### 10.4 Actualización gobernada

| Campo de Catalog existente | Semántica bulk inicial |
|---|---|
| Tipo | inmutable; contradicción bloquea |
| SKU / barcode | match-only; no se cambia por bulk |
| título | el título del proveedor no renombra Catalog automáticamente |
| descripción | diff visible y opt-in explícito |
| categoría / marca | diff compatible y explícito; puede crear pending gobernada |
| precio base | nueva revisión sólo ante cambio real |
| costo de referencia | nueva revisión `IMPORTED` sólo ante cambio real y con permisos |
| lifecycle | sólo `INACTIVE→ACTIVE` mediante `REACTIVATE` histórico único; ningún otro cambio bulk |
| Branch override | siempre intacto |

`SupplierObservedCost`, `ReferenceCostRevision` y el futuro
`ProcurementPurchaseCost` son conceptos distintos. PBI-041 puede ingerir y
comparar el primero y publicar el valor seleccionado como el segundo. Nunca
crea costo de compra. Precio/costo pueden proponerse en un match confiable;
descripción/clasificación exigen opt-in.

Una pending Category/Brand seleccionada deliberadamente puede acompañar el
publish porque conserva el governance de PBI-040. Una decisión de fila todavía
`UNRESOLVED`, `AMBIGUOUS`, `CONFLICT`, `INVALID` o `STALE` bloquea.

### 10.5 Lifecycles y atomicidad

```text
SupplierCatalogVersion
DRAFT -> INGESTING -> INGESTED
DRAFT/INGESTING -> CANCELLED | FAILED
INGESTED --nueva corrección--> SUPERSEDED (derivado por lineage)

CatalogUpdateBatch
DRAFT -> ANALYZING -> RECONCILING -> READY -> COMMITTING -> COMPLETED
DRAFT/ANALYZING/RECONCILING/READY -> CANCELLED
ANALYZING/COMMITTING -> FAILED
COMMITTING --stale--> RECONCILING

CatalogRetirementPlan
PENDING -> EXECUTED
PENDING -> STALE | EXPIRED
```

Nada anterior a `COMMITTING` escribe estado de producto Catalog. Cada decisión
termina `CREATE`, `UPDATE`, `REACTIVATE`, `NO_CHANGE` o `EXCLUDED`; exclusión es deliberada.
Preview muestra observation, propuesta, motivo de match, before/after,
`expectedVersion`, pendientes, conflicts, overrides preservados y conteos.

Publish es all-or-nothing para las filas incluidas. Parse/análisis ocurren fuera
de la transacción. Dentro de una sola conexión/transacción se revalidan Tenant,
Session, capacidades de cada campo, identifiers, referencias/aplicabilidad,
lifecycle y expectedVersions. Cualquier fila stale/inválida revierte todas las
mutaciones. `clientRequestId` protege creación/ingesta/publish; un retry devuelve
el outcome previo y no genera otra identidad o revisión.

### 10.6 Retiro seguro y compensación acotada

`Vaciar lista de precios` inactiva todos los `CatalogItem` activos del Tenant.
No elimina filas. Conserva itemId, SKU, barcode, revisiones, Sources, Versions,
Listings, Resolutions, ReconciliationMemory, Batches, mappings y auditoría. La
lista activa normal puede quedar en cero, pero la identidad y la memoria siguen
recuperables mediante reactivación explícita.

El plan dura cinco minutos y registra el hash del conjunto `itemId + version`,
conteos y contexto creador. La ejecución bloquea los targets en orden estable,
recalcula el conjunto y falla cerrada si cambió plan, actor, Branch, Station,
Session, capability, lifecycle o versión. El efecto y su audit se confirman en
una transacción serializable.

Para un batch aplicado sólo existe `Retirar artículos creados por este lote`.
Los targets se derivan de `SupplierListingResolution.resolution = CREATED` del
batch autoritativo. `MATCHED` y `UPDATED` no se revierten. No se llama
`Revertir lote`: la reversión exacta de updates queda fuera hasta contar con
before-images autoritativos y un modelo append-only de efectos/publicación.

### 10.7 Eliminación gobernada de SupplierSource

`SupplierSource` agrupa historia de intake; por eso no se elimina sólo porque
el usuario ya no quiera verla. El servidor clasifica todas sus relaciones:

| Relación | Semántica al eliminar una Source segura |
|---|---|
| Versions `DRAFT`, raw temporal, Listings y RowDecisions de draft | se eliminan dentro de la misma transacción |
| UpdateBatch de draft sin efecto publicado | se elimina con su draft |
| Version `INGESTED` | bloquea |
| SupplierListingResolution | bloquea |
| SupplierReconciliationMemory | bloquea |
| RetirementPlan / RetirementEvent ligados al batch | bloquean |
| CatalogItem, identifiers, price/cost revisions, Catalog audit y downstream | nunca se eliminan ni se modifican |

Antes del efecto se vuelve a comprobar `expectedVersion`, Tenant, Session,
Station, User, capability y la ausencia de dependencias. Un evento append-only
desacoplado de la Source conserva actor, sesión, reautenticación, request,
correlation, nombre y conteos de lo eliminado. Las FKs y la ausencia de
`CASCADE` son guardas; no sustituyen la decisión de dominio.

La auditoría inicial detectó deuda fuera de esta acción: los hard deletes de
Category/Brand de Catalog usan `catalog.manage` y los de referencias de Repairs
usan `repairs.catalogs.manage`. Permanecen sin cambio en PBI-041; requieren
capabilities explícitas en trabajo posterior con autoridad de esos módulos.

### 10.8 Retención, consultas y presupuesto operativo

Durante 90 días se conserva el payload completo de clipboard/adaptador, celdas
no mapeadas, artefactos temporales y diagnóstico detallado. Permanentemente se
conservan source/version metadata, título exacto, código de proveedor opcional,
costo/moneda observados, hints/tags relevantes, firma + versión de algoritmo,
resoluciones/mappings, diffs/revision IDs y audit/correlation. El cleanup borra
sólo raw temporal vencido, en chunks idempotentes, sin cascada a versión,
listing estructurado, mapping, batch, revisiones o CatalogItem. Todo costo queda
omitido server-side sin `catalog.reference_cost.read`.

Presupuestos del perfil de referencia, medidos p95 y con datos sintéticos:

| Superficie | 1,000 filas material | 10,000 target candidato | Regla |
|---|---:|---:|---|
| paste hasta grid interactiva | ≤ 1.0 s | ≤ 3.0 s | ninguna tarea de main thread > 200 ms |
| análisis completo | ≤ 5 s | ≤ 30 s | set-based, sin N+1 |
| primera página de preview | ≤ 1.5 s | ≤ 2.0 s | filtros/página posteriores ≤ 750 ms |
| publish HTTP total | ≤ 8 s | ≤ 30 s | resultado explícito, sin timeout ambiguo |
| transacción DB de publish | ≤ 5 s | ≤ 15 s | locks en orden estable |
| heap adicional del browser | ≤ 100 MiB | ≤ 250 MiB | sin conservar DOM por fila fuera de viewport |
| cleanup de raw vencido | ≤ 10 s | ≤ 60 s | chunks ≤ 1,000; lock individual ≤ 1 s |

La prueba de 1,500 filas es obligatoria para Owner checkpoint. El producto sólo
puede anunciar soporte hasta 10,000 si todos sus presupuestos pasan en la
baseline de referencia. 50,000 es caracterización no bloqueante del engine; la
UI/API inicial rechaza >10,000 completa y explícitamente, sin truncar ni
persistir parcialmente. Si se requiere particionar apply, cambia el producto y
necesita arquitectura posterior.

## 11. Concurrencia, idempotencia, auditoría y seguridad

- Todo write mutable usa `expectedVersion`; stale produce `409` y obliga a
  releer, nunca last-write-wins.
- Constraints Tenant-aware respaldan SKU/barcode e integridad Source/Version/
  Listing; supplier code opcional se indexa y sus duplicados se clasifican sin
  ocultar evidencia.
- Precio/costo/override son revisiones append-only. Una corrección agrega una
  revisión y motivo; no reescribe historia.
- Cada comando reintentable usa idempotency key y conserva outcome suficiente.
- Audit registra actor, sesión, estación/administración, Tenant, Branch si
  aplica, correlation, acción, target opaco, before/after mínimo y resultado.
- Logs no contienen el archivo completo, costos masivos ni datos de otro Tenant.
- Search, export e import prueban aislamiento, no sólo CRUD por ID.
- Composer parsing/análisis sucede fuera de la transacción; publish revalida
  dentro de ella.
- Los errores por scope usan el contrato no revelador de DEC-044.

## 12. Escenarios de validación

| Escenario | Resultado exigido |
|---|---|
| A. OLED y LCD, dos proveedores/costos | dos `CatalogItem`; códigos de fuente pueden vincularse explícitamente; nombre/fuzzy jamás fusiona; cada costo conserva procedencia |
| B. Servicio base 350, Branch 399 | `SERVICE`, no stockable; base MXN 350, override 399 con fuente visible; costo ausente/estimado/tercerizado opcional |
| C. Termo no telefónico | `PRODUCT`, marca/categoría comerciales; ninguna dependencia de Repairs |
| D. Alcohol interno | `SUPPLY`, puede existir como identidad para futuro Inventory; Price List lo excluye porque no es sellable |
| E. dos versiones / 1,500 filas | la primera crea/mapea sin códigos obligatorios; la segunda preselecciona historia exacta, separa changed/new/ambiguous/disappeared; un stale evita apply parcial; reporte completo |
| F. Muchas Branches | un item Tenant, una base, overrides escasos; revocar hereda; perfil futuro se inserta sin migrar item ni snapshots |
| G. Historical Tenant | retirar el catálogo deja cero activos y conserva listings/resolutions/memory; una nueva versión exacta clasifica `REACTIVATE`, conserva identidad y publica el diff, nunca `NEW` |
| H. Virgin Tenant | fixture sintético aislado sin item/listing/resolution/memory previo; las 36 pantallas AG son `NEW` cuando Category/Brand aplicables ya están gobernadas |

## 13. Entrega por PBIs

Se elige **Epic + PBIs verticales**, no un PBI único: core y bulk import tienen
riesgos, pruebas y checkpoints Owner distintos. Tampoco se fragmenta en PBIs de
tablas/backend/UI porque eso dejaría capas sin resultado operativo.

1. **PBI-040 — Catalog & Pricing Core + Fast Price Lookup** — `Done candidate`;
   Owner Accepted, integrado y Preview PASS; `Released: NO`.
   Alta/edición individual sin imagen, identidad, clasificación, SKU/barcode,
   moneda Tenant, base/override/costo, capacidades, preferencia personal,
   historial, navegación `Listas` y búsqueda rápida.
2. **PBI-041 — Initial Bulk Catalog Composer + Versioned Supplier Intake** —
   `Implementation / Owner Review`. Composer, source/version/listing, memoria
   exacta, reconciliación manual, preview, apply atómico, retiro seguro y
   compensación acotada de items `CREATED`.
3. **PBI-042 — Catalog Item Images** — `Planned / fuera del compromiso inicial`.
   Se activa cuando Files tenga contrato y storage autorizados.
4. **Advanced Supplier Reconciliation** — outcome diferido sin PBI ID:
   cambios sistemáticos, tags y resolución grupal; no seleccionado ni Ready.
5. **Price profiles, Inventory, Procurement, Repair Concepts, Sales/Caja,
   Pedidos y Solicitudes** — futuros; no reciben PBI ni estructura ahora.

## 14. Diez respuestas de readiness

1. **Módulo:** uno, `catalog`, con Catalog/Pricing internos.
2. **Owns:** item, tipo/capabilities, categoría/marca comercial,
   identificadores, revisiones base/override/reference cost, SupplierSource/
   Version/Listing/Resolution/Memory y CatalogUpdateBatch/RowDecision.
3. **No owns:** stock, Supplier, compra, costo contable, Repair Concept,
   venta/pago/Caja, pedido, solicitud ni reporte.
4. **Scopes:** identidad/base/configuración Tenant; override Branch; contexto
   siempre confiable.
5. **Precio efectivo:** Branch override activo, si no base Tenant; `NOT_PRICED`
   si falta; siempre con moneda y procedencia.
6. **Bulk:** Composer first; mapping histórico exacto puede preseleccionarse;
   ningún write por nombre/similarity; publish transaccional, versionado,
   idempotente y auditable con exclusiones/pending deliberadas.
7. **Capabilities:** las ocho de la sección 7; costo nunca viaja sin permiso.
8. **Primer slice:** PBI-040 produce alta individual + búsqueda usable en la
   Branch y cierra la base segura antes del import.
9. **Diferido:** imágenes, perfiles, FX/impuestos, auto-sync, inventario,
   compras, conceptos, Caja y futuros `Listas`.
10. **Readiness:** PBI-041 está Ready documentalmente, no seleccionado ni
    autorizado; PBI-040 es `Done candidate` y no existe Current PBI.

## Criterios de reconsideración

Revisar esta frontera si hay dos monedas concurrentes por Tenant, reglas de
pricing independientes, cientos de overrides repetidos, proveedor integrado,
costeo autoritativo de Inventory/Procurement o un consumidor que requiera SLA y
ciclo separados. Ninguna de esas posibilidades justifica materializar hoy un
módulo vacío.

## Decisiones Owner posteriores que no bloquean PBI-040

- priorizar y diseñar perfiles de precio compartidos;
- definir venta personalizada, descuentos, impuestos y Quote/Authorization;
- decidir el orden de activación entre Caja y Repair Concepts después de Lista
  de precios;
- definir semántica de Pedidos y Solicitudes de clientes con ejemplos reales;
- autorizar PBI-041, PBI-042, Production o cualquier consumidor futuro.

## Identidad estable, título canónico e historia observada

La iteración Owner PBI-041 del 2026-09-16 fija una frontera adicional:

```text
CatalogItem.itemId                 identidad estable
CatalogItem.title                  título canónico vigente y mutable
SupplierListing.supplier_title     observación exacta e inmutable
SupplierListingResolution.item_id  vínculo publicado entre observación e identidad
```

`Mismo artículo` decide identidad; no decide por sí mismo un rename. Si el
título propuesto difiere, la fila persiste `KEEP_CURRENT` o `ADOPT_OBSERVED`.
El default es mantener el actual. `ADOPT_OBSERVED` actualiza title y
`normalized_title` sólo dentro del Apply transaccional, incrementa la versión
del mismo item y deja old/new title, actor, Batch, Source, Supplier Version,
Listing, timestamp, correlation y client request reconstruibles en
`CatalogAuditEvent`.

La búsqueda histórica no crea una tabla de aliases. Price List agrega al match
canónico los `itemId` provenientes de Resolutions cuyo Batch está `APPLIED` y
cuyo Supplier Listing coincide mediante su vector `simple` indexado. El
subquery está limitado por Tenant, devuelve identidades, y los filtros,
paginación y orden siguen aplicándose una sola vez sobre `CatalogItem`; por eso
múltiples observaciones o Sources no duplican la fila. Category/Brand merge no
rompe el vínculo porque éste depende de `itemId`; retiro sólo oculta el item de
la lista activa y reactivación conserva historia e identidad.

No queda una decisión Owner bloqueante para la implementación acotada de
PBI-040; sólo falta su autorización explícita de inicio.

## PBI-041 — Cobertura de versión de proveedor

`SupplierCatalogVersion.completeness` es independiente de `composer_mode`:
`FULL`/`COMPACT` describe la captura y `PARTIAL`/`COMPLETE` declara cobertura
de la lista. El default y el backfill histórico son conservadoramente
`PARTIAL`; ni el número de filas ni el modo permiten inferir `COMPLETE`.

Una carga `PARTIAL` no produce ni presenta ausencias. Una `COMPLETE` puede
mostrar “no observado en esta versión completa” exclusivamente frente a una
versión `COMPLETE` anterior del mismo Tenant y `SupplierSource`. Es evidencia
de observación, no disponibilidad ni estado de catálogo: Apply jamás cambia
`CatalogItem.status`, borra identidad, identifiers, revisiones, Resolution o
memoria por una fila no observada. La cobertura sólo puede cambiar mientras la
Version sea `DRAFT`; `INGESTED` conserva su significado histórico.

La baseline es automática: para una `COMPLETE` se selecciona la Version
`COMPLETE/APPLIED` anterior más reciente del mismo Tenant y `SupplierSource`;
no existe promoción manual. La lectura explica simétricamente las filas que
continúan, las no observadas y las adicionales respecto a esa baseline. Una
lista completa puede crecer sin alerta. Si la baseline tiene al menos 20 filas
y la actual conserva 25% o menos, el servidor exige que el actor confirme
explícitamente la cobertura antes de Apply. Es una advertencia de plausibilidad
determinista, no una denegación permanente: la confirmación forma parte del
request idempotente y del audit. Ningún cálculo de cobertura puede crear,
retirar, renombrar o alterar por ausencia un `CatalogItem`, identifiers,
revisiones, Resolution o ReconciliationMemory.
