# Panorama completo del Current State

**Estado:** Borrador para validación interdisciplinaria.
**Propósito:** Mostrar en orden cronológico el recorrido actual conocido de una reparación y las fronteras entre hechos humanos y registros técnicos.
**Alcance:** Consulta comercial, recepción, diagnóstico, cotización/autorización, ejecución, seguimiento, pagos, posible control de calidad, entrega y reingreso/garantía.
**Fuente:** Evidencia del Product Owner; auditorías legacy de nueva reparación y detalle; referencias canónicas de `docs/domain/`.
**Audiencia:** Product Owner, operaciones, técnicos, finanzas, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

## Cómo leer el mapa

Los comandos expresan una intención; los eventos, un hecho ya ocurrido. Un evento confirmado por Product Owner puede no dejar registro en el sistema. Las políticas `CSE-POLICY-*`, lecturas `CSE-READ-*`, externos `CSE-EXTERNAL-*` y hotspots `CSE-HOTSPOT-*` se detallan en los documentos especializados.

## Secuencia integral de 29 pasos

| # | Fase | Intención o decisión | Hecho observable resultante | Evidencia y estado |
|---:|---|---|---|---|
| 1 | Interacción comercial | `CSE-COMMAND-001` Consultar precio | `CSE-EVENT-001` Consulta comercial fue iniciada | Declaración de llegada/contacto. `Confirmed by Product Owner`. |
| 2 | Interacción comercial | La persona pregunta por precio o reparación | Parte de `CSE-EVENT-001`; todavía no existe orden | Secuencia humana. `Confirmed by Product Owner`. |
| 3 | Interacción comercial | Recepción pregunta marca, modelo, falla y origen | Información de `CSE-READ-001` fue obtenida verbalmente | No hay persistencia previa al ingreso demostrada. `Confirmed by Product Owner`. |
| 4 | Interacción comercial | `CSE-COMMAND-002` Presentar precio o alternativas | `CSE-EVENT-002` Alternativa de precio fue presentada | Pueden ofrecerse varias calidades. `Confirmed by Product Owner`. |
| 5 | Interacción comercial | La persona decide continuar o retirarse | `CSE-EVENT-003` Consulta fue abandonada, o `CSE-EVENT-004` Equipo fue decidido dejar | La no continuación no tiene registro demostrado. `Confirmed by Product Owner`. |
| 6 | Recepción | `CSE-COMMAND-003` Iniciar recepción | `CSE-EVENT-005` Recepción formal fue iniciada | Comienza cuando se decide dejar el equipo. `Confirmed by Product Owner`. |
| 7 | Recepción | `CSE-COMMAND-004` Seleccionar cliente o `CSE-COMMAND-005` Crear cliente | `CSE-EVENT-006` Cliente fue localizado o `CSE-EVENT-007` Cliente fue creado | Código busca/crea; operación define a nombre de quién. `Confirmed by both`. |
| 8 | Recepción | `CSE-COMMAND-006` Registrar equipo | `CSE-EVENT-009` Datos del equipo fueron registrados | El equipo queda embebido en la orden, sin entidad reutilizable demostrada. `Confirmed by legacy code`. |
| 9 | Recepción | `CSE-COMMAND-007` Documentar condición | `CSE-EVENT-010` Condición de recepción fue documentada | Formulario y fotografías posteriores no son el mismo acto. `Confirmed by legacy code`. |
| 10 | Recepción | `CSE-COMMAND-008` Registrar riesgo y credencial | `CSE-EVENT-011` Riesgo y credencial fueron registrados | Riesgo no prueba consentimiento; credencial puede exponerse. `Confirmed by legacy code`. |
| 11 | Recepción | `CSE-COMMAND-009` Crear orden | `CSE-EVENT-012` Orden fue creada | Nace después de un `INSERT` exitoso. `Confirmed by both`. |
| 12 | Recepción | El sistema determina la referencia visible | `CSE-EVENT-013` Folio fue asignado | La consulta previa no lo reserva; después se pega sticker físico. `Confirmed by both`. |
| 13 | Pagos | `CSE-COMMAND-010` Registrar anticipo | `CSE-EVENT-014` Pago inicial fue registrado, o la petición falló dejando la orden | Petición separada tras el alta. `Confirmed by legacy code`; impacto en caja `Pending finance review`. |
| 14 | Recepción | `CSE-COMMAND-011` Imprimir nota | `CSE-EVENT-015` Nota fue solicitada para impresión | Se genera desde datos/plantilla consultados. `Confirmed by legacy code`. |
| 15 | Recepción | `CSE-COMMAND-012` Añadir evidencia | `CSE-EVENT-016` Evidencia fue añadida | Operación toma fotos después de guardar/imprimir; persistencia cruza R2 y tablas. `Confirmed by both`. |
| 16 | Ejecución técnica | `CSE-COMMAND-013` Asignar técnico | `CSE-EVENT-017` Técnico fue asignado | Nombre textual mutable, sin historial. `Confirmed by legacy code`. |
| 17 | Diagnóstico | `CSE-COMMAND-014` Diagnosticar o trabajar | `CSE-EVENT-018` Trabajo técnico fue iniciado o narrado | No existe diagnóstico estructurado demostrado. `Inferred from combined evidence`. |
| 18 | Diagnóstico | `CSE-COMMAND-015` Registrar hallazgo | `CSE-EVENT-019` Hallazgo adicional fue descubierto | En el caso validado, batería durante trabajo de pantalla; sólo puede narrarse. `Confirmed by Product Owner`. |
| 19 | Cotización/autorización | `CSE-COMMAND-016` Contactar cliente | `CSE-EVENT-020` Cliente fue llamado | El acto humano no queda tipificado ni demuestra contacto efectivo. `Confirmed by Product Owner`. |
| 20 | Cotización/autorización | `CSE-COMMAND-017` Registrar autorización narrativamente | `CSE-EVENT-021` Trabajo adicional fue autorizado, rechazado o quedó pendiente | Autorización verbal validada para el ejemplo; estructura del resultado `Unknown`. |
| 21 | Cotización/autorización | `CSE-COMMAND-018` Cambiar presupuesto | `CSE-EVENT-022` Presupuesto final fue actualizado | Sobrescribe total sin versión ni vínculo a autorización. `Confirmed by both`. |
| 22 | Ejecución técnica | `CSE-COMMAND-019` Continuar o detener trabajo | `CSE-EVENT-023` Trabajo fue continuado o detenido | Decisión operativa inferida; el legado sólo ofrece estado/seguimiento libres. `Inferred from combined evidence`. |
| 23 | Seguimiento | `CSE-COMMAND-020` Registrar seguimiento | `CSE-EVENT-024` Seguimiento fue registrado | Texto libre transformado, sin categoría o vínculo. `Confirmed by both`. |
| 24 | Ejecución técnica | `CSE-COMMAND-021` Cambiar estado | `CSE-EVENT-025` Estado de reparación fue actualizado; puede incluir `CSE-EVENT-026` Reparación fue marcada lista | Catálogo textual y backend sin transición. `Confirmed by legacy code`. |
| 25 | Seguimiento | `CSE-COMMAND-022` Enviar webhook o abrir WhatsApp | `CSE-EVENT-027` Webhook fue intentado o `CSE-EVENT-028` Aviso manual fue preparado | Webhook previo al guardado; WhatsApp sin bitácora. `Confirmed by legacy code`. |
| 26 | Pagos | `CSE-COMMAND-023` Registrar pago | `CSE-EVENT-029` Pago posterior fue registrado | Fila separada por folio; no demuestra caja. `Confirmed by legacy code`. |
| 27 | Entrega | `CSE-COMMAND-024` Validar legitimación | `CSE-EVENT-030` Legitimación de entrega fue aceptada o rechazada | Nota, INE, reconocimiento, llamada o excepción son prácticas humanas. `Confirmed by Product Owner`. |
| 28 | Entrega | `CSE-COMMAND-025` Marcar entrega y liberar físicamente | `CSE-EVENT-031` Custodia fue marcada entregada y `CSE-EVENT-032` Equipo fue entregado físicamente | El sistema y el acto físico no están vinculados estructuralmente. `Confirmed by both` para su existencia separada. |
| 29 | Reingreso/garantía | `CSE-COMMAND-027` Reabrir o `CSE-COMMAND-028` Indicar posible garantía | `CSE-EVENT-033` Reparación fue reabierta o `CSE-EVENT-034` Posible garantía fue indicada | Etiquetas/campos, sin proceso ni relación validada. `Confirmed by legacy code`; significado `Pending Product Owner validation`. |

