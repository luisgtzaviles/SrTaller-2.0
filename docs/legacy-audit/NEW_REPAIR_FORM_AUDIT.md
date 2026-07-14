# Auditoría del formulario “Nueva Reparación”

- **Estado:** Confirmed by legacy code
- **Propósito:** Describir la implementación observada, sus reglas implícitas, usos posteriores y límites semánticos.
- **Alcance:** Desde la apertura del modal hasta la creación, anticipo, impresión, recarga y capacidades posteriores inmediatas.
- **Fuente:** SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
- **Audiencia:** Product Owner, Domain Experts, Arquitectura, Seguridad, QA y desarrollo de SR Taller 2.0.
- **Última actualización:** 2026-07-14

> Evidencia de legado; no constituye especificación ni diseño aprobado de SR Taller 2.0.

## Resumen ejecutivo

“Nueva Reparación” crea una orden operativa en estado `Pendiente` y ubicación lógica `En Tienda`. Antes de insertar puede localizar o crear un cliente maestro, pero también copia nombre y teléfono dentro de la reparación. El equipo no tiene entidad reutilizable: marca, modelo, IMEI/serie y condición viven en la fila de la reparación.

La creación de cliente y reparación sí comparte una transacción. El anticipo, la impresión y la evidencia quedan fuera: el anticipo es una segunda petición; la impresión abre una ventana con una plantilla almacenada en base de datos; la evidencia sólo se agrega después desde el detalle. No se envía un mensaje al crear. El botón de WhatsApp es manual y el webhook aparece al intentar cambiar posteriormente a un estado de cierre.

Los riesgos principales son: folio calculado sin reserva ni bloqueo, pago parcial fuera de la transacción, secreto de desbloqueo reversible, garantía no validada, consentimiento de riesgo débil, semántica financiera y temporal ambigua, y auditoría insuficiente.

## Arquitectura observada

| Capa heredada | Responsabilidad observada | Evidencia |
|---|---|---|
| Vista contenedora | Abre un modal con `iframe` y luego recarga el panel. | `public_html/sistema/views/reparaciones/panel.php:28-33,161-184`; `.../js_css/modal_reparacion.js:1-45` |
| Vista del formulario | Define controles visibles, ocultos y carga de scripts. | `public_html/sistema/views/reparaciones/crear_reparacion.php:520-755` |
| JavaScript de alta | Carga configuración y catálogos, busca cliente, normaliza, valida, arma payload y encadena escrituras/impresión. | `public_html/sistema/funciones/reparaciones/js_css/crear_reparacion.js:1-107,497-550,709-783,876-1027,1309-1548` |
| JavaScript de patrón | Captura una secuencia 1–9 y genera una miniatura SVG. | `public_html/sistema/funciones/reparaciones/js_css/patron.js:1-221` |
| Endpoint de alta | Normaliza, valida según configuración, hace upsert de cliente e inserta reparación. | `public_html/sistema/funciones/reparaciones/guardar_reparacion.php:323-515` |
| Helpers | Resuelven cliente maestro, deduplicación y configuración efectiva tenant/sucursal. | `public_html/sistema/includes/reparaciones_clientes.php:11-291`; `.../reparaciones_form_config.php:14-308` |
| Endpoints auxiliares | Folio, catálogos, países, búsqueda de cliente, anticipo y ticket. | Véase [trazabilidad](NEW_REPAIR_TRACEABILITY.md). |
| Consumo posterior | Lista, detalle, edición de estado/presupuesto, pagos, seguimiento, evidencia, WhatsApp y webhook. | `.../obtener_reparaciones.php`; `.../obtener_detalle_reparacion.php`; `.../js_css/detalle_modal.js` |

La lógica de negocio está distribuida entre JavaScript, PHP, datos de configuración y plantillas guardadas en base de datos. Hay SQL embebido y el folio textual es la clave de integración de pagos, seguimientos, impresión y acciones posteriores.

## Archivos inspeccionados

### Entrada, alta y configuración

