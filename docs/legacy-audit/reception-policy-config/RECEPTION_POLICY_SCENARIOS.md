# Escenarios de comportamiento y decisión

**Estado:** `Pending operations validation`.
**Propósito:** probar el significado real de la configuración contra casos normales, excepcionales y la frontera confirmada de custodia.

Cada resultado describe código versionado. Donde se habla de custodia, se aplica la decisión aportada por Product Owner: comienza con la creación correcta de Nueva Reparación, no con abrir el formulario, capturar un dato, imprimir o fotografiar.

## `LEGACY-RPC-SCENARIO-001` — Configuración default

| Aspecto | Reconstrucción |
|---|---|
| Precondiciones | Tenant y sucursal válidos; no existen filas de configuración aplicables; usuario abre Nueva Reparación. |
| Configuración | Sistema requiere `nombre`, `telefono_nacional`, `marca`, `modelo`, `falla`, `tipo_seguridad`; riesgo=`no_aplica`; tipo seguridad=`no_tiene`. |
| Flujo | GET devuelve sistema como efectiva; formulario marca seis controles; al guardar vuelve a resolver y valida. |
| Resultado frontend | Los seis aparecen requeridos. Todos los demás controles siguen visibles. Tipo de seguridad exige selección en la UI porque está required. |
| Resultado backend | Exige nombre/teléfono/marca/modelo/falla; tipo omitido se convierte a `no_tiene`, de modo que ese required no es equivalente al frontend. |
| Datos creados | Cliente maestro y `reparaciones` en una transacción; fecha `NOW()`, actor de sesión, `Pendiente`, `En Tienda`; no evidencia ni pago por default. |
| Riesgo | Puede nacer custodia sin IMEI, condición física, accesorios completos, consentimiento, evidencia o entregante distinto. |
| Evidencia | Helper `reparaciones_form_config.php:60-96,275-307`; alta PHP `:323-494`; vista `crear_reparacion.php:517-721`. |
| Gap | “Default” define captura mínima técnica, no recepción completa ni prueba de custodia. |
| Decisión futura relacionada | Qué conjunto mínimo identifica cliente/contacto, objeto, actor, lugar y condición al iniciar custodia. Estado: `Pending Product Owner validation`. |

## `LEGACY-RPC-SCENARIO-002` — Tenant configura teléfono opcional

| Aspecto | Reconstrucción |
|---|---|
| Precondiciones | Existe fila tenant con lista sin `telefono_nacional`; no hay override de sucursal; se captura nombre y datos mínimos restantes. |
| Configuración | La lista tenant reemplaza la del sistema. La forma de crear esa fila no fue encontrada en UI/API. |
| Flujo | GET fusiona sistema→tenant; frontend permite teléfono vacío; backend resuelve la misma lista y llama al cliente maestro con `_require_phone=false`. |
| Resultado frontend | Código país permanece 52; teléfono vacío pasa; no se solicita motivo ni canal alterno. |
| Resultado backend | Acepta teléfono vacío, deduplica por nombre normalizado y genera `telefono_e164=null` en cliente. |
| Datos creados | `reparaciones_clientes.telefono_nacional=''`, E.164 `null`; `reparaciones.numero_cliente=''`; orden/custodia sí nacen. |
| Riesgo | Homónimos pueden colisionar por dedupe; no existe destinatario telefónico para comunicaciones posteriores. El alta no envía notificación. |
| Evidencia | Merge helper `:252-293`; teléfono PHP `guardar_reparacion.php:271-310,339,410-420`; cliente `reparaciones_clientes.php:10-72,153-190`. |
| Gap | La obligatoriedad del teléfono no depende de si se prometen notificaciones ni exige canal alterno. |
| Decisión futura relacionada | Definir contacto mínimo, canales y excepción sin contacto. Estado: `Pending Product Owner validation`. |

## `LEGACY-RPC-SCENARIO-003` — Sucursal exige IMEI y el equipo llega apagado

| Aspecto | Reconstrucción |
|---|---|
| Precondiciones | Override de sucursal incluye `imei`; el equipo está apagado, bloqueado, dañado o no expone número accesible. |
| Configuración | `imei` required absoluto; no existe valor “no accesible”, razón ni excepción autorizada. |
| Flujo | El usuario intenta guardar vacío. |
| Resultado frontend | Bloquea en no vacío. Si se escribe valor, además exige alfanumérico. |
| Resultado backend | Vacío recibe 422; un POST directo con caracteres especiales puede superar el filtro alfanumérico porque backend sólo exige no vacío. |
| Datos creados | Ninguno mientras IMEI siga vacío. Por la frontera confirmada, no hay orden ni custodia formal. |
| Riesgo | Operación puede retener físicamente un equipo sin lograr crear orden, justo el estado que el dominio confirmado quiere evitar; también incentiva datos inventados. |
| Evidencia | Registro `:22`; alta JS `:1395-1404,1449-1460`; alta PHP `:393`; no se encontró excepción en el alcance. |
| Gap | Checkbox absoluto no distingue aplicabilidad, accesibilidad, tipo de identificador ni autorización. |
| Decisión futura relacionada | Política condicional de identificación del objeto y procedimiento cuando IMEI no es obtenible. Estado: `Pending operations validation`. |

