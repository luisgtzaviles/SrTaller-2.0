# UX-004 — Catalog Operational Authorization Audit

**PBI:** PBI-041
**Estado:** UX-004.1..004.3 materializados localmente; UX-004.4 permanece pendiente.
**Fecha:** 2026-09-17
**Alcance:** Sólo roles, capabilities y autorización de operaciones de Lista de
precios / Catalog. No cambia producto, API, persistencia ni datos.

## Resultado ejecutivo

El modelo vigente ya deriva la autoridad de `Role -> capabilities -> sesión
operativa -> autorización contextual` y protege sus endpoints en servidor. No
hay lógica de autorización por nombre de rol. La frontera principal que queda
por materializar no es de autenticación: es de **granularidad**.

`price_list.read` ya permite una consulta operativa sin costo, pero
`catalog.manage` todavía agrupa alta, edición, lifecycle y la administración de
referencias. Asimismo, `catalog.import.prepare` permite tanto explorar el
historial de cargas como crear, editar, analizar y decidir una carga. Esto no
es una elevación por cliente —el servidor sigue denegando las rutas sin la
capability—, pero impide conceder lectura ordinaria sin otorgar preparación.

La recomendación V1 es conservar las capabilities sensibles ya separadas,
agregar cuatro capabilities acotadas y migrar roles de manera compatible. UX-004.1
materializa exactamente ese registro y la compatibilidad mínima. No se
recomienda una capability por campo ni cambiar automáticamente los roles que
hoy sólo leen la lista.

## Método y límites de la auditoría

Se trazó el registry, la sesión, las páginas de Lista de precios y Composer,
los controladores/operaciones protegidas, la arquitectura de Lista de precios,
ADR-012/ADR-013, migraciones de registry y las rutas de auditoría. Las
conclusiones describen el estado local de PBI-041; no conceden ninguna nueva
autoridad ni constituyen una matriz de roles aprobada.

No se consultó ni modificó la asignación de un usuario concreto: los roles son
datos Tenant-owned y sus nombres no son una frontera de seguridad. La futura
migración deberá leer y transformar asignaciones por capability, no inferirlas
por un nombre como “Administrador”.

## Inventario actual de capabilities de Catalog

| Capability vigente | Autoridad actual comprobada | Observación |
| --- | --- | --- |
| `price_list.read` | Buscar artículos y referencias operativas; el costo sólo se solicita con permiso adicional. | Es la lectura ordinaria existente; no crea ni modifica. |
| `catalog.manage` | Category/Brand y fallback temporal de alta/edición/lifecycle individual. | Se conserva mientras migren rutas; no es autoridad nueva. |
| `catalog.items.create` | Crear CatalogItem, compuesta con precio/costo cuando el efecto lo requiere. | Nuevo; backfill sólo desde `catalog.manage`. |
| `catalog.items.update` | Corregir atributos no financieros sin lifecycle. | Nuevo; backfill sólo desde `catalog.manage`. |
| `catalog.items.deactivate` | Desactivar/reactivar un item individual. | Nuevo; no concede retiro masivo ni hard delete. |
| `catalog.prices.manage` | Cambiar precio base; crear item exige además esta capability. | Separación financiera ya útil. |
| `catalog.branch_prices.manage` | Crear/revocar override de precio de la Branch confiable. | Contextual a Branch. |
| `catalog.reference_cost.read` | Recibir/visualizar costo cuando el request lo pide. | El servidor omite el campo si falta. |
| `catalog.reference_cost.manage` | Registrar/corregir costo; altas/imports con costo exigen este permiso. | Lectura y escritura siguen separados. |
| `catalog.configuration.read` | Leer policy de campos; actualmente se compone con lectura de costo. | Configuración Tenant-wide. |
| `catalog.configuration.manage` | Guardar/restaurar policy; se compone con gestión de costo. | Versionada y auditada. |
| `catalog.import.read` | Ver fuentes/versiones/diffs y resultados. | Nuevo; backfill sólo desde prepare. |
| `catalog.import.prepare` | Crear, editar, analizar, decidir y purgar borradores. | Conserva fallback operativo de lectura durante transición. |
| `catalog.import.publish` | Aplicar/publicar un lote listo, junto con permisos de item/precio/costo aplicables. | Operación nivel 1 actual. |
| `catalog.items.bulk_retire` | Planear y ejecutar retiro masivo / “Vaciar lista”. | Nivel 2, PIN, preview y revalidación. |
| `catalog.suppliers.delete` | Eliminar una fuente sólo si su historia es borrador seguro. | Nivel 2, PIN, doble confirmación y revalidación. |

