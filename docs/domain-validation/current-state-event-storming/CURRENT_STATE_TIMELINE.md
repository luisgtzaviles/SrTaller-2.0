# Línea temporal del Current State

**Estado:** Borrador para validación temporal y operativa.
**Propósito:** Separar el momento en que algo ocurre del momento en que se captura, cambia una fila, se intenta notificar o se imprime.
**Alcance:** Hitos desde contacto inicial hasta posible garantía, con marcas existentes, ausentes y ambiguas.
**Fuente:** Product Owner; auditorías de nueva reparación y detalle; `DOMAIN_TIMELINE.md` sólo como referencia de preguntas canónicas.
**Audiencia:** Product Owner, operaciones, finanzas, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

## Cinco relojes que hoy no son equivalentes

| Reloj | Significado | Ejemplo actual |
|---|---|---|
| Ocurrió | Momento real del hecho de negocio. | La persona autorizó verbalmente o recibió físicamente el equipo. |
| Se registró | Momento en que una nota, pago o evidencia fue persistido. | Fecha del seguimiento; puede ser posterior a la llamada. |
| Se cambió la fila | Momento en que el estado actual fue sobrescrito. | Guardado de estado/presupuesto/custodia; no conserva antes/después. |
| Se notificó o intentó notificar | Momento de una salida externa. | Webhook anterior al `UPDATE`; WhatsApp abierto sin prueba de envío. |
| Se imprimió o intentó imprimir | Momento de materializar un documento. | El endpoint genera contenido, pero no guarda bitácora de impresión. |

No se debe usar uno de estos relojes como sustituto de otro. La fecha de un seguimiento prueba captura, no el momento real de autorización; `fecha_entregado` prueba una primera marca técnica, no necesariamente el acto físico.

## Línea temporal integral

