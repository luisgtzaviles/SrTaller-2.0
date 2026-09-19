# UX-005.6 — Published Data Integrity and Pending Reference Governance

- **Estado:** implementación local lista para revisión Owner; no integración ni despliegue.
- **Alcance:** impedir nuevas publicaciones con precio base cero y gobernar la promoción explícita de `Brand` pendiente.

## Invariante de importación

Un `CatalogItem` nuevo y activo creado por una carga `FULL` necesita un precio base efectivo estrictamente mayor que cero. `0` es explícito, no equivale a un campo omitido y no puede hacer que un precio histórico parezca retenido. Analyze lo deja en atención con `MISSING_REQUIRED_EFFECTIVE_VALUE:basePrice`; la UI lo traduce como **Precio base debe ser mayor que 0**. Apply vuelve a comprobar la policy y el valor efectivo dentro de su transacción.

Costo de referencia sigue siendo policy-driven: con `OPTIONAL` o `ESSENTIAL`, ausente/cero no bloquea; sólo con `REQUIRED` debe ser estrictamente mayor que cero, con el mensaje **Costo de referencia debe ser mayor que 0**. Una fila excluida no bloquea publicación.

## Lifecycle de Brand pendiente

Una `Brand` pendiente representa una observación de proveedor aún no promovida: conserva label raw, clave normalizada, actor/contexto de captura, usos y origen de SupplierSource/Version. No es Brand canónica ni alias libre en el item.

`Configuración → Lista de precios` agrupa por la identidad normalizada del Tenant y permite a `catalog.configuration.manage` promover o asignar una Brand existente. La operación es tenant-wide, transaccional y auditada: bloquea el grupo, reutiliza una Brand canónica con identidad normalizada exacta cuando ya existe o crea sólo una nueva, religa todos los items afectados y marca la referencia resuelta. Los valores raw y Supplier Listings históricos no se reescriben. `SAMSUGN → Samsung` nunca se hace automáticamente: requiere una asignación humana explícita.

La lectura de la gobernanza requiere `catalog.configuration.read`; la mutación requiere `catalog.configuration.manage`. La lista de precios ya muestra un item pendiente en búsqueda, pero antes de promoción no hay Brand canónica que pueda figurar como filtro. Tras promoción, el filtro normal de Brand usa la identidad canónica sin opciones duplicadas.

### UX-005.6A — presentación de Brand pendiente

La UI no usa el casing raw como etiqueta primaria: separa explícitamente raw,
clave normalizada, nombre de presentación/propuesta y Brand canónica. El nombre
de presentación se deriva sin persistencia; una coincidencia canónica exacta
gana, el casing uniforme se vuelve legible, los acrónimos compactos se
conservan y el casing mixto significativo permanece intacto. La resolución
sigue siendo explícita y no se introduce matching fuzzy, API, migration ni
escritura de Owner. Véase
[UX-005.6A](PRICE_LIST_UX_0056A_PENDING_BRAND_DISPLAY_CANONICALIZATION.md).

## AviCell Owner remediation ejecutada posteriormente

La implementación de UX-005.6 siguió siendo una barrera hacia adelante; no
reparó silenciosamente datos ya publicados. Una autorización Owner posterior
ejecutó UX-005.7 mediante las operaciones gobernadas existentes: los 16 grupos
Brand AviCell/618 items fueron promovidos y religados, y la fila 411 se
desactivó individualmente. No se asignó precio/costo desde el valor ambiguo de
v1 `DRAFT`, no hubo `bulk retire` ni reescritura de Supplier history. Véase
[UX-005.7](PRICE_LIST_UX_0057_AVICELL_OWNER_DATA_REMEDIATION.md).

## Prueba material

Las regresiones cubren Analyze/Apply con precio cero, costo requerido/opcional, exclusión, promoción de un grupo Samsung, reutilización exacta de Apple, no fuzzy para Samsugn, auditoría, aislamiento Tenant y filtro canónico posterior. No hay migración: las tablas de pending, provenance y audit existentes son la autoridad durable.
