# PBI-041 — Operator Flow Optimization

## UX-001 — Supplier Selection Gate Audit

## Estado y límite

- **Estado:** UX-001, UX-001B y UX-001C implementados y recorridos localmente;
  listos para Owner Review.
- **Ámbito:** el comienzo de una nueva carga en Bulk Catalog Composer.
- **Límite:** la implementación no modifica el contrato de `SupplierSource`,
  `SupplierCatalogVersion`, reconciliación, Apply ni la autoridad del backend.
- **Evidencia auditada:** implementación local de PBI-041, incluidas las
  versiones históricas de AG hasta `v52` y el flujo de Composer vigente.

## 1. Comportamiento actual comprobado

Al montar `BulkCatalogComposerPage`, `refresh()` obtiene Sources, Versions y
referencias. Si `selectedSource` está vacío, asigna la primera Source recibida.
La pantalla también permite iniciar una carga desde el selector “Proveedor
activo”, desde el encabezado de cada Source y desde su botón `Nueva carga`.
Todos invocan `beginNewVersion(sourceId)` y conservan ese `sourceId` en el
estado React de la nueva carga.

La selección de Source no aparece en la URL ni se persiste como una intención
de carga. El workspace sin guardar vive en el estado del componente; sólo los
anchos de columnas y los defaults Tipo/Categoría/Marca se guardan en
`sessionStorage`. Una recarga no recupera el contenido sin guardar y vuelve a
ejecutar la selección automática de la primera Source disponible.

El primer `Guardar borrador` envía `sourceId` en `POST
/api/catalog/supplier-versions`. El backend valida que es UUID de una Source
activa dentro del Tenant, bloquea esa Source, asigna el siguiente `vN` y crea
Version, Batch, raw payload y filas en una transacción. Desde entonces
`PUT /api/catalog/supplier-versions/:id/draft` no acepta `sourceId`; sólo
reemplaza contenido y metadatos editables. La pertenencia de la Version es por
ello inmutable en la frontera ya persistida.

El servidor protege Tenant, Session, Station, capability y Source activa, pero
no puede saber si la Source recibida era la lista real que el operador acababa
de pegar. Esa intención debe ser explícita en la experiencia antes de la
primera persistencia.

## 2. Máquina de estados observada

| Estado | Source en UI | Datos durables | Transiciones relevantes |
| --- | --- | --- | --- |
| `ENTRY_AUTO_SELECTED` | la primera Source de la respuesta queda seleccionada si no había una | ninguno | cargar Composer; abrir una Version; iniciar nueva carga |
| `BROWSING_SOURCE` | una Source se usa para filtrar/navegar historial | ninguno nuevo | elegir otra Source, abrir Version, iniciar nueva carga |
| `BROWSING_VERSION` | deriva de la Version abierta | Version/Batch/Listings existentes | abrir otra Version, iniciar nueva carga |
| `NEW_LOAD_UNPERSISTED` | `selectedSource` React, heredado de browse o elegido en selector | ninguno para esa nueva lista | pegar/editar, cambiar Source, guardar, salir/recargar |
| `DRAFT_PERSISTED` | Source de la Version recién creada | Version/Batch/Listings durables; `source_id` fijo | editar/guardar reemplazo, analizar |
| `INGESTED_RECONCILING` | Source fija | análisis y decisiones durables | decidir, reanalizar, quedar `READY` |
| `READY_TO_APPLY` | Source fija | Version/Batch/decisiones durables | Apply autorizado |
| `APPLIED_HISTORY` | Source fija | resultado, historia y audit durables | sólo consulta y acciones secundarias permitidas |

`ENTRY_AUTO_SELECTED` y `NEW_LOAD_UNPERSISTED` son el hueco UX-001: permiten
que una intención no expresada llegue a `DRAFT_PERSISTED` mediante una sola
acción de Guardar.

## 3. Escenario de error humano reproducible