| ID / hito | Momento de negocio | Timestamp existente | Dónde se registra | Actor | Zona horaria | ¿Puede corregirse? | ¿Se sobrescribe? | Qué falta | Riesgo semántico / estado |
|---|---|---|---|---|---|---|---|---|---|
| `CSE-TIME-001` Contacto inicial | Persona llega o contacta. | Ninguno encontrado. | Fuera del flujo auditado. | Persona/recepción. | `Unknown`. | No aplica en sistema. | No aplica. | Hora, canal, sucursal y relación con ingreso. | Inicio real no reconstruible. `Confirmed by Product Owner`. |
| `CSE-TIME-002` Consulta comercial | Se pregunta y responde precio/calidad. | Ninguno encontrado. | Conversación. | Persona/recepción. | `Unknown`. | No aplica. | No aplica. | Alternativas, precio comunicado y vigencia. | No puede probarse qué se ofreció. `Confirmed by Product Owner`. |
| `CSE-TIME-003` Aceptación de ingreso | Persona decide dejar el equipo. | Ninguno propio. | Práctica humana anterior al guardado. | Persona que entrega. | `Unknown`. | No hay registro. | No aplica. | Momento y alcance de lo aceptado. | Puede confundirse con fecha de recepción/creación. `Confirmed by Product Owner`. |
| `CSE-TIME-004` Recepción formal | Comienza captura y custodia fáctica. | `fecha_recepcion` existe en la reparación. | Fila principal creada al alta. | Recepción/sistema. | Estrategia del alta no uniforme con detalle. | La capacidad exacta de edición es `Unknown`. | La fila actual puede cambiar; no hay historia demostrada. | Distinción entre llegada, aceptación, captura y `INSERT`. | Un solo valor puede representar varios hitos. `Pending Product Owner validation`. |
| `CSE-TIME-005` Orden creada | El `INSERT` termina correctamente. | Marca de recepción/creación disponible según columnas; no se demostró evento separado. | Fila principal. | Sistema. | Estrategia legacy del alta. | No hay corrección auditada como evento. | Fila principal es mutable. | Timestamp inequívoco del alta exitosa. | Recepción y creación pueden parecer el mismo instante. `Confirmed by legacy code`. |
| `CSE-TIME-006` Promesa de entrega | Se captura una fecha/hora estimada. | `fecha_promesa`/valor local del formulario. | Fila de reparación. | Recepción. | Entrada local ambigua, sin contrato temporal uniforme. | Puede cambiar si existe edición lateral; alcance `Unknown`. | Valor actual, sin historia demostrada. | Zona, precisión, comunicación y revisiones. | Una promesa no es fecha de listo ni obligación cumplida. `Confirmed by legacy code`; significado `Pending Product Owner validation`. |
| `CSE-TIME-007` Impresión inicial | Se solicita/renderiza la nota después del alta. | No se encontró bitácora de impresión. | Sólo petición/respuesta y ventana. | Usuario/navegador/impresora. | No persistida. | Reimprimir regenera. | Contenido cambia con datos/plantilla actuales. | Quién, cuándo, qué versión y si realmente imprimió. | No puede reconstruirse el documento original. `Confirmed by legacy code`. |
| `CSE-TIME-008` Evidencia añadida | Se toman y cargan fotos después de guardar/imprimir. | Fecha de seguimiento/archivo según persistencia; no necesariamente hora de toma. | R2, seguimiento y archivos. | Recepción/usuario. | Mutación de detalle usa configuración IANA con fallback `America/Hermosillo`; metadatos pueden variar. | No se encontró edición/borrado activo en detalle. | Normalmente inserta; objeto y referencias pueden quedar parciales. | Hora original de captura y relación con recepción/entrega. | Fecha de carga puede sustituir erróneamente fecha de evidencia. `Confirmed by both`. |
| `CSE-TIME-009` Asignación técnica | Se decide quién atenderá. | No se encontró timestamp de asignación. | Texto `tecnico` en fila principal. | Usuario del detalle. | Hora del `UPDATE` no se conserva como hito dedicado. | Sí, sobrescribiendo texto. | Sí. | Inicio/fin, asignador, aceptación y reasignaciones. | Sólo el técnico actual queda visible. `Confirmed by legacy code`. |
| `CSE-TIME-010` Diagnóstico o hallazgo | Técnico descubre/valida una condición. | No existe timestamp estructurado; puede usarse fecha de seguimiento. | Narrativa opcional. | Técnico/usuario de seguimiento. | La nota usa zona configurada del detalle. | No se encontró edición. | Inserta otra nota, no corrige el hecho. | Ocurrencia, diagnosticador, resultado y evidencia. | Captura tardía puede parecer hora del hallazgo. `Confirmed by Product Owner` para caso batería; estructura `Unknown`. |
| `CSE-TIME-011` Llamada | Se llama al cliente/contacto. | Ninguno estructurado. | Puede narrarse en seguimiento. | Recepción/técnico. | Momento real `Unknown`; nota usa zona del detalle. | Se puede añadir otra nota, no corregir llamada. | No. | Inicio, fin, número, resultado y participantes. | Fecha de nota no prueba llamada efectiva. `Confirmed by Product Owner`. |
| `CSE-TIME-012` Autorización ocurrida | Persona comunica autorización/rechazo. | Ninguno estructurado. | Conversación externa. | Cliente/contacto y colaborador. | `Unknown`. | Revocación/cambio no tienen ciclo. | No aplica. | Hora real, identidad, alcance, monto, canal y decisión. | No puede correlacionarse con versión monetaria. `Confirmed by Product Owner` para autorización verbal. |
| `CSE-TIME-013` Autorización capturada | Un usuario escribe una narrativa. | Fecha del seguimiento. | `reparacion_seguimientos`. | Usuario de seguimiento. | Zona IANA configurada con fallback del detalle. | No se encontró edición. | No; otra nota no reemplaza la anterior, pero tampoco la enlaza. | Momento real y vínculo con decisión/presupuesto. | Registro y ocurrencia pueden diferir. `Confirmed by legacy code`. |
| `CSE-TIME-014` Presupuesto cambiado | Total final se sobrescribe tras o sin decisión. | No se encontró timestamp dedicado/versionado del presupuesto. | Fila principal en guardado combinado. | Usuario que cambia detalle. | Momento del `UPDATE` no se conserva como hito dedicado. | Sí, cambiando el valor actual. | Sí; se pierde el total anterior. | Versiones, razón, actor específico y autorización. | No puede ordenarse con precisión frente a nota/pago. `Confirmed by legacy code`. |
| `CSE-TIME-015` Pago registrado | Se inserta anticipo/abono. | Fecha de `reparacion_pagos`. | Tabla de pagos por folio. | Usuario que registra pago. | Detalle resuelve zona configurada con fallback; coherencia total pendiente. | No se encontró corrección/reversa desde detalle. | No; inserta filas, pero impresión toma sólo la última. | Momento real del cobro, caja, turno, método, aplicación y conciliación. | Fecha de fila no prueba ingreso a caja. `Confirmed by legacy code`; `Pending finance review`. |
| `CSE-TIME-016` Reparación marcada lista | Estado entra por primera vez en uno de cuatro literales. | `fecha_listo`, sólo si estaba vacía. | Fila principal. | Usuario que cambia estado/sistema. | Zona configurada del detalle con fallback. | Cambiar estado sí; corregir primera fecha no fue encontrado. | La fecha no se sobrescribe en cierres posteriores. | Ocurrencia técnica, QC, actor real y significado de “listo”. | Primera marca sobrevive a reapertura; no refleja vigencia. `Confirmed by legacy code`. |
| `CSE-TIME-017` Aviso intentado | Se intenta webhook antes de guardar o se abre WhatsApp. | No se encontró timestamp persistido de webhook/WhatsApp. | Salida HTTP/ventana externa. | Navegador/endpoint/usuario. | Webhook no establece de forma explícita la misma estrategia; salida no registrada. | No hay historial para corregir/reintentar con trazabilidad. | No aplica. | Hora persistida, destinatario, payload, resultado, reintento. | Puede preceder al cambio de fila y no probar entrega. `Confirmed by legacy code`. |
| `CSE-TIME-018` Legitimación evaluada | Recepción revisa nota/INE/reconocimiento/llamada/excepción. | Ninguno estructurado; una imagen tiene fecha de carga. | Práctica humana y evidencia genérica opcional. | Recepción, receptor, contacto, dueño/gerente. | Momento real `Unknown`. | No existe decisión corregible. | No aplica. | Vía, resultado, autoridad, motivo y vínculo a entrega. | Evidencia de INE no prueba por sí sola la decisión. `Confirmed by Product Owner`. |
| `CSE-TIME-019` Entrega física y marca | Se entrega el equipo y/o se guarda `Entregado`. | `fecha_entregado` se fija la primera vez. | Fila principal para marca; acto físico no estructurado. | Recepción/receptor/usuario que marca. | Zona configurada del detalle con fallback. | Custodia puede volver a `En Tienda`. | Fecha no se limpia; `entregado_por` puede sobrescribirse en otra entrega. | Hora física, receptor, legitimación y orden exacto frente al `UPDATE`. | Combina primera fecha con último actor y custodia vigente. `Confirmed by both` para hechos separados. |
| `CSE-TIME-020` Reingreso o reapertura | Un entregado/listo vuelve a tienda o estado activo. | No hay timestamp propio; primeras fechas permanecen. | Sobrescritura de estado/custodia. | Recepción/usuario de estado. | Hora del guardado no se conserva como hito dedicado. | Se puede volver a cambiar. | Estado/custodia se sobrescriben; hitos antiguos quedan. | Motivo, inicio de nuevo ciclo, actor y vínculo con entrega previa. | Cronología no se reconstruye desde la fila actual. `Confirmed by legacy code`; semántica pendiente. |
| `CSE-TIME-021` Posible garantía | Se marca bandera/estado o se captura folio previo. | Fecha propia de apertura de garantía no encontrada. | Campos/etiqueta actuales. | Recepción/usuario de estado. | `Unknown`. | Valores pueden cambiar según mutación disponible. | Estado/folio textual pueden sobrescribirse. | Ocurrencia, vigencia, cobertura, decisión y resolución. | Una etiqueta no prueba inicio ni activación de garantía. `Confirmed by legacy code`. |