La allowlist de capabilities de sesión refleja este registry; el frontend sólo
recibe la unión efectiva del rol, pero esa exposición no es autoridad. Todas
las operaciones de Catalog vuelven a autorizarse en servidor contra Station,
Tenant, Branch, User y Session confiables.

## Matriz de superficie, autoridad y riesgo

| Operación | Capability actual | Servidor / contexto | Sensibilidad y evidencia | Diagnóstico UX-004 |
| --- | --- | --- | --- | --- |
| Consultar lista y precio efectivo | `price_list.read` | Sí; contextual. | Nivel 1; costo omitido por defecto. | Correcto para acceso ordinario. |
| Ver costo de referencia | `catalog.reference_cost.read` además de lectura | Sí; el campo no se serializa sin permiso. | Confidencialidad separada. | Correcto; nunca inferirlo desde UI. |
| Crear artículo | `catalog.manage` + `catalog.prices.manage` (+ costo si corresponde) | Sí; Tenant-wide, auditado. | Nivel 1. | Separar alta de edición/lifecycle. |
| Editar item/lifecycle individual | `catalog.manage` | Sí; Tenant-wide, auditado. | Nivel 1. | Separar edición y desactivación. |
| Cambiar precio base | `catalog.prices.manage` | Sí; Tenant-wide, auditado. | Nivel 1. | Mantener separado. |
| Cambiar override Branch | `catalog.branch_prices.manage` | Sí; Branch derivada de contexto. | Nivel 1. | Mantener separado. |
| Crear/corregir costo | `catalog.reference_cost.manage` | Sí; no depende de que el cliente oculte campo. | Nivel 1. | Mantener separado de lectura. |
| Ver fuentes, versiones y diff | `catalog.import.prepare` | Sí; Tenant-wide. | Lectura de evidencia de cargas. | Separar como lectura masiva. |
| Crear/editar/analizar/decidir un borrador | `catalog.import.prepare` | Sí; Tenant-wide, actor/correlation auditados. | Pre-publicación. | Separar como preparación masiva. |
| Aplicar/publicar lote | `catalog.import.publish` + item/precio/costo aplicables | Sí; transaccional, idempotente y auditado. | Nivel 1 vigente. | Mantener capability propia; preparar no basta. |
| Vaciar lista / retiro masivo | `catalog.items.bulk_retire` | Sí; plan server-side y contexto revalidado. | Nivel 2 ADR-013. | Ya es independiente; conservar. |
| Eliminar fuente segura | `catalog.suppliers.delete` | Sí; servidor bloquea historia no segura. | Nivel 2 ADR-013. | Ya es independiente; conservar. |
| Category/Brand create/update/delete/merge | `catalog.manage` | Sí, pero capability amplia. | Hard delete de referencias es deuda reconocida. | Alto: no extender este permiso a roles ordinarios. |
| Policy de campos | `catalog.configuration.read/manage` + costo aplicable | Sí; Tenant-wide, append-only audit. | Nivel 1 actual. | Mantener compuesta; decisión de sensibilidad posterior. |

### Estado material de UX-004.1

La migración `20260917190200_access_add_granular_catalog_capabilities` añade
el registry y deriva sólo los grants aprobados por capability previa. La
allowlist/proyección de sesión acepta los cuatro códigos, las etiquetas de
Roles son humanas y los endpoints de item e historial usan guardas explícitas
con compatibilidad temporal. La migración PostgreSQL desechable prueba reversión,
reaplicación, aislamiento de `price_list.read`/roles ajenos, ausencia de grants
sensibles y una segunda ejecución sin trabajo pendiente. No se cambió UX,
matriz de roles, CatalogItem ni SupplierCatalogVersion.

### Protección contra bypass directo

Las guardas de pantalla son sólo UX. `CatalogProtectedOperations` exige
capabilities en cada comando y construye el contexto desde sesión confiable;
los comandos mutantes añaden commit guards. Una petición directa sin la
capability requerida recibe denegación antes de tocar Catalog. Publicar requiere
además permisos de Catalog/precio (y costo cuando lo escribe); retiro y borrado
de fuente pasan por el executor sensible nivel 2.