- `public_html/sistema/views/reparaciones/panel.php`
- `public_html/sistema/views/reparaciones/crear_reparacion.php`
- `public_html/sistema/funciones/reparaciones/js_css/modal_reparacion.js`
- `public_html/sistema/funciones/reparaciones/js_css/crear_reparacion.js`
- `public_html/sistema/funciones/reparaciones/js_css/patron.js`
- `public_html/sistema/funciones/reparaciones/guardar_reparacion.php`
- `public_html/sistema/funciones/reparaciones/obtener_siguiente_folio.php`
- `public_html/sistema/funciones/reparaciones/form_config_get.php`
- `public_html/sistema/funciones/reparaciones/clientes_buscar.php`
- `public_html/sistema/funciones/reparaciones/cliente_upsert.php`
- `public_html/sistema/funciones/reparaciones/catalogos_buscar.php`
- `public_html/sistema/funciones/reparaciones/catalogos_upsert.php`
- `public_html/sistema/funciones/catalogos/paises_activos.php`
- `public_html/sistema/includes/reparaciones_clientes.php`
- `public_html/sistema/includes/reparaciones_form_config.php`
- `public_html/sistema/includes/module_catalogs.php`

### Efectos y consumo posterior

- `public_html/sistema/funciones/reparaciones/guardar_anticipo.php`
- `public_html/sistema/funciones/reparaciones/obtener_anticipos.php`
- `public_html/sistema/funciones/imprimir_ticket/funciones/imprimir_ticket.php`
- `shared/security/ticket_template_policy.php`
- `public_html/sistema/funciones/reparaciones/obtener_reparaciones.php`
- `public_html/sistema/funciones/reparaciones/obtener_detalle_reparacion.php`
- `public_html/sistema/funciones/reparaciones/guardar_detalle_reparacion.php`
- `public_html/sistema/funciones/reparaciones/js_css/reparaciones.js`
- `public_html/sistema/funciones/reparaciones/js_css/detalle_modal.js`
- `public_html/sistema/funciones/reparaciones/guardar_seguimiento.php`
- `public_html/sistema/funciones/reparaciones/obtener_seguimientos.php`
- `public_html/sistema/funciones/reparaciones/obtener_evidencias.php`
- `public_html/sistema/funciones/reparaciones/enviar_webhook_listo.php`
- `public_html/saas/acciones/administrador_archivos/funciones/eliminar_archivos.php`
- `public_html/saas/acciones/administrador_archivos/funciones/eliminar_registros_bd.php`
- `database/migrations/2026_06_11_v1_0005_reparaciones_clientes_form_config.sql`

Se hicieron además búsquedas de repositorio completo por folio, IMEI/serie, garantía, promesa, riesgo, seguridad, evidencia, impresión, mensajes y tablas/triggers.

## Tablas observadas

| Tabla | Papel |
|---|---|
| `reparaciones` | Orden y snapshot de cliente/equipo/recepción. |
| `reparaciones_clientes` | Cliente maestro por tenant y sucursal. |
| `reparaciones_form_config` | Requeridos y defaults superpuestos. |
| `configuracion_reparaciones` | Catálogos, riesgos, webhooks y asignación de plantilla. |
| `configuracion_global` | Zona horaria. |
| `catalogo_paises` | Países/códigos telefónicos, en conexión SaaS. |
| `reparacion_pagos` | Anticipos/pagos por folio. |
| `reparacion_seguimientos` | Comentarios y referencia de evidencia por folio. |
| `archivos` | Inventario de objetos subidos. |
| `plantillas_editor` | HTML/CSS activo de tickets. |
| `sucursales` | Datos y logo usados en impresión. |

## Reglas implícitas observadas

