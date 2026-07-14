# Auditoría funcional y semántica del detalle de reparación

**Estado:** Borrador para validación.
**Propósito:** Reconstruir la experiencia activa de consulta y actualización de una reparación y separar evidencia, inferencia y ausencias.
**Alcance:** Panel de reparaciones, modal dinámico, lecturas, mutaciones, impresión, configuración, permisos y conexiones laterales necesarias.
**Fuente:** Código local de SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
**Audiencia:** Product Owner, operaciones, finanzas, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

## Resultado ejecutivo

El “detalle” legacy no es una ficha transaccional única. Es un modal construido en el navegador que reúne una fotografía mutable de `reparaciones`, catálogos configurables, anticipos, seguimientos y evidencias. El botón principal sobrescribe en una sola petición técnico, estado, presupuesto final y custodia; otros actos —anticipo, seguimiento, evidencia, webhook e impresión— suceden mediante solicitudes independientes.

El código confirma dos dimensiones distintas: `estado` expresa una etiqueta configurable del trabajo y `entregado` expresa custodia mediante `En Tienda` o `Entregado`. Ninguna se valida como máquina de estados. Un cliente directo puede enviar texto arbitrario y el backend no comprueba transición, catálogo, saldo, evidencia, razón ni permiso de acción. **Estado de conocimiento:** `Confirmed by legacy code`.

El catálogo activo, las plantillas y los webhooks son datos de base de datos. Sin ejecutar el sistema no es posible afirmar qué valores están realmente configurados en una sucursal. **Estado de conocimiento:** `Unknown`.

## Superficie activa

| Componente | Papel observado | Estado de conocimiento | Evidencia principal |
|---|---|---|---|
| `views/reparaciones/detalle_modal.php` | Compatibilidad: redirige al panel; no contiene el modal actual. | `Confirmed by legacy code` | `public_html/sistema/views/reparaciones/detalle_modal.php:1-24` |
| `views/reparaciones/panel.php` | Protege la vista, muestra filtros/listado y aporta el contenedor vacío del modal. | `Confirmed by legacy code` | `public_html/sistema/views/reparaciones/panel.php:1-2,93-112,116-200` |
| `js_css/reparaciones.js` | Orquesta listado, filtros y apertura por folio. | `Confirmed by legacy code` | `public_html/sistema/funciones/reparaciones/js_css/reparaciones.js` |
| `js_css/detalle_modal.js` | Construye la interfaz y coordina lecturas, guardados, WhatsApp, galería e impresión. | `Confirmed by legacy code` | `public_html/sistema/funciones/reparaciones/js_css/detalle_modal.js:1030-1530,1811-2051` |
| Endpoints PHP | Persisten y consultan fragmentos separados del detalle. | `Confirmed by legacy code` | Inventario de endpoints de este documento |
| Base de datos/R2 | Conserva la reparación, pagos, seguimientos, archivos, catálogos, plantillas y objetos de evidencia. | `Confirmed by legacy code` para referencias; `Unknown` para datos activos | Consultas SQL y escritura R2 inspeccionadas |

## Archivos inspeccionados

La inspección directa cubrió 27 archivos participantes o laterales:

| Grupo | Archivos |
|---|---|
| Vistas | `public_html/sistema/views/reparaciones/detalle_modal.php`; `panel.php`; `configuracion_reparaciones.php` |
| JavaScript activo | `public_html/sistema/funciones/reparaciones/js_css/detalle_modal.js`; `reparaciones.js`; `configuracion_reparaciones.js` |
| Lecturas del módulo | `obtener_reparaciones.php`; `obtener_catalogos.php`; `obtener_detalle_reparacion.php`; `configuraciones/consultar_configuraciones.php`; `obtener_anticipos.php`; `obtener_seguimientos.php`; `obtener_evidencias.php` |
| Mutaciones del módulo | `guardar_detalle_reparacion.php`; `guardar_anticipo.php`; `guardar_seguimiento.php`; `enviar_webhook_listo.php`; `configuraciones/agregar_configuracion.php`; `editar_configuracion.php`; `eliminar_configuracion.php` |
| Impresión | `public_html/sistema/funciones/imprimir_ticket/funciones/imprimir_ticket.php` |
| Acceso y contexto | `public_html/sistema/proteger_vista.php`; `includes/view_guard.php`; `includes/guards.php` |
| Alta usada para contraste | `public_html/sistema/funciones/reparaciones/guardar_reparacion.php` |
| Compras/inventario lateral | `public_html/sistema/funciones/orden_de_compra/funciones/guardar_lista_compra.php`; `crear_orden.php` |