La brecha es de modelo, no de ausencia de guard: un rol con `catalog.manage`
sí puede invocar demasiadas operaciones legítimamente autorizadas. Category y
Brand tienen además delete físico protegido sólo por esa capability amplia; la
arquitectura lo registra como deuda previa y ADR-013 exige una capability
explícita para hard delete. No se debe resolver ampliando los roles ordinarios.

### Estado material de UX-004.2

`price_list.read` autoriza lista, filtros, precio efectivo y un detalle de
ítem comercial seguro; el endpoint de detalle no requiere ya
`catalog.manage` ni proyecta costo. El control **Mostrar costos de referencia**
sigue existiendo sólo con `catalog.reference_cost.read`, y el servidor omite el
campo por completo cuando no recibe esa autoridad.

La UI usa la unión efectiva de capabilities de sesión, no el nombre de un rol:
crear requiere `catalog.items.create` + `catalog.prices.manage`; metadata usa
`catalog.items.update`; activar/desactivar individual usa
`catalog.items.deactivate`; precio, costo y Branch override conservan sus
capabilities financieras; y **Vaciar lista** queda sólo en
`catalog.items.bulk_retire` con ADR-013 nivel 2. Las rutas directas de alta y
detalle reproducen estas fronteras y el backend vuelve a denegar cada bypass.
`catalog.manage` permanece sólo como fallback temporal servidor de item y
para Category/Brand.

### Estado material de UX-004.3

Bulk Composer ya admite inspección histórica con `catalog.import.read` sin
conceder preparación. Esa vista muestra Sources, Versions, lifecycle,
coverage, comparación y resultados, pero omite Nueva carga, creación de Source,
edición, Save, Analyze/Reanalyze y decisiones de filas. No solicita referencias
ni policy de captura, por lo que un lector no recibe accidentalmente recursos
de preparación. `catalog.import.prepare` conserva el flujo previo a
publicación, incluido Source/Draft, Analyze, decisiones y purge de borradores;
no recibe publish.

Apply exige `catalog.import.publish` y vuelve a evaluar el lote READY más las
capabilities de sus efectos reales: create, update, reactivate, precio y costo.
El publisher requiere lectura explícita para abrir el lote; el fallback
prepare→read sólo preserva roles heredados. No hay ownership lock: el proof
PostgreSQL desechable deja A en READY, B publica y el audit de Apply identifica
a B. Supplier delete continúa nivel 2 y bulk-retire no cambia.

## Target mínimo V1 recomendado

Mantener el registry vigente y añadir sólo:

| Nueva capability propuesta | Autoridad objetivo | Compatibilidad propuesta |
| --- | --- | --- |
| `catalog.items.create` | Crear CatalogItem, siempre compuesta con `catalog.prices.manage` y costo cuando aplique. | Roles que hoy tienen `catalog.manage` la reciben explícitamente. |
| `catalog.items.update` | Corregir atributos no financieros del CatalogItem. | Backfill desde `catalog.manage`. |
| `catalog.items.deactivate` | Desactivar/reactivar un item individual; no hard delete. | Backfill desde `catalog.manage`. |
| `catalog.import.read` | Explorar fuentes, versiones, diff, coverage y resultados sin preparar. | Backfill desde `catalog.import.prepare`. |
| `catalog.import.prepare` | Crear/editar/analizar/decidir borradores; deja de ser la capability de lectura. | Roles con el valor actual conservan también la nueva lectura. |

`catalog.import.publish`, `catalog.items.bulk_retire`,
`catalog.suppliers.delete`, `catalog.prices.manage`,
`catalog.branch_prices.manage`, las dos de costo y las dos de configuración
se mantienen: ya delimitan riesgos materiales. En especial, **Vaciar lista**
debe seguir usando `catalog.items.bulk_retire`; crear un sinónimo
`catalog.price-list.clear` no añade independencia real y duplicaría la misma
acción nivel 2.

No se propone `catalog.price-list.read`: el nombre establecido es
`price_list.read`. Tampoco se propone una capability por columna. Los campos
de costo continúan con su pareja read/manage y los demás atributos se someten a
las operaciones de item, precio o policy que realmente los modifican.

