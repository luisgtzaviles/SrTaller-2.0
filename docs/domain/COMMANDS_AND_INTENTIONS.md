# Comandos e intenciones candidatas

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Distinción

Un comando expresa la intención presente de un actor y puede rechazarse. Un evento expresa un hecho pasado que ya fue aceptado. El comando ApproveQuote no garantiza QuoteApproved.

| Intención | Actor candidato | Propósito | Información necesaria | Precondiciones | Reglas | Resultado | Eventos posibles | Motivos de rechazo |
|---|---|---|---|---|---|---|---|---|
| RegisterCustomer | Recepcionista | reconocer cliente nuevo | identidad/contacto mínimo y contexto | búsqueda previa | RULE-002 | cliente distinguible | EVENT-002 | duplicado incierto, contexto inválido |
| RegisterCustomerDevice | Recepcionista | distinguir equipo | tipo, rasgos y relaciones | cliente/propietario conocido o excepción | RULE-003 | dispositivo registrado | EVENT-004 | cruce de tenant, identidad conflictiva |
| OpenWorkOrder | Recepcionista | iniciar caso coordinador | cliente, dispositivo, sucursal, propósito | contexto autorizado | RULE-001 | orden y folio candidatos | EVENT-007 | tenant/sucursal incoherente |
| RecordIntake | Recepcionista | aceptar y documentar entrada | entregante, condición, accesorios, evidencia | orden/dispositivo identificables | RULE-004/005 | custodia registrada | EVENT-005/006 | evidencia insuficiente no aceptada, orden cerrada |
| StartDiagnosis | Técnico | comenzar evaluación | objetivo, falla y alcance | asignación y autorización aplicables | RULE-006/010 | diagnóstico activo | EVENT-010 | sin permiso, orden cancelada |
| CompleteDiagnosis | Técnico | concluir evaluación | hallazgos, conclusión/evidencia | diagnóstico activo | RULE-006 | completado o inconcluso | EVENT-011/012 | datos insuficientes o estado inválido |
| CreateQuote | Vendedor/recepción | preparar propuesta | diagnóstico o base, partidas y condiciones | orden cotizable | RULE-007 | borrador versionado | EVENT-013 | moneda/alcance incoherentes |
| IssueQuote | Actor autorizado | presentar versión | versión, destinatario y vigencia | borrador completo | RULE-007 | propuesta vigente | EVENT-014 | versión ya emitida o sustituida |
| ApproveQuote | Cliente autorizado | aceptar alcance | versión, partidas, autoridad y evidencia | versión vigente | RULE-008 | decisión total/parcial | EVENT-016/017/020 | decisor no autorizado, expirada, ambigua |
| RejectQuote | Cliente autorizado | rechazar propuesta | versión, decisor y evidencia | versión vigente | RULE-008 | rechazo atribuible | EVENT-018 | versión incorrecta o identidad no verificable |
| AssignTechnician | Supervisor | fijar responsabilidad | técnico, trabajo, alcance y motivo | actor y sucursal autorizados | RULE-010/021 | asignación vigente | EVENT-008/021 | técnico no elegible, orden cerrada |
| StartRepair | Técnico | iniciar trabajo permitido | reparación, autorización y alcance | cotización/autorización aplicables | RULE-008/010 | reparación activa | EVENT-022 | sin autorización, asignación o parte crítica |
| ReservePart | Técnico/Inventory | comprometer cantidad | producto/parte, cantidad, ubicación, orden | disponibilidad y compatibilidad | RULE-011 | reserva activa | EVENT-024/025 | cantidad no positiva, insuficiente, otra sucursal |
| ConsumePart | Técnico/Inventory | reconocer uso real | parte, cantidad, trabajo y actor | reserva o excepción válida | RULE-011 | consumo trazable | EVENT-026 | negativo, incompatible, trabajo no autorizado |
| CompleteRepair | Técnico | declarar fin técnico | resultado, intervenciones y pruebas | reparación activa | RULE-012 | lista para QC, no para entrega aún | EVENT-027 | pendientes o evidencia insuficiente |
| RunQualityCheck | Técnico/QC | evaluar resultado | criterios, trabajo, pruebas | reparación completada | RULE-012 | aprobado/fallido | EVENT-028/029/030/031 | criterio inexistente o conflicto de autoridad |
| RecordPayment | Cajero | reconocer valor recibido | importe, moneda, medio, obligación y evidencia | contexto financiero vigente | RULE-009/013 | pago aplicado y saldo recalculado | EVENT-032/033/035 | importe inválido, duplicado, obligación ajena |
| MarkReadyForDelivery | Actor por decidir | declarar disponibilidad | QC, condición y pendientes | criterios de listo satisfechos | RULE-012/013 | hito de entrega | EVENT-036 | QC fallido o bloqueo operativo |
| DeliverDevice | Recepcionista/cajero | transferir custodia | receptor, autoridad, dispositivo, condición, saldo | listo y política de salida cumplida | RULE-013/014/015 | entrega documentada | EVENT-038/040 | identidad insuficiente, saldo sin excepción |
| OpenWarrantyClaim | Cliente/recepción | pedir evaluación de cobertura | orden/cobertura, síntoma y evidencia | relación histórica identificable | RULE-016/017 | reclamación, no aceptación | EVENT-041 | duplicado o sin vínculo suficiente |
| CloseWorkOrder | Gerente/proceso | terminar seguimiento activo | criterio de cierre, actor y pendientes | entrega/cancelación y efectos resueltos | RULE-018/020 | orden cerrada | EVENT-039 | custodia, pago o decisión pendiente |

## Intenciones adicionales por definir

ReviseQuote, CancelWorkOrder, PauseRepair, RequestRework, RefundPayment, ScheduleDelivery, AcceptWarrantyClaim, RejectWarrantyClaim y ResolveWarranty son necesarias para completar máquinas y escenarios, pero sus autoridades y reglas siguen abiertas.

## Rechazo y evidencia

Un rechazo debe ser comprensible en lenguaje del negocio, no revelar datos ajenos y no producir un evento de éxito. Intentos sensibles pueden requerir auditoría aun cuando se rechacen.
