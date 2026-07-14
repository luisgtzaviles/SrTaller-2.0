# Dimensión temporal del dominio

## Metadatos

- **Estado:** Initial hypothesis / Pending Product Owner validation
- **Propósito:** Hacer visibles significados temporales, hitos, esperas y métricas candidatas sin diseñar persistencia.
- **Alcance:** Recorrido operativo, pagos, inventario, entrega, garantía, abandono y transferencias.
- **Audiencia:** Product Owner, recepción, técnicos, inventario, caja, garantías, operación y arquitectura.
- **Última actualización:** 2026-07-13

## Principio de lectura

Una fecha no explica por sí sola qué ocurrió. Cada tiempo candidato necesita significado, fuente, zona, posibilidad de corrección y relación con el hecho. Este documento no define columnas ni mecanismos de reloj.

## Tipos de tiempo candidatos

| ID | Tipo | Significado candidato | Ejemplo | Riesgo o pregunta | Estado |
|---|---|---|---|---|---|
| TIME-TYPE-001 | Momento del hecho | instante en que la actividad ocurrió en el mundo operativo | técnico terminó a las 16:20 | ¿quién lo atestigua? | Initial hypothesis |
| TIME-TYPE-002 | Momento de registro | instante en que la plataforma recibió o conservó el dato | se documentó a las 16:35 | puede diferir del hecho | Initial hypothesis |
| TIME-TYPE-003 | Momento efectivo de negocio | instante desde el que una decisión produce efecto | precio vigente desde mañana | ¿admite efecto retroactivo? | Unknown |
| TIME-TYPE-004 | Fecha prometida | compromiso comunicado a otra persona | entrega prometida el viernes | promesa firme frente a estimación | Initial hypothesis |
| TIME-TYPE-005 | Fecha estimada | expectativa revisable sin compromiso confirmado | parte estimada para el jueves | quién la actualiza | Initial hypothesis |
| TIME-TYPE-006 | Fecha límite | último momento permitido por una política candidata | cotización válida hasta el lunes | zona y extensión | Initial hypothesis |
| TIME-TYPE-007 | Vigencia | intervalo en que una oferta, autorización o permiso puede usarse | cotización vigente siete días | inicio/inclusividad | Initial hypothesis |
| TIME-TYPE-008 | Vencimiento | hito que termina una vigencia | garantía expira | hecho automático o evaluación posterior | Initial hypothesis |
| TIME-TYPE-009 | Duración | diferencia entre hitos definidos | intervención activa 90 minutos | pausas y redondeo | Initial hypothesis |
| TIME-TYPE-010 | Tiempo de espera | periodo atribuido a una dependencia | esperando autorización | categorías y solapamientos | Initial hypothesis |
| TIME-TYPE-011 | Tiempo en estado | permanencia bajo una clasificación vigente | ReadyForDelivery por cuatro días | cambios retroactivos | Initial hypothesis |
| TIME-TYPE-012 | Horario operativo | ventana en que la sucursal atiende o cuenta plazos | lunes a sábado | festivos y sucursales distintas | Unknown |
| TIME-TYPE-013 | Zona horaria | referencia civil para interpretar fecha/hora | zona de la sucursal de origen | tenant, sucursal o evento | Unknown |
| TIME-TYPE-014 | Fecha corregida | registro posterior que rectifica un tiempo previo sin ocultarlo | promesa sustituida por otra fecha | razón, actor y efecto histórico | Initial hypothesis |
| TIME-TYPE-015 | Fecha cancelada o invalidada | registro que declara que un tiempo previo ya no representa un compromiso o hecho aceptado | cita cancelada o fecha capturada por error | distinguir cancelación operativa de corrección | Initial hypothesis |

## Hitos candidatos del recorrido

Los hitos sin EVENT-### indican un hueco del catálogo, no un evento nuevo aprobado.