1. El operador revisa versiones históricas de AG.
2. Recibe una lista de otro proveedor B y entra o permanece en Composer.
3. AG queda seleccionada silenciosamente, ya sea por la selección inicial o por
   el contexto que estaba navegando.
4. El operador pega la lista de B, guarda y analiza.
5. El backend crea una Version nueva de AG. La lista, su cobertura, las
   comparaciones y la memoria futura quedan Source-scoped a AG, no a B.

No se necesita un fallo de autorización, matching o Apply para que exista el
daño operativo: se atribuye incorrectamente una observación válida a una
historia de proveedor distinta. Corregirlo después exige descartar/recrear el
intake o someterlo al gobierno de eliminación de Sources/Versions; cambiar la
Source de la Version no es una operación admitida.

## 4. Clasificación de riesgo

| Riesgo | Nivel | Motivo | Control actual | Brecha |
| --- | --- | --- | --- | --- |
| atribución de lista a Source equivocada | **High** | contamina historia, comparación, coverage y memoria Source-scoped | UUID, Tenant y Source activa validados | no hay confirmación de intención de proveedor |
| selección por orden de API | **High** | la primera Source se convierte en contexto de carga sin acción humana | selector visible después de montar | no es una elección decisiva |
| pérdida de carga local | Medium | reload/back/switch puede abandonar filas no guardadas | `beforeunload` y confirmaciones ad-hoc cuando `dirty` | no hay guardia unificada de transición ni distinción clara entre blank/dirty |
| confusión browse/capture | Medium | “Proveedor activo” mezcla historial y dueño de una nueva lista | mismo selector y botones por Source | semántica de navegación y creación colapsadas |
| Source persistida incorrecta | High | tras `POST` no se puede retargetear una Version | inmutabilidad estructural correcta | prevención llega demasiado tarde |

## 5. UX-001 propuesto

### Principio

**Explorar historial no elige el proveedor de una carga nueva.** Una nueva
carga comienza con una decisión explícita, visible y reversible mientras aún
no haya Version persistida.

### Flujo recomendado

1. El CTA global `Nueva carga` abre el diálogo **“Elige el proveedor de esta
   lista”** sin proveedor preseleccionado.
2. El operador busca o explora Sources y pulsa una fila/tarjeta para una única
   acción decisiva: **“Usar este proveedor”**.
3. El diálogo cierra y abre `NEW_LOAD_UNPERSISTED` con un encabezado estable:
   **“Proveedor de esta carga: AG”** y una acción secundaria `Cambiar`.
4. Sólo después de pegar/editar y elegir `Guardar borrador` se crea la Version
   y queda fija la Source. La pantalla cambia a **“AG · vN”**.
5. Si el operador elige `Cambiar` antes del primer guardado, vuelve al gate. Si
   ya hay cambios materiales, se aplica la guardia de trabajo sin guardar.

La propuesta no abre una Version vacía, no delega la elección al servidor y no
altera el número `vN` asignado server-side.

### Decisiones aceptadas e implementadas

| ID | Decisión UX-001 |
| --- | --- |
| `UX-001-D01` | exigir selección explícita sólo al iniciar una nueva carga; navegar historial queda libre |
| `UX-001-D02` | el browse no prepara una captura y una carga nueva no hereda la Source visitada ni la primera respuesta API |
| `UX-001-D03` | el gate inicia sin Source seleccionada; AG puede aparecer primero, pero un click decide la propiedad de la carga |
| `UX-001-D04` | elegir una Source existente abre inmediatamente el workspace nuevo; no existe un segundo `Continuar` |
| `UX-001-D05` | la Source es mutable sólo antes del primer `POST`; la Version persistida conserva su `source_id` inmutable |
| `UX-001-D06` | crear Source desde el gate la selecciona para la nueva carga y abre su workspace, sin crear una Version vacía |
| `UX-001-D07` | advertir sólo ante trabajo local material que se perdería; un workspace en blanco no produce ruido |
| `UX-001-D08` | mantener `Nuevo proveedor` independiente para administración, sin borrar ni cambiar silenciosamente el trabajo actual |
| `UX-001-D09` | el diálogo usa el foco, Tab/Shift+Tab, Escape y restauración del `Dialog` accesible existente; la búsqueda local no distingue mayúsculas |
| `UX-001-D10` | diferir defaults de proveedor: no se infieren ni persisten como parte de este slice |

