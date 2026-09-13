# Arquitectura de Catálogo y Lista de precios

## Estado y autoridad

- **Estado:** Accepted for implementation readiness — 2026-09-11.
- **Autoridad de producto:** decisiones Owner `PLD-001` a `PLD-008` y
  `PLD-018`, aprobadas en `MASTER GOAL — PRICE LIST ARCHITECTURE + PBI
  READINESS`.
- **Autoridad técnica:** este documento resuelve las decisiones técnicas
  delegadas por el mismo Master Goal dentro de ADR-002/004/010/011/012/013,
  DEC-005, DEC-044, DEC-049, DEC-050 y DEC-051.
- **Alcance:** frontera lógica y contratos de entrega. No materializa módulos,
  tablas, migraciones, endpoints, UI, jobs ni integraciones.
- **Discovery de origen:** [Price List Domain Discovery](../domain/PRICE_LIST_DOMAIN_DISCOVERY.md).

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
| `ImportBatch` | Tenant + target + archivo/hash + actor | `catalog` | state machine versionada e idempotente |
| `ImportRowDecision` | batch + número de fila | `catalog` | toda fila termina aplicada, sin cambio o excluida |
| `ImportSource` | Tenant + nombre de fuente | `catalog` | namespace de reconciliación; no es un Supplier maestro |
| `SupplierItemReference` | ImportSource + código + item | `catalog` | clave determinista; Procurement podrá mapearla después |

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

Un futuro código de proveedor pertenece a `SupplierItemReference` de PBI-041,
no a SKU ni barcode. Los IDs de URL siguen siendo opacos: SKU/barcode no
habilitan enumeración ni autorización.

## 7. Costo de referencia y menor privilegio

`ReferenceCost` es opcional y puede ser manual, importado, estimado para un
servicio o directo de un tercero. Cada revisión declara `sourceType`, fuente
humana/import batch, `observedAt` y actor. No es costo promedio, última compra,
valuación de inventario ni autoridad contable.

Capacidades iniciales:

| Capability | Permite |
|---|---|
| `price_list.read` | consultar artículos vendibles y precio efectivo |
| `catalog.manage` | alta/edición/lifecycle/clasificación/identificadores |
| `catalog.prices.manage` | cambiar precio base |
| `catalog.branch_prices.manage` | crear/revocar override de Branch autorizada |
| `catalog.reference_cost.read` | recibir costo de referencia |
| `catalog.reference_cost.manage` | registrar/corregir costo de referencia |
| `catalog.import.prepare` | cargar, mapear y resolver un batch sin publicar |
| `catalog.import.publish` | publicar un batch listo |

La API de búsqueda omite el campo de costo salvo que el request pida
`includeReferenceCost=true` y el servidor confirme
`catalog.reference_cost.read`. Sin capability nunca se devuelve el valor, ni
como `null`, metadata, error diferencial, export o sugerencia. Para un usuario
autorizado, la preferencia `priceListShowReferenceCost` pertenece a `users`, es
personal, inicia `false` y sólo controla si el cliente solicita/muestra el dato;
no concede permisos.

Crear/editar individualmente es nivel 1 de ADR-013 con capability específica,
versionado y auditoría. Publicar un batch también queda clasificado nivel 1 en
el primer ciclo: es reversible mediante revisiones, no altera snapshots ya
aplicados y exige la capability separada `catalog.import.publish`, confirmación
del diff e idempotencia. Se reconsidera nivel 2 si aparecen thresholds,
descuentos extraordinarios, auto-publicación externa o impacto irreversible.

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

### Alcance del primer ciclo (PBI-041)

- CSV UTF-8 y XLSX de una sola hoja; plantilla descargable.
- Mapping guardable por `ImportSource`, con confirmación manual de encabezados.
- Decimal y separador detectados como sugerencia y confirmados antes de parsear;
  importes se convierten a minor units sin `float`.
- Moneda declarada obligatoria e igual a la del Tenant.
- En update, columna ausente/no mapeada y celda vacía significan **sin cambio**;
  en create, vacío sólo es válido para opcionales.
- `0` numérico significa cero explícito. Precio negativo es inválido; precio
  cero es válido y se muestra como tal.
- `[BORRAR]` es el token reservado, visible en preview, para limpiar únicamente
  descripción, marca o costo opcional; no puede borrar título, tipo, categoría,
  SKU, código de barras, moneda ni precio.
- Límite configurable y prueba obligatoria de 1,000 filas. Archivos superiores
  al límite se rechazan completos antes de staging.

### Matching determinista

Orden de claves: `itemId`, SKU interno, código de barras interno,
`ImportSource + supplierItemCode`. Una clave única encuentra un item; varias
claves de la misma fila que apunten a items distintos producen `CONFLICT`.
Nombre, marca, categoría y fuzzy sólo generan candidatos para resolución humana.

Duplicados dentro del archivo se detectan antes de preview. Dos filas con la
misma clave quedan `CONFLICT` y ninguna gana por orden. Una clave ya usada por
otro item, un match múltiple, una Branch ajena o una versión stale también son
conflicto explícito.

### Estado y publicación

```text
UPLOADED -> MAPPED -> RECONCILING -> READY -> PUBLISHING -> PUBLISHED
                              \-> CANCELLED
PUBLISHING --failure/stale--> RECONCILING
```

Cada fila termina en `CREATE`, `UPDATE`, `NO_CHANGE` o `EXCLUDED`. `ERROR`,
`AMBIGUOUS`, `CONFLICT` y `STALE` son pendientes que deben corregirse,
vincularse o excluirse. Sólo `pendingDecisionCount = 0` permite publicar.