| ID | Hito candidato | Evento existente o referencia | Tiempo relevante | Fuente candidata | Estado |
|---|---|---|---|---|---|
| TIME-MILESTONE-001 | contacto inicial | evento TBD; Q003/Q018 | hecho/registro | recepción o canal | Unknown |
| TIME-MILESTONE-002 | recepción del dispositivo | EVENT-005 | hecho/registro | recepción | Initial hypothesis |
| TIME-MILESTONE-003 | inspección inicial | EVENT-006 | hecho | recepción/técnico | Initial hypothesis |
| TIME-MILESTONE-004 | evidencia documentada | EVENT-006 | registro | recepción/técnico | Initial hypothesis |
| TIME-MILESTONE-005 | inicio de diagnóstico | EVENT-010 | hecho | técnico | Initial hypothesis |
| TIME-MILESTONE-006 | fin de diagnóstico | EVENT-011/012 | hecho/registro | técnico | Initial hypothesis |
| TIME-MILESTONE-007 | creación de cotización | EVENT-013 | registro | Quoting | Initial hypothesis |
| TIME-MILESTONE-008 | revisión de cotización | EVENT-015 | hecho/efectivo | Quoting | Initial hypothesis |
| TIME-MILESTONE-009 | solicitud de autorización | sin evento canónico; DQ-011 | hecho/registro | recepción/canal | Unknown |
| TIME-MILESTONE-010 | recepción de decisión | EVENT-016/017/018 | hecho/registro | cliente autorizado | Initial hypothesis |
| TIME-MILESTONE-011 | anticipo recibido | EVENT-033 | hecho/registro | Payments/caja | Initial hypothesis |
| TIME-MILESTONE-012 | refacción solicitada | EVENT-024 | hecho | técnico/inventario | Initial hypothesis |
| TIME-MILESTONE-013 | refacción reservada | EVENT-025 | efectivo/vencimiento | Inventory | Initial hypothesis |
| TIME-MILESTONE-014 | refacción recibida | evento canónico TBD | hecho/registro | inventario/proveedor | Unknown |
| TIME-MILESTONE-015 | refacción consumida | EVENT-026 | hecho | técnico/inventario | Initial hypothesis |
| TIME-MILESTONE-016 | asignación técnica | EVENT-008/021 | efectivo | supervisor | Initial hypothesis |
| TIME-MILESTONE-017 | intervención iniciada | EVENT-022 | hecho | técnico | Initial hypothesis |
| TIME-MILESTONE-018 | intervención pausada | EVENT-023 | hecho | técnico/supervisor | Initial hypothesis |
| TIME-MILESTONE-019 | intervención reanudada | evento canónico TBD; DQ-015 | hecho | técnico | Unknown |
| TIME-MILESTONE-020 | intervención finalizada | EVENT-027 | hecho | técnico | Initial hypothesis |
| TIME-MILESTONE-021 | QC iniciado | EVENT-028 | hecho | QC | Initial hypothesis |
| TIME-MILESTONE-022 | QC finalizado | EVENT-029/030 | hecho | QC | Initial hypothesis |
| TIME-MILESTONE-023 | aviso al cliente | notificación derivada TBD | hecho/registro | recepción/Notifications | Unknown |
| TIME-MILESTONE-024 | promesa de entrega | sin evento canónico | prometido/estimado | recepción | Unknown |
| TIME-MILESTONE-025 | equipo marcado listo | EVENT-036 | hecho/registro | actor por decidir | Initial hypothesis |
| TIME-MILESTONE-026 | pago registrado | EVENT-032/033 | hecho/registro | Payments | Initial hypothesis |
| TIME-MILESTONE-027 | entrega programada | EVENT-037 | prometido/estimado | recepción/cliente | Initial hypothesis |
| TIME-MILESTONE-028 | dispositivo entregado | EVENT-038 | hecho | recepción | Initial hypothesis |
| TIME-MILESTONE-029 | orden cerrada | EVENT-039 | hecho/efectivo | Repair Operations | Initial hypothesis |
| TIME-MILESTONE-030 | garantía iniciada | EVENT-040 | efectivo | Warranty | Initial hypothesis |
| TIME-MILESTONE-031 | garantía vencida | estado/evento canónico TBD | vencimiento | Warranty/política | Unknown |
| TIME-MILESTONE-032 | reingreso | EVENT-041 sólo si es reclamo; DQ-022 | hecho | recepción | Unknown |
| TIME-MILESTONE-033 | abandono considerado | evento canónico TBD; DQ-030 | límite/efectivo | autoridad legal/operativa TBD | Unknown |
| TIME-MILESTONE-034 | cancelación | EVENT-009 | hecho/efectivo | actor autorizado TBD | Initial hypothesis |
| TIME-MILESTONE-035 | transferencia solicitada/recibida | evento canónico TBD; DQ-002/031 | hecho/espera | sucursales involucradas | Unknown |

## Ambigüedades temporales