Además se realizaron búsquedas amplias en el repositorio por estados, técnico, diagnóstico, presupuesto, autorización, pago, caja, seguimiento, evidencia, entrega, garantía, reapertura, cancelación, eliminación, impresión, mensajes, inventario y refacciones. Las conclusiones `Not found` se limitan a ese repositorio y corte.

## Arquitectura observada

| Capa/frontera | Responsabilidad observable | Acoplamiento relevante |
|---|---|---|
| Vista PHP | Protege el panel y deja un contenedor de modal | No define el formulario activo |
| Orquestador JavaScript | Compone HTML, mantiene valores temporales y secuencia múltiples `fetch` | Contiene reglas de cierre, saldo, texto y navegación |
| Endpoints PHP | Consultas/mutaciones pequeñas por folio y contexto | Repiten guardias; no comparten autorización por acción ni transacción global |
| Persistencia SQL | Fila principal más colecciones de pagos/seguimientos/archivos/configuración | Folio textual enlaza varios registros; el detalle sobrescribe estado actual |
| Almacenamiento R2 | Conserva objeto de evidencia | La referencia SQL se escribe después de la carga |
| Salidas externas | `wa.me`, webhook y ventana de impresión | No comparten una bitácora de entrega o snapshot |

La arquitectura coloca parte de la semántica en el navegador y parte en comparaciones textuales de endpoints. No se encontró un servicio único que represente la operación completa. **Estado de conocimiento:** `Confirmed by legacy code`.

## Secuencia reconstruida

1. El panel carga reparaciones acotadas por `tenant_id` y `sucursal_id` y permite filtrar por estado, técnico y custodia.
2. Al abrir un folio, JavaScript solicita primero el registro completo a `obtener_detalle_reparacion.php` y después los catálogos a `consultar_configuraciones.php`. Si falla una de esas dos solicitudes, el detalle no termina de construirse.
3. El navegador compone encabezado, datos de recepción, información técnica, decisiones operativas, presupuesto, anticipos, seguimientos y evidencias.
4. Después del render dispara lecturas independientes de anticipos, seguimientos y evidencias. Sus fallas pueden dejar incompleta solo una subsección.
5. `Guardar cambios` toma los valores actuales de cuatro controles. Si el texto del estado seleccionado contiene `listo` o `no quedo`, intenta primero el webhook; después actualiza el registro y recarga toda la página.
6. Agregar anticipo y agregar seguimiento/evidencia son mutaciones separadas. No participan en la misma transacción del guardado principal.
7. WhatsApp e impresión abren canales externos o ventanas nuevas; no generan un registro de comunicación o reimpresión en el alcance encontrado.

**Estado de conocimiento:** `Confirmed by legacy code`, con inferencia únicamente respecto de las consecuencias de fallas parciales.

### Matriz del flujo completo

El detalle por paso —actor, archivo UI, endpoint, validación frontend/backend, tablas/columnas, estado requerido/resultante, efectos, auditoría, permiso, consumidor y falla parcial— está normalizado en el [catálogo de acciones](REPAIR_DETAIL_ACTION_CATALOG.md). Esta matriz conserva la secuencia solicitada:

| Paso | Operación | Acción trazable | Frontera y posible resultado parcial |
|---:|---|---|---|
| 1 | Lectura de reparación | `LEGACY-RD-ACTION-001` | `fetch` → endpoint → `reparaciones`; falla impide construir el modal |
| 2 | Lectura de pagos | `LEGACY-RD-ACTION-002`, `013` | Petición separada; puede faltar lista/saldo |
| 3 | Lectura de seguimientos | `LEGACY-RD-ACTION-002` | Petición separada; puede faltar la línea narrativa |
| 4 | Lectura de evidencias | `LEGACY-RD-ACTION-002`, `011` | Petición separada; además produce log de lectura |
| 5 | Lectura de configuración/permisos | `LEGACY-RD-ACTION-001` | Catálogos se leen; permiso por acción no se consulta |
| 6 | Asignación de técnico | `LEGACY-RD-ACTION-003`, `007` | Cambio temporal hasta el guardado combinado |
| 7 | Cambio de estado | `LEGACY-RD-ACTION-004`, `007`, `008` | Puede intentar salida externa antes de persistir |
| 8 | Presupuesto final | `LEGACY-RD-ACTION-005`, `007` | Sobrescritura sin vínculo con autorización |
| 9 | Seguimiento | `LEGACY-RD-ACTION-009` | Inserción independiente del guardado principal |
| 10 | Pago/anticipo | `LEGACY-RD-ACTION-012`, `013` | Inserción independiente; saldo solo derivado |
| 11 | Evidencia | `LEGACY-RD-ACTION-010`, `011` | R2 y dos registros sin atomicidad común |
| 12 | Impresión | `LEGACY-RD-ACTION-015`, `016` | Documento reconstruido con datos actuales |
| 13 | WhatsApp | `LEGACY-RD-ACTION-014` | Ventana externa sin confirmación persistida |
| 14 | Entrega | `LEGACY-RD-ACTION-006`, `007` | Custodia cambia sin validar saldo/estado/prueba |
| 15 | Webhook | `LEGACY-RD-ACTION-008` | Fila anterior enviada antes del `UPDATE` |
| 16 | Cierre/recarga | `LEGACY-RD-ACTION-007`, `017` | Guardado exitoso recarga página; cerrar local descarta cambios |

## Clasificación semántica de la evidencia

| Elemento | Clasificación | Justificación | Estado/revisión |
|---|---|---|---|
| Reparación consultada por folio | Concepto de dominio confirmado por operación | Es el centro de todas las acciones del modal | `Confirmed by legacy code` |
| `estado` | Estado ambiguo; configuración; concepto mezclado | Texto libre pretende cubrir avance, resultado, garantía y cancelación | `Pending Product Owner validation` |
| `entregado` | Custodia/entrega; estado ambiguo | Campo independiente de estado técnico | `Pending Product Owner validation` |
| `fecha_listo`, `fecha_entregado` | Dato histórico | Primera marca que sobrevive a regresiones | `Confirmed by legacy code` |
| Técnico configurado | Dato maestro/configuración | Nombre textual seleccionable, sin identidad estable | `Pending architecture review` |
| `revisor`, `entregado_por` | Auditoría ambigua | Nombres textuales con reglas de escritura débiles | `Pending Product Owner validation` |
| Presupuestos | Dato financiero | Totales inicial/final sin versión o partidas | `Pending finance review` |
| Anticipo | Dato financiero; no dato de caja demostrado | Fila de pago sin movimiento POS/caja | `Pending finance review` |
| Saldo | Dato derivado | Cálculo en navegador, no persistido | `Confirmed by legacy code` |
| Seguimiento | Texto libre | Narrativa sin categoría ni vínculo a cambios | `Confirmed by legacy code` |
| Imagen adjunta | Evidencia | Objeto R2 y metadatos SQL | `Pending security review` |
| Autorización de cliente | Autorización no estructurada | Solo puede narrarse en seguimiento | `Pending Product Owner validation` |
| Código de seguridad | Riesgo de seguridad | Campo incluido en contratos amplios y posibles salidas | `Pending security review` |
| Guardado combinado/webhook | Riesgo de integridad | Fronteras separadas y datos anteriores | `Pending architecture review` |
| `referencia_reparacion` en compras | Sin uso activo encontrado en detalle | Texto lateral en rutas bloqueadas | `Not found` para integración activa |

## Datos que el modal presenta

El detalle expone folio, datos de cliente y equipo, fechas de recepción/promesa, presupuesto inicial, falla, color, testimonio, condición de recepción, riesgo, posible garantía, características, IMEI, chip, memoria, origen, receptor, código de seguridad y folio anterior. También presenta técnico, estado, custodia, presupuesto final, suma de anticipos, saldo calculado, seguimientos y galería de evidencias.

El endpoint de detalle usa `SELECT *`; por tanto, el contrato HTTP no está reducido a los campos visibles. El código de seguridad se entrega al navegador y puede incorporarse a un ticket si la plantilla usa el token correspondiente y el tipo de seguridad no es `no_tiene`. **Estado de conocimiento:** `Confirmed by legacy code`; exposición aceptable o no: `Pending security review`.