Preview muestra before/after por campo, match/procedencia, warnings y conteos.
Cada intención incluida lleva `expectedVersion`. Justo antes de publicar se
revalida scope, claves, lifecycle y versión. PBI-041 publica todas las filas
incluidas en una sola transacción acotada; un conflicto o falla no deja apply
parcial. Las exclusiones son deliberadas, no errores silenciosos.

`clientRequestId` hace idempotentes create-batch y publish dentro de Tenant +
operación. Repetir el mismo publish devuelve el mismo resultado; volver a subir
el mismo hash crea otro batch sólo mediante una intención nueva confirmada. El
reporte conserva archivo/hash, mapping, actor, target, decisiones, correcciones,
links, exclusiones, before/after, versions, timestamps, correlation y resultado.

Flujo real soportado:

```text
proveedor -> Owner limpia/calcula en Sheets -> exporta -> elige ImportSource
-> mapea -> preview -> resuelve 100% -> publica -> descarga reporte
```

Si un artículo desaparece de la nueva lista, no se inactiva ni se borra por
ausencia. Tal acción requiere una columna/intención explícita y queda fuera del
primer import. Automatización programada, APIs de proveedor, perfiles de precio,
multihoja, rollback masivo y fuzzy asistido quedan posteriores.

## 11. Concurrencia, idempotencia, auditoría y seguridad

- Todo write mutable usa `expectedVersion`; stale produce `409` y obliga a
  releer, nunca last-write-wins.
- Constraints Tenant-aware respaldan SKU, barcode y supplier code; los
  conflictos se traducen sin filtrar nombres/IDs ajenos.
- Precio/costo/override son revisiones append-only. Una corrección agrega una
  revisión y motivo; no reescribe historia.
- Cada comando reintentable usa idempotency key y conserva outcome suficiente.
- Audit registra actor, sesión, estación/administración, Tenant, Branch si
  aplica, correlation, acción, target opaco, before/after mínimo y resultado.
- Logs no contienen el archivo completo, costos masivos ni datos de otro Tenant.
- Search, export e import prueban aislamiento, no sólo CRUD por ID.
- Import parsing sucede fuera de la transacción; publish revalida dentro de ella.
- Los errores por scope usan el contrato no revelador de DEC-044.

## 12. Escenarios de validación

| Escenario | Resultado exigido |
|---|---|
| A. OLED y LCD, dos proveedores/costos | dos `CatalogItem`; códigos de fuente pueden vincularse explícitamente; nombre/fuzzy jamás fusiona; cada costo conserva procedencia |
| B. Servicio base 350, Branch 399 | `SERVICE`, no stockable; base MXN 350, override 399 con fuente visible; costo ausente/estimado/tercerizado opcional |
| C. Termo no telefónico | `PRODUCT`, marca/categoría comerciales; ninguna dependencia de Repairs |
| D. Alcohol interno | `SUPPLY`, puede existir como identidad para futuro Inventory; Price List lo excluye porque no es sellable |
| E. 1,000 filas | cada fila queda create/update/no-change/excluded; pendientes cero antes de publish; un stale evita apply parcial; reporte completo |
| F. Muchas Branches | un item Tenant, una base, overrides escasos; revocar hereda; perfil futuro se inserta sin migrar item ni snapshots |

## 13. Entrega por PBIs

Se elige **Epic + PBIs verticales**, no un PBI único: core y bulk import tienen
riesgos, pruebas y checkpoints Owner distintos. Tampoco se fragmenta en PBIs de
tablas/backend/UI porque eso dejaría capas sin resultado operativo.

1. **PBI-040 — Catalog & Pricing Core + Fast Price Lookup** — `Ready`, primero.
   Alta/edición individual sin imagen, identidad, clasificación, SKU/barcode,
   moneda Tenant, base/override/costo, capacidades, preferencia personal,
   historial, navegación `Listas` y búsqueda rápida.
2. **PBI-041 — Supplier Price Import & Reconciliation** — `Planned`.
   CSV/XLSX, template/mapping, staging, matching determinista, resolución,
   preview, publish idempotente y reporte.
3. **PBI-042 — Catalog Item Images** — `Planned / fuera del compromiso inicial`.
   Se activa cuando Files tenga contrato y storage autorizados.
4. **Price profiles, Inventory, Procurement, Repair Concepts, Sales/Caja,
   Pedidos y Solicitudes** — futuros; no reciben PBI ni estructura ahora.

## 14. Diez respuestas de readiness

1. **Módulo:** uno, `catalog`, con Catalog/Pricing internos.
2. **Owns:** item, tipo/capabilities, categoría/marca comercial,
   identificadores, revisiones base/override/reference cost, import source/batch.
3. **No owns:** stock, Supplier, compra, costo contable, Repair Concept,
   venta/pago/Caja, pedido, solicitud ni reporte.
4. **Scopes:** identidad/base/configuración Tenant; override Branch; contexto
   siempre confiable.
5. **Precio efectivo:** Branch override activo, si no base Tenant; `NOT_PRICED`
   si falta; siempre con moneda y procedencia.
6. **Bulk:** ningún auto-match por nombre; 100% de filas resueltas; publish
   transaccional, versionado, idempotente y auditable.
7. **Capabilities:** las ocho de la sección 7; costo nunca viaja sin permiso.
8. **Primer slice:** PBI-040 produce alta individual + búsqueda usable en la
   Branch y cierra la base segura antes del import.
9. **Diferido:** imágenes, perfiles, FX/impuestos, auto-sync, inventario,
   compras, conceptos, Caja y futuros `Listas`.
10. **Primer PBI Ready:** PBI-040; no está autorizado para implementación hasta
    una orden Owner posterior.

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

No queda una decisión Owner bloqueante para la implementación acotada de
PBI-040; sólo falta su autorización explícita de inicio.
