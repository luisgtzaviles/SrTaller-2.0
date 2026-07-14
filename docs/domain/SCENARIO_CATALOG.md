# Catálogo de escenarios de negocio

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Escenarios

Todos tienen estado Hypothesis. Given/When/Then describe negocio, no pasos de interfaz o pruebas técnicas.

| ID | Estado | Given / When / Then | Conceptos | Reglas | Eventos candidatos | Preguntas/evidencia requerida |
|---|---|---|---|---|---|---|
| SCENARIO-001 | Hypothesis | **Given** una persona no conocida entrega un teléfono; **When** recepción obtiene datos mínimos y condición; **Then** reconoce cliente, dispositivo, recepción y orden sin presumir propiedad. | Cliente, Device, Intake, Order | RULE-001–004 | EVENT-002/004–007 | DQ-004/005/007; caso real |
| SCENARIO-002 | Hypothesis | **Given** un cliente existente trae otro equipo; **When** se contrasta historial; **Then** se registra un dispositivo distinto y una nueva orden. | Customer, Device, Order | RULE-002/003 | EVENT-001/004/007 | DQ-005; evidencia de reconocimiento |
| SCENARIO-003 | Hypothesis | **Given** un equipo presenta varias fallas; **When** se evalúan; **Then** cada síntoma, hallazgo y alcance queda distinguido. | Failure, Diagnosis, Repair | RULE-006 | EVENT-010/011 | DQ-001/008/015 |
| SCENARIO-004 | Hypothesis | **Given** diagnóstico completado y cotización vigente; **When** persona autorizada aprueba; **Then** el alcance exacto queda autorizado. | Diagnosis, Quote, Authorization | RULE-006–008 | EVENT-011/014/016/020 | DQ-011; evidencia válida |
| SCENARIO-005 | Hypothesis | **Given** cotización vigente; **When** cliente la rechaza; **Then** no inicia trabajo y se resuelven devolución/costo/custodia. | Quote, Order, Delivery | RULE-008/018 | EVENT-018/009 o 038 | DQ-018/029 |
| SCENARIO-006 | Hypothesis | **Given** cotización con varias partidas; **When** sólo algunas se aprueban; **Then** la reparación y resultado quedan limitados. | QuoteLine, Authorization, Repair | RULE-008 | EVENT-017/020 | DQ-009/011; ejemplo parcial |
| SCENARIO-007 | Hypothesis | **Given** parte debe pedirse; **When** cliente deja anticipo; **Then** se registra pago aplicado sin inferir autorización adicional. | Deposit, Payment, Part | RULE-009/011 | EVENT-033/024 | DQ-012/023 |
| SCENARIO-008 | Hypothesis | **Given** reparación autorizada sin parte disponible; **When** se solicita/reserva; **Then** el trabajo espera sin declararse terminado. | Repair, Part, Reservation | RULE-011 | EVENT-023–025 | DQ-023; política de negativos |
| SCENARIO-009 | Hypothesis | **Given** técnico activo deja de estar disponible; **When** supervisor reasigna; **Then** se conserva handoff, responsables e intervenciones. | Assignment, Intervention | RULE-010/020 | EVENT-021/023 | DQ-013/015 |
| SCENARIO-010 | Hypothesis | **Given** alcance autorizado ejecutado; **When** técnico documenta resultado; **Then** la reparación termina y pasa a QC, no directamente a entrega. | Repair, QC | RULE-012 | EVENT-027/028 | DQ-016/028 |
| SCENARIO-011 | Hypothesis | **Given** reparación completada; **When** QC detecta falla; **Then** queda fallo y retrabajo sin borrar el primer resultado. | QC, Rework | RULE-012/020 | EVENT-030/031 | DQ-016; criterio de intentos |
| SCENARIO-012 | Hypothesis | **Given** equipo listo, receptor autorizado y política financiera satisfecha; **When** recepción entrega; **Then** custodia y evidencia quedan registradas. | Delivery, Balance, Evidence | RULE-013–015 | EVENT-036/038 | DQ-014/019/020 |
| SCENARIO-013 | Hypothesis | **Given** propietario autorizó a un tercero; **When** el tercero acredita su autorización; **Then** recibe sin adquirir otras facultades. | AuthorizedPickup, Delivery | RULE-015 | EVENT-038 | DQ-014; fallback por evidencia perdida |
| SCENARIO-014 | Hypothesis | **Given** equipo listo con saldo; **When** se solicita entrega; **Then** se rechaza o documenta excepción y seguimiento según decisión. | Balance, Delivery | RULE-013/014 | EVENT-038 sólo si procede | DQ-019; autoridad de crédito |
| SCENARIO-015 | Hypothesis | **Given** orden con trabajo/pago/custodia activos; **When** cliente cancela; **Then** efectos se resuelven y motivo queda trazable. | Cancellation, Payment, Custody | RULE-018/020 | EVENT-009/034/038 | DQ-029 |
| SCENARIO-016 | Hypothesis | **Given** diagnóstico no encuentra reparación viable; **When** se declara irreparable; **Then** se decide cobro, devolución y cierre sin fingir reparación. | Diagnosis, Order, Delivery | RULE-006/018 | EVENT-012/038/039 | DQ-008/018 |
| SCENARIO-017 | Hypothesis | **Given** dispositivo listo no se recoge; **When** vence plazo y se realizan avisos; **Then** continúa custodia hasta política válida de abandono. | Custody, Delivery | RULE-019 | EVENT-036; evento de aviso TBD | DQ-030; revisión legal |
| SCENARIO-018 | Hypothesis | **Given** equipo entregado dentro de cobertura; **When** cliente reporta posible falla cubierta; **Then** abre reclamación sin aceptarla aún. | Warranty, Claim, Reentry | RULE-016/017 | EVENT-041 | DQ-021/022 |
| SCENARIO-019 | Hypothesis | **Given** reclamación evaluada; **When** la evidencia queda fuera de cobertura; **Then** se rechaza con motivo y se ofrece siguiente ruta. | WarrantyClaim, Quote | RULE-016/017 | EVENT-043/044 | DQ-021; apelación/nueva oferta |
| SCENARIO-020 | Hypothesis | **Given** una sucursal recibió y otra hará el trabajo o entrega; **When** se autoriza transferencia; **Then** custodia, contexto, stock y responsabilidades cambian explícitamente. | Branch, Order, Delivery | RULE-020/021 | Eventos de transferencia TBD; EVENT-038 | DQ-002/031; caso real multisucursal |
| SCENARIO-021 | Hypothesis | **Given** cotización aprobada y anticipo; **When** aparece daño adicional; **Then** se crea versión, se solicita nueva decisión y se conserva aplicación financiera. | Quote, Authorization, Payment | RULE-007–009 | EVENT-015/014/016 o 018 | DQ-009/011/012 |
| SCENARIO-022 | Hypothesis | **Given** refacción aportada por cliente; **When** se instala y falla; **Then** procedencia, consumo y cobertura se distinguen del stock propio. | Part, Repair, Warranty | RULE-011/016 | EVENT-026/041 | DQ-010/021 |

## Uso posterior

Cada escenario debe contrastarse con evidencia de operación. Un test futuro podrá derivarse sólo después de resolver sus preguntas y fijar reglas; el texto actual no es criterio de aceptación de un PBI.