## Controles de acceso observados

La vista del panel pasa por `proteger_vista.php` y el mecanismo de vistas permitidas basado en roles. Los endpoints relevantes exigen sesión, tenant y sucursal; las mutaciones además exigen método `POST`, contexto no sobreescribible por request y token CSRF. Las consultas de reparación incluyen folio, tenant y sucursal.

Sin embargo, los endpoints del detalle no proporcionan a `sr_system_require_endpoint` una opción `permission` o `roles`. Así, el permiso para ver el panel no se reproduce como autorización de cada acción en el backend. Cualquier sesión autenticada que posea contexto válido de esa sucursal podría invocarlos directamente. **Estado de conocimiento:** `Confirmed by legacy code`; impacto: `Pending security review`.

## Endpoints inspeccionados

| # | Endpoint | Papel | Escritura | Control específico observado |
|---:|---|---|---|---|
| 1 | `reparaciones/obtener_reparaciones.php` | Listado y filtros | No | Sesión y alcance tenant/sucursal |
| 2 | `reparaciones/obtener_catalogos.php` | Estados y técnicos para filtros | No | Sesión y alcance tenant/sucursal |
| 3 | `reparaciones/obtener_detalle_reparacion.php` | Registro completo por folio | No | Sesión y alcance tenant/sucursal |
| 4 | `reparaciones/configuraciones/consultar_configuraciones.php` | Catálogos del modal | No | Sesión y alcance tenant/sucursal |
| 5 | `reparaciones/obtener_anticipos.php` | Pagos del folio | No | Comprueba primero reparación en alcance |
| 6 | `reparaciones/obtener_seguimientos.php` | Línea de seguimientos | No | Sesión y alcance tenant/sucursal |
| 7 | `reparaciones/obtener_evidencias.php` | URLs de evidencia | Lectura con escritura de log | Sesión y alcance tenant/sucursal |
| 8 | `reparaciones/guardar_detalle_reparacion.php` | Técnico, estado, presupuesto final y custodia | Sí | POST, CSRF y alcance; sin permiso de acción |
| 9 | `reparaciones/guardar_anticipo.php` | Inserta anticipo | Sí | POST, CSRF y alcance; sin integración de caja |
| 10 | `reparaciones/guardar_seguimiento.php` | Inserta nota/evidencia | Sí | POST, CSRF, alcance y validación de imagen |
| 11 | `reparaciones/enviar_webhook_listo.php` | Notifica intento de cierre | Salida externa | POST, CSRF y alcance; carga fila previa completa |
| 12 | `imprimir_ticket/funciones/imprimir_ticket.php` | Renderiza ticket cliente/tienda | No persistente | Sesión, alcance, plantilla dinámica |
| 13 | `reparaciones/configuraciones/agregar_configuracion.php` | Agrega estado/técnico u otro tipo | Sí | POST, CSRF y alcance; acepta `tipo` libre |
| 14 | `reparaciones/configuraciones/editar_configuracion.php` | Edita configuración | Sí | POST, CSRF y alcance; sin permiso específico |
| 15 | `reparaciones/configuraciones/eliminar_configuracion.php` | Elimina configuración | Sí | POST, CSRF y alcance; sin permiso específico |
| 16 | `orden_de_compra/funciones/guardar_lista_compra.php` | Guarda referencia textual de reparación en compra | Sí, ruta lateral | Bloqueo legacy al inicio; no valida folio |
| 17 | `orden_de_compra/funciones/crear_orden.php` | Copia referencia textual a producto de orden | Sí, ruta lateral | Bloqueo legacy al inicio; no integra detalle |

La inclusión de los endpoints 16 y 17 sirve solo para probar el único acoplamiento textual encontrado con compras; no implica que sean parte activa del modal.

## Tablas referenciadas en el mapa