| ID | Regla observada | Estado y evidencia |
|---|---|---|
| `LEGACY-NR-RULE-001` | El siguiente folio es `F` + último sufijo numérico + 1, con mínimo cuatro dígitos. | Confirmado: `obtener_siguiente_folio.php:25-40`. |
| `LEGACY-NR-RULE-002` | El folio se consulta al abrir y se vuelve a consultar justo antes de guardar. | Confirmado: `crear_reparacion.js:1321-1334,1499-1506`. |
| `LEGACY-NR-RULE-003` | El folio se segmenta por tenant y sucursal, no por año. | Confirmado: `obtener_siguiente_folio.php:22-27`. |
| `LEGACY-NR-RULE-004` | El cliente se reutiliza por ID o por clave deduplicada; teléfono prevalece y, sin teléfono, se usa nombre normalizado. | Confirmado: `reparaciones_clientes.php:11-18,153-205`. |
| `LEGACY-NR-RULE-005` | Seleccionar un cliente no actualiza su ficha; editar nombre/teléfono en el formulario desvincula el ID seleccionado. | Confirmado: `reparaciones_clientes.php:167-175`; `crear_reparacion.js:1010-1027,1194-1221`. |
| `LEGACY-NR-RULE-006` | Nombre y teléfono maestros se copian a la reparación como snapshot. | Confirmado: `guardar_reparacion.php:421-432,435-483`. |
| `LEGACY-NR-RULE-007` | Los requeridos por defecto son nombre, teléfono, marca, modelo, falla y tipo de seguridad; la configuración puede alterarlos. | Confirmado: `reparaciones_form_config.php:60-96`. |
| `LEGACY-NR-RULE-008` | Chip, memoria, posible garantía y recibido pueden persistir vacíos si no son requeridos. | Confirmado: `reparaciones_form_config.php:44-47`; `guardar_reparacion.php:348-360`. |
| `LEGACY-NR-RULE-009` | Riesgo toma `no_aplica` por defecto y debe pertenecer al catálogo efectivo. | Confirmado: `guardar_reparacion.php:356-359`. |
| `LEGACY-NR-RULE-010` | Marca, modelo y falla pueden crear valores de catálogo desde el formulario; riesgo no. | Confirmado: `crear_reparacion.js:709-783`; `catalogos_upsert.php`. |
| `LEGACY-NR-RULE-011` | PIN/contraseña o patrón son obligatorios condicionalmente; “no tiene” borra el valor. | Confirmado: `crear_reparacion.js:406-445`; `guardar_reparacion.php:361-379`. |
| `LEGACY-NR-RULE-012` | El SVG de patrón se genera en el navegador, pero no se envía ni persiste. | Confirmado/No encontrado: `patron.js:125-128`; payload en `crear_reparacion.js:1464-1497`. |
| `LEGACY-NR-RULE-013` | IMEI/serie sólo acepta alfanuméricos en frontend; backend no repite esa validación. | Confirmado: `crear_reparacion.js:1449-1459`; `guardar_reparacion.php:346,393`. |
| `LEGACY-NR-RULE-014` | Toda alta nace `Pendiente` y `En Tienda`, independientemente del payload. | Confirmado: `guardar_reparacion.php:383,386,479-480`. |
| `LEGACY-NR-RULE-015` | Usuario receptor, tenant y sucursal provienen de sesión/contexto, no del formulario. | Confirmado: `guardar_reparacion.php:1-24,387,475,482-483`. |
| `LEGACY-NR-RULE-016` | La fecha de recepción se escribe con `NOW()` tras fijar la zona de la sesión SQL. | Confirmado: `guardar_reparacion.php:29-49,445`. |
| `LEGACY-NR-RULE-017` | La promesa del control `datetime-local` llega como texto local sin zona ni validación de fecha. | Confirmado: `crear_reparacion.php:697-702`; `guardar_reparacion.php:353,398,463`. |
| `LEGACY-NR-RULE-018` | Presupuesto inicial y anticipo se normalizan a enteros no negativos en frontend. | Confirmado: `crear_reparacion.js:1224-1243,1495-1496`. |
| `LEGACY-NR-RULE-019` | Puede crearse una reparación con anticipo cero; si el campo es requerido, debe ser mayor que cero. | Confirmado: `crear_reparacion.js:1430-1441,1518-1520`; `guardar_reparacion.php:400-402`. |
| `LEGACY-NR-RULE-020` | El anticipo no se guarda en `reparaciones`; crea después una fila en `reparacion_pagos`. | Confirmado: `crear_reparacion.js:1520-1533`; `guardar_anticipo.php:45-93`. |
| `LEGACY-NR-RULE-021` | No se valida que anticipo sea menor o igual al presupuesto ni que exista presupuesto. | Not found tras revisar ambos endpoints de escritura. |
| `LEGACY-NR-RULE-022` | Tras alta y anticipo exitosos se solicita ticket de cliente, se cierra el modal y se recarga el panel. | Confirmado: `crear_reparacion.js:1535-1541`. |
| `LEGACY-NR-RULE-023` | La evidencia sólo se agrega desde el detalle de una reparación ya existente y se relaciona por folio. | Confirmado: `detalle_modal.js:1811-1922`; `guardar_seguimiento.php:29-48,136-159`. |
| `LEGACY-NR-RULE-024` | No hay mensaje automático al crear; WhatsApp requiere acción manual desde detalle. | Confirmado/No encontrado: alta `crear_reparacion.js:1499-1548`; WhatsApp `detalle_modal.js:1416-1442`. |
| `LEGACY-NR-RULE-025` | El webhook de “listo” se intenta antes de guardar el nuevo estado y recibe el snapshot anterior. | Confirmado: `detalle_modal.js:1476-1498`; `enviar_webhook_listo.php:40-98`. |
| `LEGACY-NR-RULE-026` | Los datos originales de recepción no tienen edición en el detalle; sólo técnico, estado, presupuesto final y entrega. | Confirmado: `guardar_detalle_reparacion.php:66-152`. |