## `LEGACY-RPC-SCENARIO-004` — Riesgo opcional, riesgo real

| Aspecto | Reconstrucción |
|---|---|
| Precondiciones | `riesgo` no está en required; recepción observa pantalla/tapa frágil o pérdida potencial de información. |
| Configuración | Default efectivo `riesgo=no_aplica`; selector siempre visible. |
| Flujo | El receptor no cambia el selector o un cliente directo omite la clave. |
| Resultado frontend | La carga de catálogo selecciona el default cuando puede; optional no crea estado “sin evaluar”. |
| Resultado backend | Vacío se normaliza a `no_aplica` y pasa allowlist. No verifica required, consentimiento, comunicación ni evidencia. |
| Datos creados | Orden con `reparaciones.riesgo='no_aplica'`; custodia inicia; no prueba de que el riesgo fue evaluado o aceptado. |
| Riesgo | Default negativo oculta un riesgo real y la etiqueta “Aceptó” aparenta consentimiento sin actor, texto, versión o momento. |
| Evidencia | Helper defaults `:74-83`; JS riesgo `crear_reparacion.js:1040-1127`; backend `guardar_reparacion.php:163-230,356-359`. |
| Gap | Se mezclan identificación del riesgo, comunicación y decisión del cliente. |
| Decisión futura relacionada | Separar evaluación, comunicación, consentimiento/negativa y evidencia. Estado: `Pending Product Owner validation`. |

## `LEGACY-RPC-SCENARIO-005` — Tipo de bloqueo requerido, cliente no proporciona acceso

| Aspecto | Reconstrucción |
|---|---|
| Precondiciones | `tipo_seguridad` está required; dispositivo tiene bloqueo; cliente no conoce o no desea entregar credencial. |
| Configuración | Lista obliga el selector; condiciones fijas obligan secreto sólo si se elige PIN/patrón. |
| Flujo | Receptor intenta elegir PIN sin código, patrón sin dibujo, `no_tiene`, o envía POST sin tipo. |
| Resultado frontend | PIN/patrón sin secreto bloquea. `no_tiene` permite continuar aunque no exprese “sin acceso”. |
| Resultado backend | PIN/patrón sin secreto recibe 422. Tipo omitido se vuelve `no_tiene` y pasa aunque required. |
| Datos creados | Con `no_tiene`, orden sin secreto; con credencial, secreto queda en `reparaciones.codigo_seguridad`; custodia inicia tras commit. |
| Riesgo | Incentiva declarar falsamente que no hay bloqueo o capturar un secreto sensible; no existe negativa, acceso diferido ni propósito. |
| Evidencia | Condiciones helper `:84-95`; JS `:398-447`; backend `:244-262,361-379,473-474`; detalle consume el código. |
| Gap | “Tipo de bloqueo” no representa disponibilidad/autorización de acceso ni ciclo de vida del secreto. |
| Decisión futura relacionada | Necesidad, base operativa, protección y eliminación de credenciales. Estado: `Pending security review`. |

## `LEGACY-RPC-SCENARIO-006` — Posible garantía sin folio anterior

| Aspecto | Reconstrucción |
|---|---|
| Precondiciones | Se selecciona `posible_garantia=si`; `folio_anterior` queda vacío. |
| Configuración | Puede hacerse required el sí/no, pero `folio_anterior` no pertenece al registro configurable. |
| Flujo | Usuario guarda una opción válida y deja referencia vacía. |
| Resultado frontend | Pasa; no existe condición garantía→folio. |
| Resultado backend | Normaliza garantía a `si`, limpia folio vacío y persiste ambos. |
| Datos creados | Orden con `posible_garantia='si'`, `folio_anterior=''`; custodia inicia. |
| Riesgo | La posible garantía no queda vinculada a una orden previa verificable. |
| Evidencia | Vista `crear_reparacion.php:630-642`; registro helper `:29`; backend `guardar_reparacion.php:354-355,464-465`. |
| Gap | La configuración sólo puede exigir una respuesta, no la coherencia entre respuestas. |
| Decisión futura relacionada | Qué evidencia/referencia habilita tratar una recepción como garantía. Estado: `Pending Product Owner validation`. |