| # | Tabla | Uso relevante |
|---:|---|---|
| 1 | `reparaciones` | Registro mutable principal, incluyendo estado, custodia, dinero y responsables textuales |
| 2 | `configuracion_reparaciones` | Estados, técnicos, webhooks y selección de plantillas |
| 3 | `configuracion_global` | Zona horaria usada por algunas mutaciones |
| 4 | `reparacion_pagos` | Anticipos por folio |
| 5 | `reparacion_seguimientos` | Notas y referencias de evidencia |
| 6 | `archivos` | Registro adicional de archivos subidos |
| 7 | `plantillas_editor` | HTML/CSS dinámicos del ticket |
| 8 | `sucursales` | Datos de sucursal incorporados al ticket |
| 9 | `roles` | Soporte del acceso a vistas |
| 10 | `permisos_roles` | Asignación de vistas a roles |
| 11 | `orden_compra_tmp` | Referencia manual y lateral a folio |
| 12 | `ordenes_productos` | Persistencia posterior de esa referencia manual |

R2 también participa como almacén de objetos, pero no es una tabla y no se contabiliza en las doce anteriores.

## Reglas legacy implícitas

Estas reglas describen comportamiento, no requisitos aprobados.

| ID | Regla observada | Estado de conocimiento | Evidencia resumida |
|---|---|---|---|
| `LEGACY-RD-RULE-001` | Para abrir el panel, la sesión debe superar el control de vista. | `Confirmed by legacy code` | `proteger_vista.php`; `view_guard.php:209-290` |
| `LEGACY-RD-RULE-002` | Los endpoints del detalle requieren sesión y contexto tenant/sucursal, pero no un permiso por acción. | `Confirmed by legacy code` | Opciones de guardia de endpoints inspeccionados |
| `LEGACY-RD-RULE-003` | Una reparación se busca por folio más tenant y sucursal. | `Confirmed by legacy code` | Consultas de detalle y guardado |
| `LEGACY-RD-RULE-004` | Los estados seleccionables proceden de configuración de texto libre. | `Confirmed by legacy code` | `consultar_configuraciones.php`; alta de configuración |
| `LEGACY-RD-RULE-005` | Los técnicos seleccionables y persistidos son nombres/texto, no identidades de usuario. | `Confirmed by legacy code` | Opciones del modal y columna `tecnico` |
| `LEGACY-RD-RULE-006` | La UI ofrece exactamente `En Tienda` y `Entregado` como custodia. | `Confirmed by legacy code` | `detalle_modal.js:1200-1203` |
| `LEGACY-RD-RULE-007` | El backend acepta cualquier texto como estado; no verifica el catálogo. | `Confirmed by legacy code` | `guardar_detalle_reparacion.php:66-152` |
| `LEGACY-RD-RULE-008` | El backend acepta técnico vacío o arbitrario. | `Confirmed by legacy code` | Solo el folio es obligatorio |
| `LEGACY-RD-RULE-009` | El backend acepta custodia vacía o arbitraria aunque la UI solo ofrezca dos opciones. | `Confirmed by legacy code` | No hay allowlist en guardado |
| `LEGACY-RD-RULE-010` | Guardar sobrescribe conjuntamente técnico, estado, presupuesto final y custodia. | `Confirmed by legacy code` | Único `UPDATE` de detalle |
| `LEGACY-RD-RULE-011` | El primer guardado con estado distinto de `Pendiente` llena `revisor` con el nombre de sesión. | `Confirmed by legacy code` | `guardar_detalle_reparacion.php:100-127` |
| `LEGACY-RD-RULE-012` | La primera entrada a cuatro literales de cierre llena `fecha_listo`. | `Confirmed by legacy code` | `guardar_detalle_reparacion.php:93-98` |
| `LEGACY-RD-RULE-013` | `fecha_listo` no se limpia al reabrir ni se renueva en cierres posteriores. | `Confirmed by legacy code` | Se conserva el valor existente |
| `LEGACY-RD-RULE-014` | La primera marca exacta `Entregado` llena `fecha_entregado`. | `Confirmed by legacy code` | Comparación exacta de custodia |
| `LEGACY-RD-RULE-015` | Cada guardado en `Entregado` puede reemplazar `entregado_por` con el actor actual. | `Confirmed by legacy code` | Actualización condicional del campo |
| `LEGACY-RD-RULE-016` | Volver a `En Tienda` conserva `fecha_entregado` y el último `entregado_por`. | `Confirmed by legacy code` | No hay limpieza de ambos campos |
| `LEGACY-RD-RULE-017` | La UI intenta el webhook antes de persistir un estado cuyo texto contiene `listo` o `no quedo`. | `Confirmed by legacy code` | `detalle_modal.js:1476-1498` |
| `LEGACY-RD-RULE-018` | El webhook transmite la fila anterior completa, no el estado que se intenta guardar. | `Confirmed by legacy code` | `enviar_webhook_listo.php:43-96` |
| `LEGACY-RD-RULE-019` | La detección del “estado anterior” en frontend toma la primera opción, por lo común el placeholder. | `Confirmed by legacy code` | `detalle_modal.js:1468-1474` |
| `LEGACY-RD-RULE-020` | Una respuesta `ok:false` del webhook no impide guardar; un fallo de red/parseo sí puede interrumpir la cadena. | `Confirmed by legacy code` | Promesas del guardado combinado |
| `LEGACY-RD-RULE-021` | Tras guardar el detalle, el modal se cierra y la página completa se recarga. | `Confirmed by legacy code` | `detalle_modal.js:1501-1511` |
| `LEGACY-RD-RULE-022` | El presupuesto final es un total mutable sin versión, motivo ni historial propio. | `Confirmed by legacy code` | Campo único en `reparaciones` |
| `LEGACY-RD-RULE-023` | El saldo mostrado es presupuesto final menos suma de anticipos, calculado en el navegador. | `Confirmed by legacy code` | `detalle_modal.js:1997-2008` |
| `LEGACY-RD-RULE-024` | La UI exige anticipo mayor que cero; el backend acepta un número negativo distinto de cero. | `Confirmed by legacy code` | Validaciones divergentes de anticipo |
| `LEGACY-RD-RULE-025` | El anticipo se registra con método por defecto `Anticipo`, sin elegir caja ni forma de cobro. | `Confirmed by legacy code` | `guardar_anticipo.php:80-89` |
| `LEGACY-RD-RULE-026` | Un seguimiento admite nota, evidencia o ambos y carece de tipo o relación estructurada. | `Confirmed by legacy code` | Formulario y `guardar_seguimiento.php` |
| `LEGACY-RD-RULE-027` | El navegador capitaliza la primera letra y convierte el resto del seguimiento a minúsculas. | `Confirmed by legacy code` | `detalle_modal.js:1811-1923` |
| `LEGACY-RD-RULE-028` | Guardar una evidencia escribe en R2, `reparacion_seguimientos` y `archivos` sin transacción común. | `Confirmed by legacy code` | `guardar_seguimiento.php:84-164` |
| `LEGACY-RD-RULE-029` | El ticket usa datos actuales y únicamente el pago más reciente; no congela una versión ni totaliza pagos. | `Confirmed by legacy code` | `imprimir_ticket.php:145-305` |
| `LEGACY-RD-RULE-030` | Marcar entrega no bloquea edición, no exige estado listo, saldo, identidad del receptor ni evidencia. | `Confirmed by legacy code` | Ausencia de validaciones en UI y backend |