## 1. Interacción comercial

| Elemento | Mapa actual |
|---|---|
| Comandos | `CSE-COMMAND-001`, `CSE-COMMAND-002`. |
| Eventos | `CSE-EVENT-001` a `CSE-EVENT-004`. |
| Actores | `CSE-ACTOR-001` Persona que consulta; `CSE-ACTOR-005` Recepcionista. |
| Políticas | `CSE-POLICY-001` La consulta de precio ocurre antes de la recepción formal; `CSE-POLICY-002` pueden presentarse calidades. |
| Información necesaria | `CSE-READ-001`: marca, modelo, problema, cómo ocurrió y alternativas de precio. |
| Sistemas externos | Ninguno confirmado; una lista o fuente de precios es `Unknown`. |
| Hotspots | `CSE-HOTSPOT-005` problema reportado frente a diagnóstico; registro de consultas no convertidas, `Unknown`. |
| Evidencia / estado | Declaraciones operativas. `Confirmed by Product Owner`. |

Si la persona no continúa, el recorrido termina sin orden y sin evento persistido demostrado. No se infiere una oportunidad comercial ni un requisito futuro.

## 2. Recepción

| Elemento | Mapa actual |
|---|---|
| Comandos | `CSE-COMMAND-003` a `CSE-COMMAND-012`. |
| Eventos | `CSE-EVENT-005` a `CSE-EVENT-016`. |
| Actores | `CSE-ACTOR-002` Persona que entrega; `CSE-ACTOR-003` Cliente nombrado; `CSE-ACTOR-004` Contacto; `CSE-ACTOR-005` Recepcionista; `CSE-ACTOR-014` Sistema; `CSE-ACTOR-015` Navegador; `CSE-ACTOR-019` R2. |
| Políticas | `CSE-POLICY-003` a `CSE-POLICY-010`: nombre indicado, teléfono, snapshot, orden tras alta, folio no reservado, sticker, evidencia posterior y anticipo separado. |
| Información necesaria | `CSE-READ-002` coincidencias de cliente; `CSE-READ-003` datos/snapshot; `CSE-READ-004` condición/riesgo/credencial; `CSE-READ-005` folio. |
| Sistemas externos | `CSE-EXTERNAL-003` impresión; `CSE-EXTERNAL-005` R2. |
| Hotspots | `CSE-HOTSPOT-001` a `008`, `022`, `024`, `029`. |
| Evidencia / estado | Combinación de formulario auditado y operación descrita. `Confirmed by both` donde coinciden; identidad del propietario `Unknown`. |