## `LEGACY-RPC-SCENARIO-007` — Anticipo obligatorio

| Aspecto | Reconstrucción |
|---|---|
| Precondiciones | Sucursal incluye `anticipo`; usuario captura monto positivo. |
| Configuración | Required absoluto, sin umbral, moneda, método, caja ni autorización. |
| Flujo | Frontend y backend de orden comprueban entero >0; orden se confirma; frontend hace segundo POST de pago. |
| Resultado frontend | Cero/vacío bloquea. Después de la orden intenta `guardar_anticipo`; un error detiene cierre/impresión, no revierte la orden. |
| Resultado backend | `guardar_reparacion` sólo valida el número y no lo persiste. `guardar_anticipo` verifica que la orden exista e inserta `reparacion_pagos` con método default `Anticipo`. |
| Datos creados | Camino feliz: orden y luego pago. Bypass o fallo: orden/custodia sin pago aunque la configuración lo exigía. |
| Riesgo | La UI comunica obligatoriedad financiera sin atomicidad, caja explícita, método real o reconciliación. |
| Evidencia | Alta PHP `:384-401,404-494`; alta JS `:1516-1533`; `guardar_anticipo.php:45-100`. |
| Gap | “Monto capturado” no equivale a “pago recibido/registrado”. |
| Decisión futura relacionada | Momento de pago, autoridad, caja, fallo y relación con inicio de custodia. Estado: `Pending finance review`. |

## `LEGACY-RPC-SCENARIO-008` — Promesa de entrega obligatoria

| Aspecto | Reconstrucción |
|---|---|
| Precondiciones | `promesa_entrega` required; se ofrece o no una fecha estimada. |
| Configuración | Sólo exige no vacío. |
| Flujo | UI usa `datetime-local`; backend aplica `trim()` y required. |
| Resultado frontend | Navegador produce una fecha/hora local válida, pero no verifica futuro, horario, capacidad ni zona. |
| Resultado backend | Acepta cualquier string no vacío a nivel de aplicación; compatibilidad de la columna activa es `Unknown`. |
| Datos creados | `reparaciones.promesa_entrega` recibe el valor; no guarda zona, autor, base, revisión ni confianza. |
| Riesgo | Se transforma una estimación local ambigua en aparente compromiso. Cambios de zona/configuración no son trazables. |
| Evidencia | Vista `crear_reparacion.php:694-703`; backend `guardar_reparacion.php:353,398,463`; timezone `:29-49`. |
| Gap | No existe semántica temporal ni política de cuándo ofrecer promesa. |
| Decisión futura relacionada | Diferenciar estimación de compromiso, zona, horizonte y revisión. Estado: `Pending Product Owner validation`. |

## `LEGACY-RPC-SCENARIO-009` — Restaurar defaults

| Aspecto | Reconstrucción |
|---|---|
| Precondiciones | Sucursal tiene override; administrador pulsa “Restaurar defaults en pantalla”. |
| Configuración | Estado efectivo previo puede incluir herencia tenant y override sucursal. |
| Flujo | El handler sustituye sólo `required_fields` en memoria por las seis claves del JS. |
| Resultado frontend | Muestra “Defaults restaurados en pantalla”; no pide confirmación. Al recargar sin save vuelve el valor de DB. |
| Resultado backend | No recibe petición por reset. Si después se guarda, hace upsert de lista default y ocho defaults del sistema en la fila de sucursal. |
| Datos creados | Sin save: ninguno. Con save: fila/override sucursal actualizado; no se borra ni restaura herencia. |
| Riesgo | El texto puede hacer creer que se eliminó personalización; guardar congela defaults y bloquea cambios tenant futuros. |
| Evidencia | Panel JS `:195-216,261-267`; helper upsert `:311-323`; no se encontró DELETE. |
| Gap | No distingue “deshacer edición”, “usar defaults sistema” y “volver a heredar tenant”. |
| Decisión futura relacionada | Semántica de reset, herencia y confirmación. Estado: `Pending Product Owner validation`. |

## `LEGACY-RPC-SCENARIO-010` — Configuración cambia con formulario abierto