## Seguimientos y evidencias

`guardar_seguimiento.php` acepta comentario, imagen o ambos. Persiste comentario, nombre textual de colaborador, fecha y referencias de archivo; no recibe tipo, categoría, privacidad, llamada, persona contactada, diagnóstico, decisión, monto autorizado, estado relacionado ni presupuesto relacionado. `obtener_seguimientos.php` devuelve solo comentario, colaborador y fecha, mientras `obtener_evidencias.php` arma la galería por separado.

No se encontraron acciones activas del detalle para editar o borrar seguimientos/evidencias, ni consumidores que los impriman, envíen al cliente o incorporen a reportes. Las rutas administrativas de eliminación halladas fuera del detalle comienzan con respuesta 503 y salida, por lo que no prueban una capacidad operativa activa. **Estado de conocimiento:** estructura `Confirmed by legacy code`; usos adicionales `Not found`.

La evidencia se comprime según formato y tamaño, se carga a R2 y después se referencia en dos tablas. El lector de evidencias escribe un log privado durante una consulta. Privacidad, conservación y borrado están `Pending security review`; atomicidad está `Pending architecture review`.

## Consistencia y atomicidad

El guardado principal es un solo `UPDATE`, pero el resultado operativo completo no es atómico. El webhook ocurre antes; anticipos y seguimientos se insertan aparte; la evidencia cruza R2 y dos tablas sin una transacción distribuida; la impresión lee el estado corriente. Por ello son posibles combinaciones parciales: notificación sin cambio, cambio sin seguimiento, archivo en R2 sin todos sus registros o presupuesto cambiado sin la nota que supuestamente lo autoriza. **Estado de conocimiento:** `Inferred from legacy behavior`, sustentado por fronteras de petición confirmadas.

