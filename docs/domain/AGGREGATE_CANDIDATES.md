# Candidatos a agregados

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Advertencia

Son hipótesis sobre límites de consistencia, no clases, esquemas o agregados definitivos.

## Customer

- **Posible root y responsabilidad:** Customer; mantener identidad comercial y relaciones de contacto sin fusionar por accidente.
- **Consistencia:** cambios atribuibles, relaciones dentro del tenant y deduplicación controlada.
- **Entidades internas candidatas:** ContactRelationship, OwnershipRelationship; **values:** CustomerId, PersonName, PhoneNumber, EmailAddress.
- **Comandos/eventos:** RegisterCustomer, update/merge por definir; EVENT-001/002/003.
- **Invariantes:** INV-001 por contexto y RULE-002/003.
- **Separación:** órdenes y conversaciones tienen ciclos propios.
- **Riesgo de tamaño:** absorber dispositivos, historial, CRM y mensajes.
- **Alternativas:** cliente ligero con contactos separados; persona/organización como modelos distintos.
- **Preguntas:** ¿tenant-wide?, ¿persona u organización?, ¿cómo se fusiona? DQ-004.

## CustomerDevice

- **Posible root y responsabilidad:** CustomerDevice; conservar continuidad del equipo y sus identificadores observables.
- **Consistencia:** nunca confundirse con estación operativa; relaciones de propiedad no presumidas.
- **Entidades internas candidatas:** DeviceIdentifier, OwnershipPeriod TBD; **values:** IMEI, SerialNumber, ConditionSnapshot.
- **Comandos/eventos:** RegisterCustomerDevice; EVENT-004/005/006.
- **Invariantes:** INV-003.
- **Separación:** un equipo puede existir antes/después de una relación con cliente y participar en varias órdenes.
- **Riesgo de tamaño:** guardar todas las recepciones, fotos, reparaciones y secretos.
- **Alternativas:** dispositivo interno a Customer; dispositivo identificado sólo por orden.
- **Preguntas:** ¿pertenece al cliente o existe independientemente?, ¿cómo cambia propiedad/placa? DQ-005.

## WorkOrder

- **Posible root y responsabilidad:** WorkOrder; coordinar el caso operativo y proteger transiciones.
- **Consistencia:** tenant/sucursal de origen, estado válido, custodia y referencias activas.
- **Entidades internas candidatas:** Intake snapshot, assignment, operational milestone; **values:** WorkOrderId, Folio, FailureDescription.
- **Comandos/eventos:** OpenWorkOrder, RecordIntake, AssignTechnician, CloseWorkOrder; EVENT-005–009, 036/039.
- **Invariantes:** INV-001/002/005/009/016.
- **Separación:** Quote, Payment, WarrantyClaim e InventoryReservation tienen reglas y ritmos diferentes.
- **Riesgo de tamaño:** incluir diagnóstico, versiones, pagos, stock, mensajes, archivos y auditoría.
- **Alternativas:** orden como process manager; Repair como root por cada falla.
- **Preguntas:** ¿diagnóstico está dentro o separado?, ¿recepción es entidad, evento o snapshot?, ¿QC pertenece a reparación u orden? DQ-001/027/028.

## Quote

- **Posible root y responsabilidad:** Quote o QuoteVersion; preservar propuestas y decisiones por versión.
- **Consistencia:** versión emitida inmutable, importes coherentes y autorización sobre versión exacta.
- **Entidades internas candidatas:** QuoteVersion, QuoteLine, Authorization; **values:** Money, Currency, Percentage, DateRange.
- **Comandos/eventos:** CreateQuote, IssueQuote, ApproveQuote, RejectQuote, ReviseQuote; EVENT-013–020.
- **Invariantes:** INV-006/012.
- **Separación:** pago no cambia la oferta; reparación ejecuta sólo el alcance publicado.
- **Riesgo de tamaño:** incorporar catálogo, inventario, mensajes y toda la orden.
- **Alternativas:** cada versión como agregado inmutable; Authorization como agregado separado.
- **Preguntas:** ¿cómo se versiona?, ¿opciones paralelas?, ¿qué cambio es material? DQ-009/011.