La persona que entrega puede ser distinta de quien queda en la nota. El sistema conserva al cliente operativo y su teléfono, pero no demuestra propietario ni entregador físico.

## 3. Diagnóstico

| Elemento | Mapa actual |
|---|---|
| Comandos | `CSE-COMMAND-014`, `CSE-COMMAND-015`. |
| Eventos | `CSE-EVENT-018`, `CSE-EVENT-019`. |
| Actores | `CSE-ACTOR-006` Técnico; `CSE-ACTOR-007` Usuario de seguimiento. |
| Políticas | `CSE-POLICY-013` hallazgos y diagnóstico comparten seguimiento narrativo. |
| Información necesaria | `CSE-READ-006` falla/condición inicial; diagnóstico, pieza y severidad estructurados no fueron encontrados. |
| Sistemas externos | Ninguno confirmado. |
| Hotspots | `CSE-HOTSPOT-005`, `011`, `023`, `028`. |
| Evidencia / estado | El hallazgo de batería está `Confirmed by Product Owner`; su representación limitada, `Confirmed by legacy code`; un diagnóstico formal, `Unknown`. |

## 4. Cotización y autorización

| Elemento | Mapa actual |
|---|---|
| Comandos | `CSE-COMMAND-016` a `CSE-COMMAND-018`. |
| Eventos | `CSE-EVENT-020` a `CSE-EVENT-022`. |
| Actores | `CSE-ACTOR-003`, `CSE-ACTOR-004`, `CSE-ACTOR-005`, `CSE-ACTOR-006`, `CSE-ACTOR-007`. |
| Políticas | `CSE-POLICY-014` autorización puede quedar sólo narrada; `CSE-POLICY-015` presupuesto final se sobrescribe. |
| Información necesaria | `CSE-READ-007` teléfono; `CSE-READ-008` presupuesto actual, pagos y saldo visual. Falta versión autorizada, alcance, identidad y canal. |
| Sistemas externos | `CSE-EXTERNAL-001` teléfono/WhatsApp. |
| Hotspots | `CSE-HOTSPOT-012`, `013`, `023`, `028`. |
| Evidencia / estado | Llamada y autorización del caso batería, `Confirmed by Product Owner`; separación técnica, `Confirmed by legacy code`; suficiencia, `Pending Product Owner validation`. |

