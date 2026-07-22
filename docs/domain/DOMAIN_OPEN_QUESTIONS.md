# Preguntas abiertas del dominio

## Estado documental

- **Estado:** Draft / Discovery con respuestas arquitectónicas parciales
- **Autoridad:** ADR-004/010/011/012 en sus alcances; las demás respuestas no están aprobadas
- **Propietario de decisión:** Product Owner
- **Última revisión:** 2026-07-21
- **Próxima revisión:** Después de la entrevista de dominio

## Criterio

Estas preguntas refinan las [34 preguntas canónicas](../product/OPEN_QUESTIONS.md) sin sustituirlas. En otros documentos, DQ-001 es abreviatura de DOMAIN-QUESTION-001. Las respuestas permanecen TBD salvo donde una celda cite explícitamente una decisión aceptada; los aspectos residuales siguen abiertos.

| ID | Pregunta específica | QUESTION original | Concepto | Flujo | Regla | Estado relacionado | Evento | Contexto | Impacto | Prioridad | ¿Bloquea modelado? | Respuesta |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DOMAIN-QUESTION-001 | ¿Orden y reparación son conceptos distintos y cuál es su cardinalidad? | QUESTION-013 | WorkOrder, Repair | abrir–ejecutar–cerrar | RULE-001/010 | operativo | EVENT-007/020/027 | Repair Operations | identidad/lifecycle | Crítica | Sí | TBD |
| DOMAIN-QUESTION-002 | ¿Qué significa sucursal para cada concepto y qué puede transferirse? | QUESTION-006–008 | Branch | todo | RULE-021 | todos | EVENT-007/038 | Branch Operations | ownership/permisos | Crítica | Sí | TBD |
| DOMAIN-QUESTION-003 | ¿Cómo se impide confundir equipo atendido con estación operativa? | QUESTION-011/013 | dos objetos físicos | recepción/acceso | RULE-003/021 | estación operativa | EVENT-004 | IAM/Repair | seguridad/lenguaje | Crítica | Sí | ADR-010 fija la estación; separación de conceptos vigente |
| DOMAIN-QUESTION-004 | ¿Quién es cliente, propietario, contacto, entregante y decisor? | QUESTION-013 | personas/relaciones | recepción/autorización/entrega | RULE-002/003 | N/A | EVENT-001/002/038 | Customers | autoridad/privacidad | Crítica | Sí | TBD |
| DOMAIN-QUESTION-005 | ¿Cómo se reconoce el mismo dispositivo sin IMEI o con identificadores cambiantes? | QUESTION-013 | CustomerDevice | registro/reingreso | RULE-003 | N/A | EVENT-004 | Customers/Repair | continuidad | Alta | Sí | TBD |
| DOMAIN-QUESTION-006 | ¿Cuándo se pide código de acceso, quién lo usa y cuánto se conserva? | QUESTION-013/029 | DevicePasscode | recepción/prueba | RULE-005 | diagnóstico/QC | EVENT-005/028 | Repair/IAM | privacidad | Crítica | Sí | TBD |
| DOMAIN-QUESTION-007 | ¿Qué condición, accesorios, fotos, firma y correcciones exige recepción? | QUESTION-013 | Intake | recepción | RULE-004 | Received | EVENT-005/006 | Repair | custodia/evidencia | Crítica | Sí | TBD |
| DOMAIN-QUESTION-008 | ¿Cómo se distingue falla reportada, hallazgo y diagnóstico? | QUESTION-014 | Diagnosis | evaluación | RULE-006 | diagnóstico | EVENT-010–012 | Diagnosis | lenguaje y oferta | Crítica | Sí | TBD |
| DOMAIN-QUESTION-009 | ¿Qué crea una nueva versión de cotización y cómo viven opciones? | QUESTION-014 | Quote | cotización | RULE-007 | cotización | EVENT-013–019 | Quoting | autorización/importes | Crítica | Sí | TBD |
| DOMAIN-QUESTION-010 | ¿Cuándo una refacción es producto propio, parte externa o aportada? | QUESTION-015/016 | Part/Product | cotizar/reparar | RULE-011/016 | inventario | EVENT-024–026 | Inventory | stock/garantía | Alta | Sí | TBD |
| DOMAIN-QUESTION-011 | ¿Quién puede autorizar qué y qué evidencia vale por canal? | QUESTION-014/018/020 | Authorization | decisión | RULE-008 | quote state | EVENT-016–020 | Quoting/Messaging | consentimiento | Crítica | Sí | TBD |
| DOMAIN-QUESTION-012 | ¿Todo anticipo es pago aplicado y qué ocurre al cambiar/cancelar? | QUESTION-021 | Payment/Deposit | cobro | RULE-009/013 | financiero | EVENT-032–035 | Payments | saldo/reembolso | Crítica | Sí | TBD |
| DOMAIN-QUESTION-013 | ¿La asignación corresponde a orden, reparación o intervención? | QUESTION-013 | Assignment | ejecución | RULE-010 | operativo | EVENT-008/021 | Repair | responsabilidad | Alta | Sí | TBD |
| DOMAIN-QUESTION-014 | ¿Cómo se autoriza y prueba la identidad de quien recoge? | QUESTION-013/021 | Delivery/Recipient | entrega | RULE-015 | entrega | EVENT-038 | Delivery/Customers | custodia | Crítica | Sí | TBD |
| DOMAIN-QUESTION-015 | ¿Qué granularidad tiene una intervención y cómo registra daño/retrabajo? | QUESTION-013/014 | Intervention | reparación | RULE-010/020 | InProgress | EVENT-022/023/027 | Repair | trazabilidad | Alta | Sí | TBD |
| DOMAIN-QUESTION-016 | ¿Qué pruebas componen QC y quién puede declarar listo? | QUESTION-013/014 | QualityControl | fin técnico | RULE-012 | QC/Ready | EVENT-028–036 | Repair/Delivery | calidad/entrega | Crítica | Sí | TBD |
| DOMAIN-QUESTION-017 | ¿Cómo se gobiernan custodia, costo y garantía de reparación externa? | QUESTION-013/014 | ExternalRepair | ejecución | RULE-010/016 | Waiting/InProgress | EVENT-023/027 | Repair/Supplier | responsabilidad | Alta | No parcial | TBD |
| DOMAIN-QUESTION-018 | ¿Qué significan Ready, Delivered, Cancelled y Closed y quién transiciona? | QUESTION-013 | WorkOrderState | cierre | RULE-018/020 | operativo | EVENT-009/036/038/039 | Repair | lifecycle | Crítica | Sí | TBD |
| DOMAIN-QUESTION-019 | ¿Cómo se calcula saldo y cuándo puede entregarse con adeudo? | QUESTION-021/022 | Balance | pago/entrega | RULE-013/014 | financiero | EVENT-032–035/038 | Payments/Delivery | valor/custodia | Crítica | Sí | TBD |
| DOMAIN-QUESTION-020 | ¿Listo es estado operativo, estado de entrega o proyección visual? | QUESTION-013 | ReadyForDelivery | QC/entrega | RULE-012 | operativo/entrega | EVENT-036 | Repair/Delivery | ownership | Alta | Sí | TBD |
| DOMAIN-QUESTION-021 | ¿Qué activa, cubre y termina garantía, y cómo se decide un reclamo? | QUESTION-014 | Warranty | post-entrega | RULE-016/017 | garantía | EVENT-040–044 | Warranty | compromiso | Crítica | Sí | TBD |
| DOMAIN-QUESTION-022 | ¿Un reingreso abre orden, reclamación o reapertura y cómo se relaciona? | QUESTION-013/014 | Reentry | post-entrega | RULE-017 | garantía/operativo | EVENT-041/007 | Warranty/Repair | historia | Crítica | Sí | TBD |
| DOMAIN-QUESTION-023 | ¿Se requieren reservas, cómo expiran y se permiten negativos? | QUESTION-015/016 | InventoryReservation | partes | RULE-011 | inventario | EVENT-024–026 | Inventory | concurrencia | Crítica | Sí si Inventory entra | TBD |
| DOMAIN-QUESTION-024 | ¿Qué vocabulario del taller distingue intención de hecho ocurrido? | QUESTION-013 | Command/Event | transversal | RULE-020 | todos | todos | todos | trazabilidad | Media | No | TBD |
| DOMAIN-QUESTION-025 | ¿Qué políticas son invariantes y cuáles admiten excepción supervisada? | QUESTION-004/013/021 | Rule/Invariant | transversal | RULE-001–021 | todos | auditables | todos | consistencia | Crítica | Sí | TBD |
| DOMAIN-QUESTION-026 | ¿Puede haber varios diagnósticos y cuál alimenta la cotización? | QUESTION-014 | Diagnosis | evaluación | RULE-006/007 | diagnóstico | EVENT-011/012/013 | Diagnosis/Quoting | versionado | Alta | Sí | TBD |
| DOMAIN-QUESTION-027 | ¿Recepción debe ser acto, snapshot corregible, entidad o combinación? | QUESTION-013 | Intake | recepción | RULE-004 | Received | EVENT-005/006 | Repair | agregado/evidencia | Alta | Sí | TBD |
| DOMAIN-QUESTION-028 | ¿QC pertenece a reparación, orden o capacidad independiente? | QUESTION-013/014 | QualityControl | fin técnico | RULE-012 | QC | EVENT-028–031 | Repair | límite/autoridad | Alta | Sí | TBD |
| DOMAIN-QUESTION-029 | ¿Desde qué hitos se cancela o reabre y con qué efectos? | QUESTION-013 | WorkOrder | cancelación | RULE-018 | operativo | EVENT-009/039 | Repair | lifecycle/valor | Crítica | Sí | TBD |
| DOMAIN-QUESTION-030 | ¿Cuándo un equipo no recogido se considera abandonado y qué puede hacerse? | QUESTION-025/030 | Custody | post-listo | RULE-019 | entrega | EVENT-036 | Delivery | legal/custodia | Crítica | Sí para cierre | TBD |
| DOMAIN-QUESTION-031 | ¿Puede recibir, reparar, cobrar y entregar en sucursales distintas? | QUESTION-006–008/021 | Branch transfer | transversal | RULE-021 | todos | EVENT-007/032/038 | Branch/Repair/Payments | ownership/auditoría | Crítica | Sí | TBD |

## Prioridad de entrevista

Primero: DOMAIN-QUESTION-001/002/004/007–012/014/016/018–023/025/029–031. Las demás pueden resolverse en la misma narrativa o mantenerse abiertas con un follow-up explícito.
