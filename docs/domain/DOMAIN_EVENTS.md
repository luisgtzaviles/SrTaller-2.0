# Eventos de dominio candidatos

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Convención

Un evento expresa en pasado un hecho relevante ya ocurrido. Todos tienen validación Initial hypothesis; los nombres en inglés son vocabulario candidato, no contratos ni payloads.

| ID | Evento | Significado de negocio | Hecho pasado | Origen | Datos conceptuales mínimos | Consecuencias posibles | Consumidores potenciales | Auditoría | Estado de validación |
|---|---|---|---|---|---|---|---|---|---|
| EVENT-001 | CustomerIdentified | Se vinculó la operación con un cliente existente. | Cliente reconocido | Recepción | cliente, criterio y contexto | continuar recepción | Repairs, Audit | Sí | Initial hypothesis |
| EVENT-002 | CustomerCreated | Se reconoció un cliente nuevo. | Cliente creado | Recepción | identidad conceptual, actor, tenant | registrar dispositivo/contacto | Repairs, CRM, Audit | Sí | Initial hypothesis |
| EVENT-003 | CustomerUpdated | Cambió información autorizada del cliente. | Cliente actualizado | Customer Management | cliente, cambio, propósito | refrescar referencias | Repairs, CRM, Audit | Sí | Initial hypothesis |
| EVENT-004 | CustomerDeviceRegistered | Se distinguió un equipo del cliente. | Dispositivo registrado | Recepción | dispositivo, relación, rasgos | asociar historial/orden | Repairs, Audit | Sí | Initial hypothesis |
| EVENT-005 | DeviceIntakeRecorded | El taller aceptó una recepción/custodia. | Recepción registrada | Recepción | orden, dispositivo, entregante, momento | iniciar evaluación | Repairs, Delivery, Audit | Sí | Initial hypothesis |
| EVENT-006 | DeviceConditionDocumented | Se fijó una condición observada. | Condición documentada | Recepción/técnico | dispositivo, condición, evidencia, actor | comparar daños | Repairs, Warranty, Audit | Sí | Initial hypothesis |
| EVENT-007 | WorkOrderCreated | Nació el caso coordinador. | Orden creada | Recepción | orden, tenant, sucursal, dispositivo, propósito | asignar y seguir | Repairs, Audit | Sí | Initial hypothesis |
| EVENT-008 | WorkOrderAssigned | La orden recibió responsable operativo. | Orden asignada | Supervisor | orden, responsable, alcance | iniciar trabajo | Repairs, Notifications, Audit | Sí | Initial hypothesis |
| EVENT-009 | WorkOrderCancelled | Se canceló el caso con efectos resueltos o pendientes. | Orden cancelada | Actor autorizado | orden, actor, motivo, efectos | devolver, reembolsar o cerrar | Payments, Delivery, Audit | Sí | Initial hypothesis |
| EVENT-010 | DiagnosisStarted | Comenzó una evaluación técnica. | Diagnóstico iniciado | Técnico | diagnóstico, orden, técnico, objetivo | indicar revisión activa | Repairs, Audit | Sí | Initial hypothesis |
| EVENT-011 | DiagnosisCompleted | Terminó una evaluación con conclusión. | Diagnóstico completado | Técnico | diagnóstico, hallazgos, conclusión, evidencia | preparar cotización | Quoting, Repairs, Audit | Sí | Initial hypothesis |
| EVENT-012 | DiagnosisMarkedInconclusive | La evaluación terminó sin conclusión suficiente. | Diagnóstico inconcluso | Técnico | diagnóstico, límites, siguiente opción | pedir evidencia/decisión | Quoting, Repairs, Audit | Sí | Initial hypothesis |
| EVENT-013 | QuoteCreated | Se preparó una versión aún no emitida. | Cotización creada | Vendedor/recepción | cotización, versión, orden, partidas | revisar y emitir | Quoting, Audit | Sí | Initial hypothesis |
| EVENT-014 | QuoteIssued | Una versión se presentó como propuesta vigente. | Cotización emitida | Quoting | versión, destinatario, total, vigencia | esperar decisión | Messaging, Repairs, Audit | Sí | Initial hypothesis |
| EVENT-015 | QuoteRevised | Se creó una versión que sustituye otra. | Cotización revisada | Quoting | versión nueva/anterior, motivo, cambio | invalidar decisión futura sobre anterior | Repairs, Payments, Audit | Sí | Initial hypothesis |
| EVENT-016 | QuoteApproved | Se aprobó una versión completa. | Cotización aprobada | Cliente autorizado | versión, decisor, alcance, evidencia | autorizar reparación | Repairs, Inventory, Audit | Sí | Initial hypothesis |
| EVENT-017 | QuotePartiallyApproved | Se aceptó sólo parte del alcance. | Cotización parcialmente aprobada | Cliente autorizado | versión, partidas aceptadas, evidencia | planear alcance parcial | Repairs, Inventory, Audit | Sí | Initial hypothesis |
| EVENT-018 | QuoteRejected | Se rechazó una versión. | Cotización rechazada | Cliente autorizado | versión, decisor, evidencia | cancelar/devolver/reformular | Repairs, Delivery, Audit | Sí | Initial hypothesis |
| EVENT-019 | QuoteExpired | Terminó la vigencia sin decisión aplicable. | Cotización expirada | Política/proceso | versión, vigencia | impedir aprobación directa | Quoting, Repairs | Sí | Initial hypothesis |
| EVENT-020 | RepairAuthorized | Quedó permitido un alcance de reparación. | Reparación autorizada | Quoting/Repair | orden, versión/autorización, alcance | asignar e iniciar | Repairs, Inventory, Audit | Sí | Initial hypothesis |
| EVENT-021 | TechnicianAssigned | Se asignó responsabilidad técnica. | Técnico asignado | Supervisor | trabajo, técnico, alcance, motivo | habilitar intervención | Repairs, Notifications, Audit | Sí | Initial hypothesis |
| EVENT-022 | RepairStarted | Comenzó trabajo autorizado. | Reparación iniciada | Técnico | reparación, actor, alcance, momento | mostrar progreso | Repairs, Audit | Sí | Initial hypothesis |
| EVENT-023 | RepairPaused | Se detuvo temporalmente el trabajo. | Reparación pausada | Técnico/supervisor | reparación, motivo, dependencia | esperar o reasignar | Repairs, Notifications, Audit | Sí | Initial hypothesis |
| EVENT-024 | PartRequested | Se declaró necesidad de una parte. | Refacción solicitada | Técnico | trabajo, parte, cantidad, razón | buscar/reservar/comprar | Inventory, Quoting | Sí | Initial hypothesis |
| EVENT-025 | PartReserved | Se comprometió cantidad disponible. | Refacción reservada | Inventory | reserva, parte, cantidad, propósito | impedir sobreasignación | Repairs, Inventory | Sí | Initial hypothesis |
| EVENT-026 | PartConsumed | Se aplicó una cantidad al trabajo. | Refacción consumida | Técnico/Inventory | parte, cantidad, trabajo, actor | ajustar disponibilidad/costo | Repairs, Inventory, Audit | Sí | Initial hypothesis |
| EVENT-027 | RepairCompleted | Terminó el alcance técnico declarado. | Reparación completada | Técnico | reparación, resultado, intervenciones | iniciar QC | Quality, Repairs | Sí | Initial hypothesis |
| EVENT-028 | QualityCheckStarted | Comenzó evaluación final. | Control iniciado | Técnico/QC | control, trabajo, criterios, actor | bloquear listo | Repairs, Audit | Sí | Initial hypothesis |
| EVENT-029 | QualityCheckPassed | El resultado cumplió criterios aplicables. | Control aprobado | Técnico/QC | control, criterios, resultado | permitir marcar listo | Delivery, Repairs, Audit | Sí | Initial hypothesis |
| EVENT-030 | QualityCheckFailed | El resultado no cumplió criterios. | Control fallido | Técnico/QC | control, fallos, evidencia | pedir retrabajo/decisión | Repairs, Audit | Sí | Initial hypothesis |
| EVENT-031 | ReworkRequested | Se solicitó corregir un resultado fallido. | Retrabajo solicitado | QC/supervisor | trabajo, motivo, alcance | reasignar y volver a intervenir | Repairs, Notifications | Sí | Initial hypothesis |
| EVENT-032 | PaymentRecorded | Se reconoció un pago aplicado. | Pago registrado | Cajero/Payments | pago, importe, moneda, medio, obligación | recalcular saldo/caja | Repairs, Cash, Audit | Sí | Initial hypothesis |
| EVENT-033 | DepositRecorded | Se reconoció un pago anticipado. | Anticipo registrado | Cajero/Payments | pago, carácter de anticipo, aplicación | financiar parte/recalcular saldo | Repairs, Inventory, Cash | Sí | Initial hypothesis |
| EVENT-034 | PaymentRefunded | Se devolvió valor previamente recibido. | Pago reembolsado | Cajero/supervisor | pago original, importe, motivo, actor | recalcular saldo/caja | Repairs, Cash, Audit | Sí | Initial hypothesis |
| EVENT-035 | BalanceSettled | La obligación conocida quedó sin saldo. | Saldo liquidado | Payments | obligación, aplicaciones, momento | permitir entrega según política | Delivery, Repairs | Sí | Initial hypothesis |
| EVENT-036 | DeviceMarkedReady | El equipo quedó disponible para entrega según controles. | Dispositivo marcado listo | Actor por decidir | orden, dispositivo, criterio | programar/avisar entrega | Delivery, Notifications, Audit | Sí | Initial hypothesis |
| EVENT-037 | DeliveryScheduled | Se acordó una intención temporal de entrega. | Entrega programada | Recepción/cliente | orden, periodo, receptor previsto | preparar custodia | Delivery, Notifications | Según riesgo | Initial hypothesis |
| EVENT-038 | DeviceDelivered | Se transfirió custodia al receptor. | Dispositivo entregado | Recepción | orden, dispositivo, receptor, evidencia, condición | iniciar garantía/cierre | Warranty, Payments, Audit | Sí | Initial hypothesis |
| EVENT-039 | WorkOrderClosed | Terminó el seguimiento operativo activo. | Orden cerrada | Actor/proceso autorizado | orden, criterio, actor, pendientes resueltos | archivar/medir | Reporting, Audit | Sí | Initial hypothesis |
| EVENT-040 | WarrantyActivated | Comenzó una cobertura explícita. | Garantía activada | Warranty/proceso | cobertura, origen, periodo | evaluar reclamos futuros | Warranty, Customer | Sí | Initial hypothesis |
| EVENT-041 | WarrantyClaimOpened | Se registró una solicitud de cobertura. | Reclamación abierta | Cliente/recepción | reclamación, cobertura/orden, síntoma, evidencia | evaluar | Warranty, Repairs, Audit | Sí | Initial hypothesis |
| EVENT-042 | WarrantyClaimAccepted | Se decidió que una reclamación está cubierta. | Reclamación aceptada | Autoridad por decidir | reclamación, alcance, motivo | autorizar resolución | Repairs, Inventory, Audit | Sí | Initial hypothesis |
| EVENT-043 | WarrantyClaimRejected | Se decidió que no está cubierta. | Reclamación rechazada | Autoridad por decidir | reclamación, motivo, evidencia | ofrecer nueva cotización/cerrar | Quoting, Customer, Audit | Sí | Initial hypothesis |
| EVENT-044 | WarrantyResolved | Terminó la respuesta a la reclamación. | Garantía resuelta | Warranty | reclamación, resultado, trabajo/pago relacionado | cerrar caso y conservar historial | Reporting, Audit | Sí | Initial hypothesis |
## Qué no es un evento de dominio

| Elemento | Diferencia | Ejemplo |
|---|---|---|
| Comando | Intención que puede rechazarse | ApproveQuote solicita; QuoteApproved confirma |
| Notificación | Aviso derivado para una audiencia | “Tu equipo está listo” puede derivar de EVENT-036 |
| Log | Evidencia técnica u operacional | “worker reintentó” no prueba un pago |
| Estado | Condición vigente, no hecho puntual | Paid no sustituye PaymentRecorded |
| Evento de interfaz | Interacción local sin significado confirmado | clic en “Guardar” no equivale a QuoteIssued |

## Validación

Cada evento necesita ejemplo, origen autorizado, criterio de ocurrencia e interesados reales. Que aparezca en este catálogo no obliga a publicarlo técnicamente ni a conservar todos sus datos fuera del contexto propietario.