La implementación separa `browseSourceId` de
`pendingNewLoadSupplierId`. Sólo la segunda identidad puede construir el
payload del primer guardado; tras guardar, la Version se convierte en la
autoridad visible. El backend existente sigue asignando `vN` y rechazando
cualquier cambio posterior de `source_id`.

UX-004.5 preserva esa separación también durante la exploración histórica: la
fuente explorada controla sólo el historial visible y no descarta, rellena ni
reemplaza el proveedor pendiente de una carga nueva.

## 6. Alternativas de superficie

| Alternativa | Ventaja | Riesgo/coste | Recomendación |
| --- | --- | --- | --- |
| diálogo de selección | separa intención de browse, conserva historial detrás, permite búsqueda y teclado | requiere usar correctamente el Dialog accesible existente | **recomendada para V1** |
| selector inline que reemplaza el workspace | menor navegación | vuelve a mezclar contexto de browse/capture y complica la protección de cambios | no recomendada |
| nueva ruta/página | URL explícita y espacio amplio | interrumpe historial, agrega back/forward y mayor superficie de pérdida local | diferir |
| popover pequeño | rápido | mala búsqueda/listas largas, débil en móvil y teclado | no recomendada |

## 7. Browse y creación: separación propuesta

- **Browse:** seleccionar una Source o Version en la barra lateral sólo cambia
  qué historial se ve. Nunca prepara una captura por sí mismo.
- **Nueva carga:** siempre entra por el Supplier Selection Gate.
- **Nuevo proveedor:** debe ser una acción contextual del gate, no un atajo que
  parezca cambiar el proveedor de una lista ya iniciada. Tras crear Source, el
  flujo vuelve al gate con esa Source resaltada y requiere `Usar este
  proveedor` para comenzar la carga.
- Una futura administración dedicada de Sources podría conservar una creación
  separada, pero no debe compartir semántica con el inicio rutinario de carga.

## 8. Inmutabilidad y trabajo sin guardar

La frontera propuesta es coherente con el contrato actual:

- antes del primer guardado, `sourceId`, filas, descripción, modo y completeness
  sólo son estado de UI y se pueden descartar o cambiar;
- el primer `POST` crea la Version y consume el siguiente `vN` bajo lock;
- el `PUT` de Draft no tiene `sourceId` y la actualización de persistencia no
  toca `source_id`;
- Analyze, reconciliación y Apply mantienen la misma Source.

La guardia debe activarse al navegar a otra Source/Version, comenzar otra carga,
cambiar Source en el gate, salir o recargar **sólo si** hay filas o metadatos
materiales sin guardar. Un workspace en blanco no debe producir confirmaciones
ruidosas. La decisión debe ofrecer conservar el trabajo actual/cancelar la
transición o descartarlo y continuar; no debe guardar automáticamente una
lista contra una Source que el operador quizá quiera corregir.

## 9. Accesibilidad, teclado y móvil

El diálogo recomendado debe reutilizar el foco modal accesible existente y:

- poner el foco inicial en búsqueda, no en una Source preseleccionada;
- permitir Tab y Shift+Tab dentro del diálogo, Escape para cancelar y restaurar
  el foco al CTA que abrió el gate;
- exponer lista/resultados con nombre, número de versiones y estado de Source;
- permitir flechas para recorrer resultados y Enter/Space para ejecutar
  `Usar este proveedor`, sin activar una fila sólo al recibir foco;
- comunicar “ningún proveedor seleccionado” y la Source elegida con texto,
  no sólo color;