## Campos con uso confirmado

- Identidad operativa: folio, tenant, sucursal, fecha y receptor.
- Cliente: ID maestro, nombre snapshot, teléfono snapshot y variantes telefónicas maestras.
- Equipo: marca, modelo, IMEI/serie, color, chip, memoria y características.
- Recepción: falla, testimonio, encendido/apagado, riesgo y seguridad.
- Compromiso/dinero: promesa, presupuesto inicial y anticipo/pago separado.
- Garantía: indicador y folio anterior, aunque sin validación de relación.
- Ciclo posterior: estado, entrega, detalle, filtros, ticket, seguimiento, evidencia y acciones de contacto.

El uso exacto de cada uno está en el [catálogo de campos](NEW_REPAIR_FIELD_CATALOG.md).

## Campos con uso dudoso o no encontrado

| Campo | Resultado de búsqueda amplia |
|---|---|
| `patron_svg` | Se genera y guarda en un input oculto, pero no aparece en el payload ni en SQL. `Not found` como dato persistido. |
| `genero` y `rango_edad` | Se fuerzan a `no_info`/`no_capturado` y se almacenan; no se encontró consumidor funcional en el módulo de reparaciones. |
| `origen_cliente` | Se fuerza a `no_capturado`; sólo se encontró visualización opcional en detalle. |
| `caracteristicas` | Texto libre mostrado en detalle y disponible para la plantilla, pero el código no define si significa condición, accesorios o daños. |
| `testimonio` | Se muestra y puede imprimirse por token genérico, pero no participa en diagnóstico, filtros ni reglas encontradas. |
| `recibido` | Se muestra como Encendido/Apagado; no se encontró efecto en decisiones posteriores. |
| `posible_garantia`/`folio_anterior` | Se muestran y quedan disponibles para impresión, pero no se encontró validación ni proceso de garantía. |

Como la plantilla activa vive en `plantillas_editor`, no es determinable sin datos de la base qué tokens aparecen realmente en la nota de cada sucursal.

## Respuestas directas a las dudas de dominio