## Rol y compatibilidad de migración

La futura implementación debe registrar las nuevas capabilities, extender la
allowlist de sesión y reemplazar la autorización server-side mediante una fase
de compatibilidad comprobable. El backfill mínimo es por capacidad existente:

| Asignación previa | Backfill permitido | No se concede automáticamente |
| --- | --- | --- |
| `catalog.manage` | `catalog.items.create`, `.update`, `.deactivate`; se conserva `catalog.manage` mientras siga gobernando Category/Brand. | Precio, costo, Apply, clear, supplier delete y configuración. |
| `catalog.import.prepare` | `catalog.import.read` y el nuevo prepare. | `catalog.import.publish`, costo, clear o source delete. |
| `price_list.read` | Ninguna capacidad mutante. | Todo write, costo, Composer o configuración. |
| Cualquier rol sin capability previa | Ninguna. | Cualquier autoridad por defecto. |

Los roles existentes conservan su intención sin recibir autoridad sensible nueva.
La operación debe invalidar/refrescar la sesión conforme al contrato de
capabilities para que la unión Role→capability vigente sea la que llegue a UI;
el backend seguirá siendo autoritativo durante esa transición.

## Decisiones Owner UX4-001..018

| ID | Pregunta / evidencia actual | Opciones y riesgo | Recomendación | Impacto previsto / slice |
| --- | --- | --- | --- | --- |
| UX4-001 | ¿El modelo sigue siendo Role→capability? Sí; no hay branching por rol. | Volver a roles rígidos duplica reglas. | Mantener sólo capabilities. | Sin cambio; transversal. |
| UX4-002 | ¿Lectura de lista incluye costo? No, costo está redacted server-side. | Un único read filtraría dato sensible. | Mantener `price_list.read` separado de costo. | Sin migración. |
| UX4-003 | ¿Lectura ordinaria debe poder abrir detalle administrativo? Hoy `getItem` exige `catalog.manage`. | Dar manage para detalle eleva writes. | Añadir read detail seguro sólo si UX lo necesita; no conceder manage. | UX-004.2, API parcial. |
| UX4-004 | ¿Alta y edición son una sola autoridad? Hoy ambas usan `catalog.manage`. | Delegar alta implica editar/lifecycle. | Crear `.items.create` y `.items.update`. | UX-004.1/2, registry+API+migración. |
| UX4-005 | ¿Desactivar/reactivar individual debe ser independiente? Hoy comparte manage. | Lifecycle masivo/individual no debe derivarse de read. | Crear `.items.deactivate`; conservar sin hard delete. | UX-004.1/2. |
| UX4-006 | ¿Precio base se comparte con item write? Ya está separado. | Combinarlo incrementa riesgo financiero. | Mantener `catalog.prices.manage`. | Sin cambio. |
| UX4-007 | ¿Override Branch se comparte con precio base? Ya está separado y contextual. | Tenant-wide grant para Branch es exceso. | Mantener `catalog.branch_prices.manage`. | Sin cambio. |
| UX4-008 | ¿Read y write de costo se unifican? Ya son independientes. | Write/read unido expone o bloquea innecesariamente. | Mantener ambos; no mostrar valor sin read. | Sin cambio. |
| UX4-009 | ¿Explorar historial masivo permite preparar? Hoy ambos usan prepare. | Un lector puede crear/analizar borradores. | Añadir `catalog.import.read`. | UX-004.1/3. |
| UX4-010 | ¿Prepare permite Apply? No; publish ya es aparte. | Acoplarlos habilita publicación indebida. | Mantener `catalog.import.publish` separado. | Sin cambio. |
| UX4-011 | ¿Apply requiere permisos de efectos? Sí: item, precio y costo según payload. | Sólo publish permitiría mutaciones no autorizadas. | Mantener composición y audit de Apply. | Sin cambio. |
| UX4-012 | ¿Vaciar lista necesita capability propia y nivel 2? Sí. | Reusar manage debilita ADR-013. | Mantener `catalog.items.bulk_retire`; no alias. | Sin cambio. |
| UX4-013 | ¿Borrar SupplierSource es ordinario? No; ya es nivel 2 dedicado. | Fallback a manage/prepare elude controles. | Mantener `catalog.suppliers.delete`. | Sin cambio. |
| UX4-014 | ¿Category/Brand hard delete está adecuadamente aislado? No; usa manage. | Amplia capability viola principio ADR-013. | Registrar como deuda alta y separar en PBI autorizado del módulo. | Fuera de UX-004. |
| UX4-015 | ¿Policy de campos necesita permiso propio? Ya usa config read/manage y costo compuesto. | Conceder config por price-list read permitiría gobernar calidad. | Mantener separación; evaluar sensibilidad explícita sólo si el impacto cambia. | Sin cambio. |
| UX4-016 | ¿Preparador y aplicador deben ser usuarios distintos? Hoy no hay ownership lock; versión es Tenant-wide. | Segregación obligatoria puede bloquear operación pequeña; ausencia puede elevar fraude. | V1: capability separada, no segregación forzada; Owner decide nivel 2/SoD por threshold futuro. | UX-004.3, decisión de producto. |
| UX4-017 | ¿Cómo se preservan roles actuales? Registry migrate/backfill por capabilities, no nombres. | No backfill rompe acceso; broad grant crea privilege escalation. | Dual mapping temporal y refresh/invalidation de sesión. | UX-004.1, migración. |
| UX4-018 | ¿Qué prueba cierra la futura implementación? Deny server-side + role matrix + session refresh + audit. | Sólo ocultar UI no prueba seguridad. | Contract, PostgreSQL y Chrome con requests directos denegados. | UX-004.4, QA. |