## Marcas que deben mantenerse separadas

| Marca | Qué demuestra | Qué no demuestra |
|---|---|---|
| Fecha de recepción | Valor temporal asociado al alta. | Llegada exacta, inicio de custodia o aceptación de precio. |
| Fecha de pago | Inserción de una fila monetaria. | Cobro real, caja, aplicación o conciliación. |
| Fecha de seguimiento | Captura de una narrativa. | Momento real de llamada, hallazgo o autorización. |
| Fecha de listo | Primera entrada a literales del código. | Estado vigente, QC, fin físico o aviso exitoso. |
| Fecha de entrega | Primera marca `Entregado`. | Receptor, legitimación, entrega física o reentregas. |
| Fecha de webhook | No está persistida en el alcance encontrado. | Entrega al receptor externo. |
| Promesa de entrega | Estimación capturada. | Compromiso validado, listo o entrega real. |
| Momento real de autorización | Hecho humano. | No puede derivarse de la fecha de nota. |
| Momento de captura de autorización | Fecha de seguimiento, si se narró. | No prueba identidad, alcance o monto decidido. |

## Hallazgo temporal

Las fechas actuales son una mezcla de valores de negocio, marcas de primera transición y timestamps de inserción. Además, alta, detalle y webhook no demuestran una política uniforme de zona horaria. La reconstrucción de una secuencia completa es `Pending architecture review`; el significado operativo de cada hito es `Pending Product Owner validation`.