| Tema | Confirmado por código | No encontrado o no determinable |
|---|---|---|
| Cliente | Busca por nombre, apellido y teléfono (`crear_reparacion.js:962-1003`). La clave de deduplicación usa teléfono y, si falta, nombre (`reparaciones_clientes.php:11-18`). La migración versionada declara unicidad por tenant+sucursal+clave; un teléfono compartido puede resolver al mismo maestro. Cambiar nombre/teléfono antes de guardar limpia el ID seleccionado. La reparación conserva vínculo y snapshot, por lo que sus datos históricos visibles no cambian al modificar el maestro. | La restricción realmente desplegada en producción es `Unknown`. No se encontraron propietario, persona que entrega ni contacto autorizado. El WhatsApp manual usa el teléfono snapshot; el destinatario de notificaciones de negocio requiere validación. |
| Dispositivo | IMEI/serie es opcional por default y, si está vacío, la orden/equipo se reconoce por folio y descripción. Los datos viven en cada reparación; un cliente puede tener varias filas y el mismo IMEI puede volver a capturarse. | No se encontraron tabla reutilizable, control de duplicados por IMEI ni sticker/etiqueta de reparación. “Características” no tiene semántica estructurada. |
| Falla, diagnóstico y testimonio | Falla es catálogo/campo de recepción; testimonio es texto libre visible en detalle. La plantilla puede sustituir ambos si contiene sus tokens. | No se encontró diagnóstico técnico estructurado, edición posterior de esos datos ni evidencia para decidir si “falla” es reporte o diagnóstico. La impresión real depende de la plantilla productiva. |
| Folio y nacimiento | Se calcula al abrir y se recalcula antes de guardar; consultar no reserva ni consume folios. La orden nace con el `INSERT` confirmado. Cliente+orden comparten transacción. El ámbito observado es tenant+sucursal, sin año. | No se encontró bloqueo, reserva ni restricción versionada de unicidad en `reparaciones`; las restricciones productivas son `Unknown`. Si falla anticipo/impresión/evidencia, la orden ya creada no se revierte. |
| Presupuesto y anticipo | Presupuesto inicial se guarda una vez; después se edita un presupuesto final separado sin historial general. Anticipo cero omite el pago. Puede ser mayor al presupuesto porque no hay comparación. El pago guarda sucursal, nombre de usuario, fecha y texto de método; el saldo del detalle usa presupuesto final menos pagos. | No se encontró cotización formal/aceptación, vínculo a caja o turno, reverso/cancelación ni regla de sobrepago. El endpoint directo incluso acepta monto negativo numérico; el frontend lo impide. |
| Promesa | Es opcional por default, usa `datetime-local`, se guarda sin offset y se muestra en detalle. | No se encontraron avisos, filtros, métricas, edición, auditoría ni consecuencia al incumplir. El helper dice “estimada”, por lo que promesa frente a estimación requiere validación. |
| Garantía | Se crea una reparación independiente y se guardan un `si/no` opcional y un folio anterior textual. Puede marcarse `si` sin antecedente. | No se valida existencia, mismo cliente/dispositivo, vigencia ni relación; tampoco se reutilizan datos de la reparación anterior. |
| Recepción y riesgo | “Recibí el equipo” muestra Encendido/Apagado y almacena `si/no`; no afecta reglas encontradas. Riesgo es una sola opción configurable por catálogo, con fallback local. Se muestra en detalle y queda disponible para ticket. | No se encontraron múltiples riesgos, firma, PIN de consentimiento, checkbox, actor/fecha específicos ni evidencia de que la selección interna sea aceptación del cliente. |
| Código de seguridad | Admite PIN/contraseña, patrón o ausencia; PIN/patrón se guarda como texto plano reversible en `reparaciones.codigo_seguridad` y se muestra desde el detalle. El motor de ticket y el webhook pueden recibir la columna. | No se encontraron cifrado, permiso por campo, eliminación al cerrar/entregar ni envío directo por el botón de WhatsApp. El contenido real del ticket es `Unknown`. |
| Evidencia | Se agrega después desde `guardar_seguimiento.php`, por folio. La orden puede quedar sin fotos. Registra colaborador y fecha en seguimiento; valida imagen de hasta 10 MB, recomprime JPEG/PNG y almacena en R2 más dos tablas. Si falla después de entregar/imprimir la nota, sólo falta la nueva evidencia. | No se encontró indicador pendiente ni reemplazo. Las rutas administrativas para borrar están actualmente deshabilitadas por un `exit` 503; desde reparaciones no se puede borrar. |
| Impresión y nota | Tras alta/anticipo se intenta ticket `cliente`; ocurre antes de fotos. El detalle permite reimprimir cliente/tienda. La plantilla dinámica puede incluir columnas de reparación, sucursal y tokens de último pago; la doble lectura del pago puede producir `0.00`. | No se encontró contador, snapshot, firma, estado “nota entregada” ni prueba de valor contractual. Términos y campos exactos son `Unknown` sin la plantilla activa. |
| Usuario, sucursal y auditoría | Receptor, tenant y sucursal salen de sesión/contexto; no se elige otra sucursal en el formulario. Recepción usa `NOW()` con zona SQL; pagos/seguimientos usan zona IANA. Se guardan receptor, usuario de pago, colaborador de seguimiento, primer revisor y entregador. | No se puede concluir si el usuario puede cambiar de sucursal fuera de este flujo. No se encontró historial por campo ni forma de saber quién cambió cada valor. |