- usar una lista de ancho completo, búsqueda visible y CTA fijo inferior en
  viewport estrecho; el historial permanece fuera del diálogo, sin columnas
  laterales obligatorias.

## 10. Observación contextual de AG v52

La evidencia `AG v52` mostró que omitir Brand cambia la firma de proveedor y
puede transformar un reconocimiento histórico en `NEW`. Esto justifica que el
workspace muestre claramente el contexto de captura, pero no autoriza inferir
o persistir defaults de proveedor todavía.

Actualmente Tipo/Categoría/Marca se guardan como defaults de sesión del
Composer, no como perfil de SupplierSource. Los datos históricos permiten una
investigación futura sobre sugerencias observables, pero una sugerencia de
último uso requeriría reglas de procedencia, vigencia, compatibilidad y
opt-in; no debe ocultar una diferencia ni aplicarse automáticamente en UX-001.

## 11. Inventario de interacciones

| Interacción actual o propuesta | Clasificación | Tratamiento UX-001 |
| --- | --- | --- |
| entrar a Composer y ver historial | KEEP | navegación sin preparar una carga |
| elegir Source para browse | KEEP | renombrar para que no signifique “dueño activo” de captura |
| abrir una Version | KEEP | conservar guardia de pérdida material |
| selector `Proveedor activo` | REMOVE/REPLACE | reemplazar por gate de nueva carga; no seleccionar automáticamente |
| botón por Source `Nueva carga` | REMOVE/REPLACE | dirigir al mismo gate sin pasar `sourceId` implícito |
| CTA global `Nueva carga` | KEEP/CONTEXTUAL | abrir gate sin selección |
| elegir Source existente | KEEP | una acción explícita `Usar este proveedor` |
| `Nuevo proveedor` en sidebar | MAKE SECONDARY | moverlo al gate para el flujo de intake |
| crear Source desde gate | KEEP/CONTEXTUAL | regresar con Source creada, aún sin Version |
| paste y edición de grid | KEEP | sólo después de decisión explícita |
| defaults de lote | KEEP | visibles; no inferir perfil de proveedor |
| Guardar borrador | KEEP | conservar como frontera durable explícita |
| asignación de `vN` | AUTOMATE | permanece server-side al primer guardado válido |
| analizar una Version | NEEDS OWNER DECISION | conservar explícito en V1; evaluar automatización sólo en un alcance posterior |
| decisiones de excepción | KEEP | siempre humanas y contextuales |
| Apply | KEEP | confirmación y capacidades actuales sin cambios |
| comparación histórica y Coverage | MAKE SECONDARY | conservar para auditoría de Version persistida |
| posibles defaults desde historial | INFER, FUTURE | sólo si hay política segura y opt-in posterior |

## 12. Resultado local de UX-001

- El historial de AG y las Versiones existentes se puede explorar sin abrir el
  gate ni preparar una carga.
- `Nueva carga`, incluso desde el historial, abre el gate sin una Source
  heredada. Cancelar conserva la Version que el operador estaba revisando.
- La elección explícita muestra `AG` como proveedor de la carga pendiente y
  ofrece `Cambiar` sólo antes del primer guardado.
- La creación contextual queda encadenada al workspace pendiente. La creación
  independiente conserva el trabajo local que ya existiera.
- La QA local no creó Sources ni Versiones, no guardó borradores, no analizó ni
  aplicó: `v52` y `v53` permanecieron sólo como evidencia histórica.

## 13. UX-001B — Workspace Entry + Recoverable Sources Panel

El Owner aceptó `UX-001B-D01..D07` como refinamiento de la misma superficie:

- existe un único CTA primario `Nueva carga`, dentro de `Fuentes y versiones`;
  el workspace vacío no duplica ese inicio;
- browse no materializa una Version ni el editor: el workspace derecho sólo se
  activa por una Version explícita o una Source explícitamente elegida en el
  gate UX-001;
- sin selección se muestra un estado neutro que explica cómo revisar una
  Version o iniciar una carga, sin simular carga ni competir con navegación;