| Aspecto | Reconstrucción |
|---|---|
| Precondiciones | Receptor abre alta y carga versión A; administrador guarda versión B antes del submit. |
| Configuración | No hay número de versión, push, polling o invalidación. |
| Flujo | Frontend valida con A; backend resuelve B al recibir. |
| Resultado frontend | Si B endurece, permite enviar datos que A consideraba completos; si B relaja, A puede bloquear y nunca enviar. |
| Resultado backend | Con endurecimiento, devuelve 422 por el nuevo required. Con relajación, aceptaría si recibe request, pero frontend antiguo puede impedirlo. |
| Datos creados | Ninguno en 422; con request válido se crea usando B, sin registrar B en la orden. |
| Riesgo | Experiencia inconsistente en mostrador y resultado no reconstruible; puede retrasar la formalización de custodia. |
| Evidencia | Alta JS carga una vez `:486-526,1311-1320`; submit `:1376-1514`; backend resuelve `guardar_reparacion.php:323-337`. |
| Gap | No hay contrato de versión ni tratamiento de cambios en curso. |
| Decisión futura relacionada | Cuándo entra en vigor una política y qué ocurre con recepciones iniciadas. Estado: `Pending Product Owner validation`. |

## `LEGACY-RPC-SCENARIO-011` — Llamada directa al backend

| Aspecto | Reconstrucción |
|---|---|
| Precondiciones | Sesión autenticada con tenant/sucursal y token CSRF llama `guardar_reparacion.php` sin ejecutar JS. |
| Configuración | Backend resuelve la vigente; el caller no controla scope ni lista required. |
| Flujo | POST omite o manipula campos. |
| Resultado frontend | No aplica. |
| Resultado backend | Protege nombre, teléfono/formato, textos required, cuatro selects, secretos condicionales y anticipo numérico; acepta riesgo/tipo omitidos vía defaults y no aplica regex de IMEI. No exige permiso específico. |
| Datos creados | Si pasa validación, cliente+orden. Un `anticipo` positivo sólo en payload no crea `reparacion_pagos`. |
| Riesgo | La política es parcialmente segura, pero bypass revela divergencias y permite orden sin pago posterior. Acceso funcional al endpoint requiere revisión. |
| Evidencia | Guards alta `:1-23`; validación `:271-402`; insert `:404-494`; permiso opcional en `guards.php:201-223`. |
| Gap | Falta equivalencia de validación, permiso explícito y operación financiera coherente. |
| Decisión futura relacionada | Contrato único de validación/autorización y efectos atómicos de negocio. Estado: `Pending security review`. |

## `LEGACY-RPC-SCENARIO-012` — Recepción mínima futura

| Aspecto | Reconstrucción |
|---|---|
| Precondiciones | Se compara el mecanismo con la frontera confirmada: la custodia comienza al crear correctamente la orden. |
| Configuración | Legacy ofrece checkboxes por campo, tres capas de lectura y una sola de escritura. |
| Flujo | Una lista plana decide no vacío; creación fija fecha, actor, estado y ubicación; impresión/fotos son posteriores. |
| Resultado frontend | No expresa “identidad mínima”, “objeto suficientemente identificado”, “riesgo evaluado”, “excepción autorizada” ni “pendiente permitido”. |
| Resultado backend | Puede crear la orden con combinaciones técnicamente válidas pero semánticamente débiles; tampoco guarda qué política permitió la creación. |
| Datos creados | Orden/custodia, cliente y defaults; evidencia/pago pueden faltar y no hay recepción completa separada. |
| Riesgo | Copiar checkboxes convertiría accidentes del formulario en política futura y permitiría desactivar elementos esenciales. |
| Evidencia | Registro completo helper `:14-96`; insert `guardar_reparacion.php:435-484`; evidencia posterior; decisión PO en la solicitud de auditoría. |
| Gap | Falta separar invariantes, políticas configurables, condiciones, presentación, derivados y excepciones. |
| Decisión futura relacionada | Validar el mínimo de aceptación y qué pendientes no revierten custodia contra [Future State Reception](../../domain-validation/future-state-reception/README.md). Estado: `Pending Product Owner validation`. |

## Matriz de validación sugerida para taller

| Escenario | Product Owner | Operaciones | Seguridad | Finanzas | Arquitectura |
|---|---|---|---|---|---|
| 001 default | Sí | Sí | — | — | Sí |
| 002 teléfono | Sí | Sí | — | — | Sí |
| 003 IMEI | Sí | Sí | — | — | — |
| 004 riesgo | Sí | Sí | Sí | — | — |
| 005 acceso | Sí | Sí | Sí | — | Sí |
| 006 garantía | Sí | Sí | — | — | — |
| 007 anticipo | Sí | Sí | — | Sí | Sí |
| 008 promesa | Sí | Sí | — | — | Sí |
| 009 reset | Sí | Sí | — | — | Sí |
| 010 cambio concurrente | Sí | Sí | — | — | Sí |
| 011 bypass | — | — | Sí | Sí | Sí |
| 012 mínimo futuro | Sí | Sí | Sí | Sí | Sí |