## Hallazgos principales

- La orden nace con la inserción; consultar el folio no lo reserva ni consume.
- Cliente y reparación son atómicos entre sí, pero el flujo de recepción completo no es atómico.
- La unicidad del cliente sí aparece en la migración por `(tenant_id, sucursal_id, dedupe_key)`; la unicidad del folio no aparece en el esquema versionado inspeccionado.
- Un teléfono compartido puede fusionar personas en un mismo cliente maestro.
- No existe tabla de dispositivo reutilizable ni detección de IMEI duplicado.
- “Falla” parece síntoma reportado/etiqueta operativa, pero el código no separa reporte del cliente y diagnóstico técnico.
- Garantía, riesgo y entrega de nota son campos/acciones, no procesos verificables con consentimiento o relación formal.
- El código de desbloqueo se guarda reversible y se muestra en detalle a cualquier sesión que pueda consultar la reparación.
- El contenido contractual de la nota es configuración mutable en base de datos; no se conserva snapshot ni contador de impresiones.
- El lector de pago del ticket ejecuta dos `fetch()` consecutivos sobre el mismo resultado (`imprimir_ticket.php:259-260`); el segundo sobrescribe el primero con `false`, por lo que los tokens de pago caen en valores vacíos/`0.00`.

## Riesgos

| Severidad | Riesgo | Consecuencia posible |
|---|---|---|
| Crítica | Secreto de desbloqueo reversible y visible. | Exposición de credenciales y acceso no autorizado al equipo. |
| Alta | Folio sin reserva/bloqueo ni unicidad versionada encontrada. | Colisión en altas concurrentes y asociación errónea de pagos/evidencias. |
| Alta | Anticipo fuera de la transacción. | Orden creada sin pago esperado o reintentos ambiguos. |
| Alta | Consentimiento de riesgo reducido a un select interno. | Insuficiencia probatoria ante reclamos. |
| Alta | Garantía sin validación de cliente, dispositivo, vigencia o antecedente. | Clasificación incorrecta y pérdida de trazabilidad. |
| Alta | Ticket dinámico sin snapshot y anticipo potencialmente omitido por doble lectura. | Nota inconsistente con la operación registrada. |
| Media | Promesa sin zona, actualización ni auditoría. | Fechas ambiguas e incumplimientos no medibles. |
| Media | Evidencia posterior y opcional. | Orden/nota entregada sin fotos ni indicador pendiente. |
| Media | Snapshot de cliente y maestro sin política explícita. | Datos divergentes y contactos históricos ambiguos. |
| Media | Historial de cambios parcial. | Imposibilidad de atribuir quién cambió cada dato. |

## Conclusiones

El legado confirma la necesidad de los conceptos de recepción, cliente/contacto, equipo recibido, condición, problema reportado, compromiso de tiempo, estimación, pago, evidencia, consentimiento y custodia. No confirma que sus campos actuales sean los límites correctos ni que sus defaults constituyan políticas aprobadas. Los puntos de dinero, secreto de acceso, identidad, garantía, riesgo y tiempo deben pasar por validación explícita antes de entrar al modelo canónico de SR Taller 2.0.