Autorización, cotización, pago, aplicación y caja permanecen conceptos separados. Este mapa no deduce que una nota narrativa sea autorización suficiente.

## 5. Ejecución técnica

| Elemento | Mapa actual |
|---|---|
| Comandos | `CSE-COMMAND-013`, `CSE-COMMAND-019`, `CSE-COMMAND-021`. |
| Eventos | `CSE-EVENT-017`, `CSE-EVENT-023`, `CSE-EVENT-025`, `CSE-EVENT-026`. |
| Actores | `CSE-ACTOR-006` Técnico; `CSE-ACTOR-009` Usuario que cambia estado. |
| Políticas | `CSE-POLICY-011` técnico textual; `CSE-POLICY-012` estado y custodia separados; `CSE-POLICY-016` backend no valida transición. |
| Información necesaria | `CSE-READ-006` detalle actual; valores configurados de estado/técnico, cuyo contenido activo es `Unknown`. |
| Sistemas externos | `CSE-EXTERNAL-002` endpoint webhook sólo al intentar ciertos cierres. |
| Hotspots | `CSE-HOTSPOT-009` a `011`, `020`, `021`, `025`, `026`, `030`. |
| Evidencia / estado | Mutaciones y literales de cierre, `Confirmed by legacy code`; significado operacional, `Pending Product Owner validation`. |

## 6. Seguimiento y comunicación

| Elemento | Mapa actual |
|---|---|
| Comandos | `CSE-COMMAND-020`, `CSE-COMMAND-022`. |
| Eventos | `CSE-EVENT-024`, `CSE-EVENT-027`, `CSE-EVENT-028`. |
| Actores | `CSE-ACTOR-007`, `CSE-ACTOR-015`, `CSE-ACTOR-016` Proveedor de WhatsApp, `CSE-ACTOR-017` Endpoint webhook. |
| Políticas | `CSE-POLICY-017` seguimiento libre/transformado; `CSE-POLICY-018` webhook antes del guardado. |
| Información necesaria | `CSE-READ-009` seguimientos y evidencias; contenido/contacto/resultado de comunicaciones no se audita. |
| Sistemas externos | `CSE-EXTERNAL-001`, `CSE-EXTERNAL-002`, `CSE-EXTERNAL-005`. |
| Hotspots | `CSE-HOTSPOT-020`, `021`, `023`, `024`. |
| Evidencia / estado | Comportamiento de navegador/endpoints, `Confirmed by legacy code`; entrega efectiva de mensajes, `Unknown`. |

## 7. Pagos

| Elemento | Mapa actual |
|---|---|
| Comandos | `CSE-COMMAND-010`, `CSE-COMMAND-023`. |
| Eventos | `CSE-EVENT-014`, `CSE-EVENT-029`. |
| Actores | `CSE-ACTOR-008` Usuario que registra pago; cualquier persona puede pagar según operación. |
| Políticas | `CSE-POLICY-019` pago sin caja; `CSE-POLICY-020` saldo calculado en navegador. |
| Información necesaria | `CSE-READ-008`: presupuesto final y suma de filas de pago; caja, turno, método real, aplicación y conciliación faltan. |
| Sistemas externos | Caja/POS no está integrado en este flujo; por ello no recibe ID `CSE-EXTERNAL` como participante confirmado. |
| Hotspots | `CSE-HOTSPOT-014`, `015`, `027`. |
| Evidencia / estado | Registro y fórmula, `Confirmed by legacy code`; tratamiento contable, `Pending finance review`; afectar caja, `Desired future behavior`. |

## 8. Control de calidad