- el control Mostrar/Ocultar `Fuentes y versiones` vive en el shell del
  Composer, fuera del panel que controla, permanece disponible en todos los
  estados y conserva `aria-expanded`, nombre accesible, tooltip y foco visible;
- ocultar el panel no cambia la selección ni lo reabre automáticamente. La
  preferencia sigue siendo estado de presentación de la página, no se persiste
  ni modifica SupplierSource, Version, ownership o dominio.

La corrección es exclusivamente de composición React/CSS y regresiones
focalizadas. No toca defaults de Supplier, capture mode, completeness,
matching, coverage, reconciliación, Apply, retiro, memoria, audit, endpoints o
migraciones.

## 14. UX-001C — Sources Panel Collapse Affordance Polish

UX-001C sustituye únicamente la presentación del control UX-001B que el Owner
rechazó por parecer un botón cuadrado flotante entre navegación y workspace.
No cambia `sourcesOpen` ni ninguna selección, carga o contrato de dominio:

- con Sources abierto, el botón nativo terciario vive en el encabezado de
  `Fuentes y versiones`, tiene el nombre accesible `Ocultar fuentes y
  versiones` e indica el cierre hacia la izquierda;
- con Sources cerrado, el contenido del panel no se renderiza, la grilla pasa
  a una sola columna y no queda rail ni columna vacía. Un botón compacto,
  integrado al borde izquierdo del workspace, conserva el nombre `Mostrar
  fuentes y versiones` e indica la expansión hacia la derecha;
- el botón usa tokens de superficie, borde y foco existentes, sin color fijo,
  CTA adicional ni FAB. Su posición es local al workspace, por lo que no
  reserva gutter ni altura estructural a 640 px;
- ocultar/restaurar sigue siendo estado de presentación React: no provoca
  fetch, no cambia Source/Version, no pierde proveedor pendiente ni recrea el
  workspace. El CTA único `Nueva carga` continúa dentro de Sources. Como los
  botones son equivalentes pero se desmontan entre estados, el foco se
  transfiere al nuevo control sólo después de ese cambio de presentación.

Las regresiones focalizadas cubren ambos nombres accesibles, la asociación del
control abierto con el panel, la disponibilidad del botón compacto cerrado sin
rail, el CTA único
y el contrato de foco existente. El walkthrough Chrome local autenticado
confirmó estado neutro, la selección explícita de AG para una nueva carga y su
workspace pendiente tras ocultar/restaurar, `AG v53` preservada tras
ocultar/restaurar, desktop, 768 px, 640 px y temas claro/oscuro sin crear ni
modificar Sources, Versions o Catalog; no se introdujeron credenciales.

El micro-polish posterior del Owner conserva el estado abierto y desplaza sólo
la manija cerrada: se centra junto al mensaje del workspace vacío y se apoya
en el borde de la primera tarjeta cuando existe carga o Version. Un tramo de
borde corto hace legible su pertenencia al workspace vacío, sin rail ni ancho
reservado. Fondo, borde, chevron y hover usan tokens neutros; el contorno de
marca aparece únicamente con `:focus-visible`.

## 15. Diferido explícitamente

La posible sugerencia de defaults por `SupplierSource` permanece fuera de
UX-001. Cualquier sugerencia futura debe ser visible, nunca automática, y
requerirá decisión/PBI propio.

No se recomienda cambiar endpoints, esquema, migraciones, matching, memoria,
coverage, vN, Apply ni perfiles de defaults como parte de este slice.

## Referencias auditadas

- [PBI-041](../backlog/pbis/PBI-041.md)
- [Price List Bulk Import Audit and Domain Design](PRICE_LIST_BULK_IMPORT_AUDIT_AND_DOMAIN_DESIGN.md)
- [Price List Architecture](../architecture/PRICE_LIST_ARCHITECTURE.md)
- [PBI-041 Persistence Design](../quality/evidence/pbi-041/PERSISTENCE_DESIGN.md)