| ID | Pregunta de validación | Referencias | Riesgo |
|---|---|---|---|
| TIME-ISSUE-001 | ¿Qué fecha controla una garantía? | DQ-021, RULE-016, EVENT-038/040 | cobertura prematura o tardía |
| TIME-ISSUE-002 | ¿La garantía inicia al terminar, pagar, entregar u otro hito? | POI-5.1, DOMAIN-DECISION-009 | resultados inconsistentes |
| TIME-ISSUE-003 | ¿Cómo se conserva una corrección retroactiva? | RULE-020, INV-008 | ocultar la historia |
| TIME-ISSUE-004 | ¿Qué zona horaria interpreta cada fecha? | Q006–008, DQ-031 | orden temporal ambiguo |
| TIME-ISSUE-005 | ¿Prevalece tenant, sucursal u origen del evento? | INV-001/002/010 | transferencias incoherentes |
| TIME-ISSUE-006 | ¿Cómo se calcula tiempo de reparación? | DQ-001/015 | mezclar ciclo total con trabajo activo |
| TIME-ISSUE-007 | ¿Las pausas por cliente, parte o proveedor cuentan? | EVENT-023, SCENARIO-008 | métricas que castigan al actor equivocado |
| TIME-ISSUE-008 | ¿Qué significa entrega prometida y quién puede cambiarla? | TIME-TYPE-004/005, POI-3.2 | compromiso presentado como estimación |
| TIME-ISSUE-009 | ¿Cuándo una orden pasa de no recogida a abandonada? | DQ-030, RULE-019 | disposición sin autoridad |
| TIME-ISSUE-010 | ¿Cómo se auditan cambios de fecha? | RULE-020, INV-008 | falta de atribución |
| TIME-ISSUE-011 | ¿Qué ocurre con hechos recibidos fuera de orden? | EDGE-039, DQ-024 | estado o métrica regresiva |

## Métricas candidatas

Ninguna medición es un KPI aprobado.

| ID | Medición posible | Inicio candidato | Fin candidato | Exclusiones posibles | Preguntas pendientes | Riesgo de interpretación |
|---|---|---|---|---|---|---|
| TIME-METRIC-001 | tiempo de recepción | llegada/contacto TIME-MILESTONE-001 | EVENT-005/007 | espera voluntaria del cliente | ¿contacto o custodia inicia? | comparar canales distintos |
| TIME-METRIC-002 | tiempo hasta diagnóstico | EVENT-005/007 | EVENT-010 o 011 | cola fuera de horario | ¿inicio o conclusión? | premiar diagnósticos superficiales |
| TIME-METRIC-003 | espera de autorización | EVENT-014 | EVENT-016/017/018/019 | cambios de cotización | ¿reinicia con revisión? | atribuir demora al taller |
| TIME-METRIC-004 | espera de refacción | EVENT-024 | recepción TBD o EVENT-025 | parte ya disponible | proveedor, traslado o cliente | mezclar reserva con recepción |
| TIME-METRIC-005 | intervención activa | EVENT-022/reanudación TBD | EVENT-023/027 | pausas documentadas | múltiples técnicos/intervenciones | inferir productividad individual |
| TIME-METRIC-006 | tiempo en QC | EVENT-028 | EVENT-029/030 | retrabajo posterior | ¿cada intento o total? | ocultar ciclos fallidos |
| TIME-METRIC-007 | listo sin entregar | EVENT-036 | EVENT-038 | cita futura acordada | avisos y horario | culpar al taller por cliente ausente |
| TIME-METRIC-008 | ciclo total | EVENT-005/007 | EVENT-038 o 039 | cancelaciones/abandono | ¿entrega o cierre? | mezclar rutas distintas |
| TIME-METRIC-009 | tiempo hasta reingreso | EVENT-038 | EVENT-041 o reingreso TBD | falla no relacionada | garantía frente a nueva falla | interpretar regreso como defecto |
| TIME-METRIC-010 | cumplimiento de promesa | TIME-MILESTONE-024 | EVENT-036/038 | promesa corregida con evidencia | ¿listo o entregado? | manipular promesas |
| TIME-METRIC-011 | antigüedad de abiertas | EVENT-007 | momento de observación | Closed/Cancelled según definición | qué estados cuentan abiertos | comparar backlog heterogéneo |

## Reglas, invariantes y escenarios temporales

| Tema temporal | Reglas/invariantes existentes | Escenarios | Preguntas |
|---|---|---|---|
| evidencia y corrección | RULE-004/020, INV-008 | SCENARIO-001/021 | DQ-007/025 |
| vigencia de cotización | RULE-007, INV-012 | SCENARIO-004–006/021 | DQ-009/011 |
| reserva y espera | RULE-011, INV-013 | SCENARIO-007/008/022 | DQ-023 |
| pausa y reasignación | RULE-010, INV-016 | SCENARIO-009 | DQ-013/015 |
| listo, entrega y cierre | RULE-012–015/020, INV-005/009/015 | SCENARIO-010–014 | DQ-018–020 |
| garantía y reingreso | RULE-016/017, INV-014 | SCENARIO-018/019/022 | DQ-021/022 |
| cancelación y abandono | RULE-018/019, INV-005/009 | SCENARIO-015/017 | DQ-029/030 |
| transferencias | RULE-021, INV-002/010 | SCENARIO-020 | DQ-002/031 |
| duplicados/fuera de orden | RULE-020, INV-008/009 | EDGE-038/039 | DQ-024/025 |

## Revisión requerida

El Product Owner y expertos operativos necesitan validar qué hito inicia y termina cada periodo. Arquitectura sólo puede revisar orden, relojes y consistencia después de que esos significados estén claros.