| Elemento | Mapa actual |
|---|---|
| Comandos / eventos | No se identificó comando ni evento actual demostrable de control de calidad. |
| Actores | `revisor` existe como texto, pero se llena al primer guardado no `Pendiente`; no confirma un actor de QC. |
| Políticas | Ninguna política de QC actual confirmada. |
| Información necesaria | Criterios, resultado, evidencia, ejecutor y fecha faltan. |
| Sistemas externos | Ninguno confirmado. |
| Hotspots | `CSE-HOTSPOT-009`, `011`, `030`. |
| Evidencia / estado | Ausencia en el flujo auditado, `Confirmed by legacy code`; existencia de una práctica manual, `Unknown`; definición, `Pending Product Owner validation`. |

Los canónicos `EVENT-028` a `EVENT-031` describen hipótesis futuras de QC. No se trasladan al Current State.

## 9. Entrega

| Elemento | Mapa actual |
|---|---|
| Comandos | `CSE-COMMAND-024`, `CSE-COMMAND-025`; `CSE-COMMAND-026` reimprimir nota puede apoyar una consulta, pero no prueba legitimación histórica. |
| Eventos | `CSE-EVENT-030` a `CSE-EVENT-032`. |
| Actores | `CSE-ACTOR-004`, `CSE-ACTOR-005`, `CSE-ACTOR-010` Usuario que marca entrega, `CSE-ACTOR-011` Persona que recoge, `CSE-ACTOR-012` Dueño, `CSE-ACTOR-013` Gerente. |
| Políticas | `CSE-POLICY-021` nota legitima; `CSE-POLICY-022` alternativas humanas sin nota; `CSE-POLICY-023` sin nota ni INE no se entrega salvo excepción; `CSE-POLICY-024` sistema no valida legitimación/saldo. |
| Información necesaria | `CSE-READ-010` nota/INE/reconocimiento/confirmación; `CSE-READ-011` estado, custodia y saldo visible. |
| Sistemas externos | `CSE-EXTERNAL-001` llamada; `CSE-EXTERNAL-003` nota; `CSE-EXTERNAL-005` evidencia de INE. |
| Hotspots | `CSE-HOTSPOT-016` a `019`, `022`, `024`, `030`. |
| Evidencia / estado | Regla humana, `Confirmed by Product Owner`; capacidad técnica de entregar sin controles, `Confirmed by legacy code`; vínculo entre ambos, ausente. |

`CSE-EVENT-031` (fila marcada) y `CSE-EVENT-032` (entrega física) no deben tratarse como el mismo hecho.

## 10. Garantía y reingreso

| Elemento | Mapa actual |
|---|---|
| Comandos | `CSE-COMMAND-027`, `CSE-COMMAND-028`. |
| Eventos | `CSE-EVENT-033`, `CSE-EVENT-034`. |
| Actores | Recepción, técnico y usuario que cambia estado; autoridad real `Unknown`. |
| Políticas | `CSE-POLICY-025` reapertura conserva primeras fechas; `CSE-POLICY-026` garantía es bandera/folio/etiqueta sin validación. |
| Información necesaria | `CSE-READ-012` estado, primeras fechas, posible garantía y folio anterior. Cobertura, vigencia, causa y costo faltan. |
| Sistemas externos | Ninguno confirmado. |
| Hotspots | `CSE-HOTSPOT-025` a `028`. |
| Evidencia / estado | Capacidad técnica, `Confirmed by legacy code`; proceso operativo, `Pending Product Owner validation`; efectos monetarios, `Pending finance review`. |

## Gaps de representación, no eventos actuales

Los siguientes hechos están escritos en pasado para mantener la convención de Event Storming, pero no pertenecen al flujo actual confirmado:

| Evento deseado | Razón de separación | Estado |
|---|---|---|
| `CSE-EVENT-035` Pago impactó caja | Es una intención expresada; no se encontró integración actual. | `Desired future behavior`. |
| `CSE-EVENT-036` Autorización quedó vinculada a cotización | El legado sólo permite una narración separada. | `Desired future behavior`. |
| `CSE-EVENT-037` Refacción fue reservada | No se encontró ciclo de pieza en el detalle. | `Desired future behavior`. |
| `CSE-EVENT-038` Custodia fue liberada con legitimación registrada | La legitimación actual es humana y no está vinculada a la marca de entrega. | `Desired future behavior`. |

Estos gaps no aprueban el mecanismo, los datos ni la arquitectura para resolverlos.