No se encontró control de concurrencia optimista, versión, `updated_at` esperado, bloqueo de edición después de entrega ni historial de cambios para los cuatro campos del guardado principal. **Estado de conocimiento:** `Not found`.

## Trazabilidad de personas y tiempo

`recibido_por`, `tecnico`, `revisor`, `usuario` del anticipo, `colaborador` del seguimiento y `entregado_por` son textos con significados distintos. El detalle no demuestra una identidad estable ni enlaza todas esas acciones a un ID de usuario. `revisor` en particular significa “primer actor que guardó un estado no Pendiente” por implementación, aunque su nombre sugiera revisión.

Detalle, anticipo y seguimiento resuelven una zona horaria IANA desde configuración global con fallback `America/Hermosillo`. El alta inicial usa otra estrategia documentada en su auditoría separada; el webhook no establece explícitamente la misma zona en su archivo. La coherencia temporal total queda `Pending architecture review`.

## Mensajería e impresión

WhatsApp se abre manualmente con el número visible y un mensaje prefijado; no se persiste entrega, lectura, consentimiento ni contenido enviado. El webhook de “listo” puede enviar todas las columnas de la reparación, incluido el código de seguridad, a cada URL configurada, sin timeout, reintento, clave de idempotencia ni evaluación del cuerpo de respuesta. La respuesta HTTP solo alimenta un contador.

El ticket se genera desde plantilla activa y datos actuales. Su resultado puede cambiar al reimprimir y no se encontró snapshot ni bitácora de reimpresión. El pago expuesto a tokens es solo el último por fecha. **Estado de conocimiento:** `Confirmed by legacy code`; tratamiento de secretos y datos personales: `Pending security review`.

## Garantía, cancelación, reapertura y eliminación

El detalle muestra `posible_garantia` y un folio anterior, y reconoce cuatro literales de cierre que incluyen dos variantes de garantía. No valida vigencia, relación causal, reparación origen, cobertura, resolución ni costo de garantía. Reabrir es simplemente seleccionar otro estado; cancelar solo sería posible como etiqueta configurada/arbitraria. El botón visual `Cancelar` cierra el modal, no cancela la reparación.

No se encontró eliminación de reparación, reversa de pago, razón obligatoria, compensación de inventario ni política explícita de conservación de evidencia. **Estado de conocimiento:** `Not found`; semántica de negocio: `Pending Product Owner validation` y `Pending finance review`.

## Inventario y refacciones

No hay en el modal una lista de servicios/refacciones, reserva, consumo, instalación, devolución ni movimiento de inventario. La única asociación hallada fuera del módulo es `referencia_reparacion`, un texto manual en la orden de compra; las dos rutas de escritura inspeccionadas tienen bloqueo legacy al inicio y no validan el folio contra `reparaciones`.

Por tanto, descubrir una batería dañada puede registrarse como texto y cambiar el presupuesto total, pero no crea una línea de batería ni afecta existencias desde este flujo. **Estado de conocimiento:** `Confirmed by legacy code` para la ausencia en el flujo; inexistencia en sistemas externos: `Unknown`.

## Escenario de control: pantalla y batería

| Hecho del escenario | Representación legacy | Calidad de evidencia |
|---|---|---|
| Falla original de pantalla | Campo inicial `falla` | Estructurada, pero inmutable desde el detalle |
| Hallazgo adicional de batería | Texto libre de seguimiento | Posible, no obligatorio ni tipificado |
| Llamada al cliente | Texto libre de seguimiento | Afirmación manual; no hay registro de llamada |
| Persona que autoriza | Texto libre | Sin campo dedicado ni identidad verificable |
| Monto autorizado | Texto libre y/o nuevo presupuesto final | No existe vínculo estructural entre ambos |
| Nuevo total | Sobrescritura de `presupuesto_final` | Sin versión, líneas, razón ni actor dedicado |
| Batería requerida/instalada | Sin representación en detalle | `Not found` |
| Efecto de inventario | Ninguno desde el detalle | `Not found` |