## Payment

- **Posible root y responsabilidad:** Payment; reconocer valor, aplicación y devoluciones sin reescribir hechos.
- **Consistencia:** tenant común, importe/moneda, aplicación no superior al disponible y refund limitado.
- **Entidades internas candidatas:** PaymentApplication, Refund; **values:** Money, Currency, external reference TBD.
- **Comandos/eventos:** RecordPayment, RefundPayment; EVENT-032–035.
- **Invariantes:** INV-004/007 análoga para cantidades, INV-011.
- **Separación:** pertenece al contexto financiero, no a la orden; Cash registra control físico distinto.
- **Riesgo de tamaño:** absorber obligación, caja, procesador, comprobante fiscal y billing SaaS.
- **Alternativas:** Receipt/Payment separados; ledger de aplicaciones.
- **Preguntas:** ¿una aplicación puede cubrir varias órdenes?, ¿anticipo es subtipo?, ¿contracargo? DQ-012/019.

## WarrantyClaim

- **Posible root y responsabilidad:** WarrantyClaim; evaluar y resolver una solicitud sin alterar el caso original.
- **Consistencia:** vínculo con cobertura/origen, estado válido, alcance y decisión atribuible.
- **Entidades internas candidatas:** WarrantyEvaluation, Resolution; **values:** WarrantyPeriod, FailureDescription, ConditionSnapshot.
- **Comandos/eventos:** OpenWarrantyClaim, Accept/Reject/Resolve; EVENT-041–044.
- **Invariantes:** INV-009/014.
- **Separación:** la cobertura puede derivarse de reparación/entrega, pero el reclamo tiene ciclo nuevo.
- **Riesgo de tamaño:** duplicar orden completa y stock/pagos.
- **Alternativas:** reabrir WorkOrder; crear nueva orden relacionada; cobertura y reclamo como agregados distintos.
- **Preguntas:** ¿garantía es continuación o caso independiente?, ¿cobertura parcial? DQ-021/022.

## InventoryReservation

- **Posible root y responsabilidad:** InventoryReservation; comprometer y liberar cantidad para un propósito.
- **Consistencia:** cantidad positiva, alcance de ubicación, disponibilidad y ciclo de reserva.
- **Entidades internas candidatas:** ReservationLine si es multi-parte; **values:** Quantity, BranchId, WorkOrderId, DateRange.
- **Comandos/eventos:** ReservePart, release/expire, ConsumePart; EVENT-024/025/026.
- **Invariantes:** INV-007/013.
- **Separación:** catálogo/existencia y reparación tienen ownership distintos.
- **Riesgo de tamaño:** incluir todos los movimientos, compras y transferencias.
- **Alternativas:** reserva interna al stock item; sin reservas en primer alcance; reserva por línea.
- **Preguntas:** ¿son necesarias?, ¿expiran?, ¿stock negativo?, ¿varias ubicaciones? DQ-023.

## Análisis especial

- **Diagnóstico:** puede ser parte de WorkOrder si sólo existe uno y comparte consistencia; puede separarse si hay múltiples evaluaciones, costo o ownership técnico distinto.
- **Recepción:** como snapshot preserva condición; como evento señala custodia; como entidad permite corrección e historial. Puede requerir las tres representaciones conceptuales sin que sean el mismo objeto.
- **Control de calidad:** puede pertenecer a Repair por criterios técnicos o a WorkOrder como gate de salida. La autoridad y repetición decidirán.
- **Pago:** una orden puede referenciar su estado financiero, pero no debe poseer ni mutar pagos.
- **Garantía:** la cobertura puede nacer del trabajo original; la reclamación candidata permanece separada.