## Slices de implementación

1. **UX-004.1 — Registry and compatibility foundation.** **Materializado
   localmente.** Registry, migración capability→capability, allowlist de sesión,
   tests de unión de roles y compatibilidad explícita para roles existentes.
2. **UX-004.2 — Price-list item authority.** Separar read detail, create,
   update y deactivate en operaciones protegidas y UI; conservar guardas
   server-side y auditoría contextual.
3. **UX-004.3 — Bulk read/prepare separation.** Separar la historia/read model
   de la preparación/decisión; mantener Apply con `catalog.import.publish` y
   requisitos por efecto. Decidir explícitamente si preparación/aplicación
   requiere segregación futura.
4. **UX-004.4 — Role matrix and proof.** Editar Roles mediante la superficie
   existente, probar sesiones actualizadas, denegación directa, costo redacted,
   contexto Tenant/Branch y trail de auditoría.

La corrección de hard delete Category/Brand no es un sub-slice implícito:
necesita su propia autorización por el riesgo y por tocar una frontera distinta
de PBI-041.

## Cambios esperados si el Owner autoriza un slice

| Dimensión | Evaluación |
| --- | --- |
| Domain change | **PARTIAL.** Cambia el vocabulario de autoridad, no identidad, matching, coverage ni lifecycle de SupplierVersion. |
| API change | **YES.** Requisitos de operaciones protegidas y posiblemente una lectura de detalle segura. |
| Capability registry change | **YES.** Cinco capabilities nuevas propuestas; no renombrar las existentes sin compatibilidad. |
| Role assignment change | **YES.** Backfill determinista por capability previa; nunca por nombre de rol. |
| Session capability change | **YES.** Allowlist/proyección y refresh/invalidation tras role mapping. |
| Persistence | **PARTIAL.** Sólo registry/role-capability; Catalog y SupplierVersion permanecen sin cambio. |
| Migration | **YES.** Constraint/registry/mapping de access-control, reversible y probada. |
| Backward compatibility | Roles actuales conservan su intención mediante mapping explícito; `price_list.read` no recibe writes, costo, Apply, clear ni borrado de fuente. |

## Estado de datos y acciones remotas

- **DB writes:** 0.
- **Product changes:** ninguno.
- **Migrations:** ninguna.
- **CatalogItems / SupplierCatalogVersions:** no consultados ni modificados por
  esta auditoría.
- **Remote actions:** ninguna; no hubo push, PR, merge ni deploy.

## Criterio de cierre futuro

La autorización quedará materialmente demostrada sólo cuando la matriz de
roles pueda probar, para cada operación, allow correcto y deny directo de API,
con actor, tenant, branch cuando aplique, station, session, capability,
correlation y timestamp en el audit trail. La presencia/ausencia de un botón
nunca será evidencia suficiente.