El sistema permite guardar primero un seguimiento y después el nuevo total, o solo uno de ambos. No puede demostrar de forma estructurada que una autorización específica causó una versión específica del presupuesto.

## Hallazgos principales

- Estado de reparación y custodia son campos independientes, textuales y sin transiciones validadas.
- Técnico y actores se conservan como nombres, con pérdida de historial e identidad estable.
- Presupuesto final, autorización y pagos no forman una cadena financiera trazable.
- Entrega no exige estado listo, saldo, nota, receptor, INE, evidencia o excepción autorizada.
- Webhook, guardado, seguimiento, evidencia, pago e impresión cruzan fronteras independientes.
- El permiso de vista, la protección CSRF y el alcance de sucursal existen, pero no hay autorización backend por acción.
- Garantía, reapertura y cancelación aparecen como campos/etiquetas, no como procesos con efectos propios.
- No se encontró integración activa del detalle con refacciones, inventario o caja.

La versión completa y su estado de conocimiento están en [REPAIR_DETAIL_DOMAIN_FINDINGS.md](REPAIR_DETAIL_DOMAIN_FINDINGS.md).

## Riesgos críticos observados

| Riesgo | Evidencia resumida | Revisión |
|---|---|---|
| Integridad de transición | Estado/custodia libres, sin valor anterior, motivo o concurrencia | `Pending architecture review` |
| Pérdida de trazabilidad | Sobrescritura de técnico, presupuesto y estado; actores textuales | `Pending Product Owner validation` |
| Exposición de datos | `SELECT *`, código de seguridad, webhook completo y plantilla dinámica | `Pending security review` |
| Inconsistencia financiera | Pago sin caja, negativos directos, saldo derivado y entrega con deuda | `Pending finance review` |
| Resultado parcial | Webhook previo, evidencia multialmacén y mutaciones separadas | `Pending architecture review` |
| Custodia no demostrable | No identifica receptor ni exige nota/INE/evidencia/excepción | `Pending Product Owner validation` y `Pending security review` |
| Documento no reproducible | Reimpresión con datos/plantilla actuales y solo último pago | `Pending finance review` |

## Conclusiones

1. El modal es evidencia de varias decisiones reales de operación, pero su fila actual no reconstruye el proceso que llevó a ellas.
2. Los términos legacy no deben asumirse como lenguaje de dominio aprobado: algunos son configuración, otros datos derivados y otros nombres que exceden su comportamiento.
3. El escenario pantalla+batería existe únicamente como combinación manual de nota libre y sobrescritura de total; la autorización no queda vinculada.
4. `reparacion_pagos` demuestra un registro monetario por folio, no caja, aplicación contable o cuenta por cobrar.
5. La validación de SR Taller 2.0 requiere decisiones explícitas de Product Owner, finanzas, seguridad y arquitectura antes de interpretar o migrar estas semánticas.

## Límites de esta auditoría

- No se inspeccionaron valores reales de la base de datos, por lo que los catálogos activos, webhooks y plantillas permanecen desconocidos.
- No se ejecutaron rutas ni se ensayaron permisos con usuarios reales.
- No se declara la intención original de nombres como `revisor`; solo se registra su comportamiento.
- Las búsquedas negativas se limitan al repositorio versionado y a las rutas relevantes.
- Las decisiones futuras se mantienen en [REPAIR_DETAIL_OPEN_QUESTIONS.md](REPAIR_DETAIL_OPEN_QUESTIONS.md); no se adelanta una solución.

## Documentos relacionados

- [Catálogo de acciones](REPAIR_DETAIL_ACTION_CATALOG.md)
- [Mapa de estado y custodia](REPAIR_DETAIL_STATE_AND_CUSTODY_MAP.md)
- [Mapa de dinero y autorización](REPAIR_DETAIL_MONEY_AND_AUTHORIZATION_MAP.md)
- [Hallazgos de dominio](REPAIR_DETAIL_DOMAIN_FINDINGS.md)
- [Preguntas abiertas](REPAIR_DETAIL_OPEN_QUESTIONS.md)
