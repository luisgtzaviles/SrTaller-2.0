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

## AviCell preservado y remediación pendiente

La inspección de AviCell v3 es de sólo lectura. La fila 411 `PANTALLA SAMSUGN A37 ORIGINAL` continúa ACTIVE con precio y costo cero; no se editó ni se desactivó. La corrección futura debe ser una operación normal de edición con importe conocido o una desactivación gobernada si no es vendible. Tampoco se promovieron sus grupos pendientes. La evidencia material usa un Tenant PostgreSQL desechable.

## Prueba material

Las regresiones cubren Analyze/Apply con precio cero, costo requerido/opcional, exclusión, promoción de un grupo Samsung, reutilización exacta de Apple, no fuzzy para Samsugn, auditoría, aislamiento Tenant y filtro canónico posterior. No hay migración: las tablas de pending, provenance y audit existentes son la autoridad durable.
