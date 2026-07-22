# Trazabilidad del descubrimiento de dominio

## Estado documental

- **Estado:** Draft / Discovery con decisiones aceptadas enlazadas
- **Autoridad:** Las fuentes aceptadas son autoritativas sólo en su alcance; la cadena restante no está aprobada
- **Propietario de decisión:** Product Owner
- **Última revisión:** 2026-07-21
- **Próxima revisión:** Después de la entrevista de dominio

## Cadena objetivo

Product question
→ Domain question
→ Concept
→ Rule
→ Invariant
→ State transition
→ Command
→ Domain event
→ Scenario
→ Future PBI
→ Future ADR
→ Future test

Los tres últimos elementos permanecen TBD. No se crean PBIs, ADRs ni pruebas con esta documentación.

## Cadenas representativas

| Product question | Domain question | Concepto | Regla | Invariante | Transición | Comando | Evento | Escenario | Future PBI | Future ADR | Future test |
|---|---|---|---|---|---|---|---|---|---|---|---|
| QUESTION-013 | DQ-001 | WorkOrder/Repair | RULE-001 | INV-001/002 | Draft → Received | OpenWorkOrder | EVENT-007 | SCENARIO-001 | TBD | TBD | TBD |
| QUESTION-006–012 | DQ-002/003/025/031 | Branch/UserSession | RULE-021 | INV-002/008/010 | Orden confinada; contexto, identidad y sesión aceptados | intención técnica TBD | evento de contexto TBD | SCENARIO-020 | TBD | ADR-004, ADR-010 y ADR-011 Accepted | prueba de aislamiento/contexto/sesión pendiente |
| QUESTION-013 | DQ-004 | Customer/Owner | RULE-002/003 | INV-010 | N/A | RegisterCustomer | EVENT-001/002 | SCENARIO-001/002 | TBD | TBD | TBD |
| QUESTION-013 | DQ-007 | Intake | RULE-004/005 | INV-005 | Draft → Received | RecordIntake | EVENT-005/006 | SCENARIO-001 | TBD | TBD | TBD |
| QUESTION-014 | DQ-008/026 | Diagnosis | RULE-006 | INV-009 | InProgress → Completed | CompleteDiagnosis | EVENT-011/012 | SCENARIO-003/016 | TBD | TBD | TBD |
| QUESTION-014 | DQ-009 | Quote | RULE-007 | INV-012 | Issued → Superseded | ReviseQuote TBD | EVENT-015 | SCENARIO-021 | TBD | TBD | TBD |
| QUESTION-014/020 | DQ-011 | Authorization | RULE-008 | INV-006 | Issued → Approved | ApproveQuote | EVENT-016/020 | SCENARIO-004 | TBD | Messaging ADR si aplica TBD | TBD |
| QUESTION-021 | DQ-012 | Deposit/Payment | RULE-009 | INV-004/011 | Unpaid → PartiallyPaid | RecordPayment | EVENT-033 | SCENARIO-007 | TBD | TBD | TBD |
| QUESTION-013 | DQ-013 | Assignment | RULE-010 | INV-016 | Authorized → InProgress | AssignTechnician | EVENT-021 | SCENARIO-009 | TBD | TBD | TBD |
| QUESTION-015/016 | DQ-023 | Reservation | RULE-011 | INV-007/013 | InProgress → WaitingForPart | ReservePart | EVENT-025 | SCENARIO-008 | TBD | ADR-002/003 impacto TBD | TBD |
| QUESTION-013/014 | DQ-016/028 | QualityControl | RULE-012 | INV-009 | QC → ReadyForDelivery | RunQualityCheck | EVENT-029/036 | SCENARIO-010/011 | TBD | TBD | TBD |
| QUESTION-021 | DQ-019 | Balance | RULE-013/014 | INV-011/015 | Ready → Delivered | DeliverDevice | EVENT-035/038 | SCENARIO-012/014 | TBD | TBD | TBD |
| QUESTION-013 | DQ-014 | Delivery | RULE-015 | INV-005 | Ready → Delivered | DeliverDevice | EVENT-038 | SCENARIO-013 | TBD | TBD | TBD |
| QUESTION-014 | DQ-021/022 | WarrantyClaim | RULE-016/017 | INV-014 | Active → ClaimOpened | OpenWarrantyClaim | EVENT-041 | SCENARIO-018/019 | TBD | ADR-002 impacto TBD | TBD |
| QUESTION-013 | DQ-029 | Cancellation | RULE-018/020 | INV-009 | estado permitido → Cancelled | CancelWorkOrder TBD | EVENT-009 | SCENARIO-015 | TBD | TBD | TBD |
| QUESTION-025/030 | DQ-030 | Custody | RULE-019 | INV-005 | Ready permanece | intención de abandono TBD | evento TBD | SCENARIO-017 | TBD | revisión legal, no ADR por defecto | TBD |

## Matriz de preguntas y documentos de producto

| Preguntas de producto | Preguntas de dominio | Documentos de dominio | Documento de producto fuente |
|---|---|---|---|
| QUESTION-003/013/014 | DQ-001, DQ-007–011, DQ-013–018, DQ-020–022, DQ-026–029 | Workflow, Concepts, Rules, States, Interview | [Open Questions](../product/OPEN_QUESTIONS.md), [Scope](../product/PRODUCT_SCOPE.md) |
| QUESTION-006–008 | DQ-002/031 | Actors, Contexts, Relationships, Scenarios | [Module Map](../product/MODULE_MAP.md) |
| QUESTION-009–012 | DQ-003/006/025 | Language, Actors, Rules | [Actors](../product/ACTORS_AND_PERSONAS.md) |
| QUESTION-015/016 | DQ-010/023 | Concepts, Invariants, Aggregates | [Module Map](../product/MODULE_MAP.md) |
| QUESTION-021/022 | DQ-012/019 | States, Commands, Events | [Scope](../product/PRODUCT_SCOPE.md) |
| QUESTION-017–020 | DQ-011/024 | Contexts, Relationships, Decision Log | [Out of Scope](../product/OUT_OF_SCOPE.md) |
| QUESTION-025/030 | DQ-030 | Rules, Exceptions, Interview | [Principles](../product/PRODUCT_PRINCIPLES.md) |

## Matriz de conceptos, reglas y eventos

| Concepto | Reglas | Invariantes | Eventos | Escenarios |
|---|---|---|---|---|
| Customer/CustomerDevice | RULE-002/003 | INV-003/010 | EVENT-001–004 | SCENARIO-001/002 |
| Intake/WorkOrder | RULE-001/004/005 | INV-001/002/005 | EVENT-005–009 | SCENARIO-001/015/016 |
| Diagnosis | RULE-006 | INV-009 | EVENT-010–012 | SCENARIO-003/004/016 |
| Quote/Authorization | RULE-007/008 | INV-006/012 | EVENT-013–020 | SCENARIO-004–006/021 |
| Assignment/Repair/QC | RULE-010/012 | INV-009/016 | EVENT-021–031 | SCENARIO-008–011 |
| Part/Reservation | RULE-011 | INV-007/013 | EVENT-024–026 | SCENARIO-007/008/022 |
| Payment/Balance | RULE-009/013/014 | INV-004/011/015 | EVENT-032–035 | SCENARIO-007/012/014/021 |
| Delivery | RULE-015/019 | INV-005 | EVENT-036–039 | SCENARIO-012/013/017/020 |
| WarrantyClaim | RULE-016/017 | INV-014 | EVENT-040–044 | SCENARIO-018/019/022 |
| Audit/Branch | RULE-020/021 | INV-008/010 | todos los auditables | SCENARIO-009/015/020 |

## Modelos especializados y evidencia existente

Los IDs especializados organizan la validación sin crear nuevas reglas, invariantes, eventos, preguntas o escenarios canónicos.

| Área | Elementos especializados | Relación defendible existente | Evidencia pendiente | Documento |
|---|---|---|---|---|
| Tiempo de recepción y diagnóstico | TIME-MILESTONE-001–006, TIME-METRIC-001/002 | EVENT-005–012, DQ-007/008, SCENARIO-001/003/016 | inicio del reloj, registro tardío y pausas | [Timeline](DOMAIN_TIMELINE.md) |
| Tiempo de cotización y autorización | TIME-MILESTONE-007–011, TIME-METRIC-003 | EVENT-013–020/033, RULE-007–009, SCENARIO-004–007/021 | vigencia, promesa y momento efectivo | [Timeline](DOMAIN_TIMELINE.md) |
| Tiempo de refacciones e intervención | TIME-MILESTONE-012–022, TIME-METRIC-004–006 | EVENT-021–030, RULE-010–012, SCENARIO-008–011/022 | recepción de parte, reanudación y atribución de espera | [Timeline](DOMAIN_TIMELINE.md) |
| Tiempo de entrega, garantía y excepciones | TIME-MILESTONE-023–035, TIME-METRIC-007–011 | EVENT-032–044, RULE-013–019, SCENARIO-012–020 | promesa, cierre, expiración, abandono y transferencia | [Timeline](DOMAIN_TIMELINE.md) |
| Tipos y problemas temporales | TIME-TYPE-001–015, TIME-ISSUE-001–011 | RULE-016/019/020, INV-001/002/008/010, DQ-015/021/030/031 | semántica temporal y zona por alcance | [Timeline](DOMAIN_TIMELINE.md) |
| Dinero: oferta y decisión | MONEY-CONCEPT-001–008, MONEY-DIST-001/004–006, MONEY-CYCLE-001/002/008 | RULE-007–009, EVENT-013–020/033, SCENARIO-004–007/021 | nacimiento de obligación y efecto del anticipo | [Money Model](MONEY_MODEL.md) |
| Dinero: pago, saldo y reversas | MONEY-CONCEPT-009–025, MONEY-DIST-002/003/007–010, MONEY-CYCLE-003–010/012/013 | EVENT-032–035, INV-004/011/015, SCENARIO-012/014/015/018/021 | aplicación, deuda, reembolso, contracargo y moneda | [Money Model](MONEY_MODEL.md) |
| Dinero: caja y separación SaaS | MONEY-CONCEPT-026–032, MONEY-DIST-011/012, MONEY-CYCLE-011 | Q022–Q025, DOMAIN-FINDING-011/012, SCENARIO-020 | sesión, conciliación y autoridad financiera | [Money Model](MONEY_MODEL.md) |
| Inventario: conceptos y distinciones | INVDOM-CONCEPT-001–033, INVDOM-DIST-001–011 | DQ-002/010/023/031, INV-007/013, EDGE-021/022/024/025 | lenguaje, alcance, costo y procedencia | [Inventory Domain](INVENTORY_DOMAIN.md) |
| Inventario: casos y consistencia | INVDOM-CASE-001–017, INVDOM-CONS-001–010 | EVENT-024–026, SCENARIO-008/018/020/022, RULE-020 | reserva concurrente, recepción, transferencia y garantía de proveedor | [Inventory Domain](INVENTORY_DOMAIN.md) |

## Ownership y decisiones terminológicas

| Grupo | Filas | Contextos/preguntas relacionados | Conflicto o validación pendiente | Documento |
|---|---|---|---|---|
| Organización, identidad y clientes | OWN-001–011 | Tenant, Branch, IAM, Customer; DQ-002–006 | ADR-004 fija usuario por tenant y cliente por sucursal; corrección y autenticación siguen abiertas | [Propiedad](OWNERSHIP_MATRIX.md) |
| Recepción y operación técnica | OWN-012–021 | Repair, Diagnosis, Quote; DQ-001/007–009/013/018/026 | estado general frente a estados especializados | [Ownership](OWNERSHIP_MATRIX.md) |
| Inventario y dinero | OWN-022–030, OWN-038–043 | Inventory, Payments, Cash; DQ-010/012/019/023 | existencia/disponibilidad, pieza/consumo, saldo/caja | [Ownership](OWNERSHIP_MATRIX.md) |
| Entrega, garantía y comunicación | OWN-031–036 | Delivery, Warranty, Messaging, Audit; DQ-014/020–025 | custodia/cierre, caso de garantía y conversación multicanal | [Ownership](OWNERSHIP_MATRIX.md) |
| Suscripción SaaS | OWN-037 | Subscription Billing, Tenant; Q023–Q025 | separación de pagos operativos | [Ownership](OWNERSHIP_MATRIX.md) |
| Ambigüedades operativas | TERM-DEC-001–011, TERM-DEC-016–018 | DOMAIN-FINDING-001/004/009/010, DQ-001/002/004/008–010/013/018/021/022 | significado y alcance todavía pendientes | [Glossary Decisions](DOMAIN_GLOSSARY_DECISIONS.md) |
| Dispositivos, finanzas y comunicación | TERM-DEC-012–015 | DOMAIN-FINDING-003/006/011/012, Q011–Q025 | homónimos entre capacidades distintas | [Glossary Decisions](DOMAIN_GLOSSARY_DECISIONS.md) |
| Mecanismo de decisión | TERM-RULE-001–008 | UBIQUITOUS_LANGUAGE y aprobadores indicados | evidencia, fecha y consecuencia antes de cambiar estado | [Glossary Decisions](DOMAIN_GLOSSARY_DECISIONS.md) |

## Sesiones de Event Storming

| Sesión | Recorrido | Escenarios existentes | Evidencia que busca | Salidas candidatas |
|---|---|---|---|---|
| ESW-SESSION-001 | llegada, identidad y custodia | SCENARIO-001/002/013 | actores, ownership y evidencia de recepción | ESW-OUTPUT-001/002/008 |
| ESW-SESSION-002 | síntoma, diagnóstico y oferta | SCENARIO-003/004/016 | orden temporal, vocabulario y decisiones | ESW-OUTPUT-001–004 |
| ESW-SESSION-003 | decisión, anticipo y cambios | SCENARIO-004–007/021 | autoridad, prueba de consentimiento y efecto financiero | ESW-OUTPUT-002–005 |
| ESW-SESSION-004 | partes, asignación e intervención | SCENARIO-008/009/022 | reserva, consumo, responsabilidad y excepciones | ESW-OUTPUT-001–006 |
| ESW-SESSION-005 | calidad y retrabajo | SCENARIO-010/011 | criterio observable de QC y retorno al trabajo | ESW-OUTPUT-001–004 |
| ESW-SESSION-006 | cobro, salida y cierre | SCENARIO-012–015/017 | saldo, receptor, entrega y cierre | ESW-OUTPUT-001–005/008 |
| ESW-SESSION-007 | garantía, regreso y abandono | SCENARIO-017–019/022 | cobertura, caso relacionado y custodia | ESW-OUTPUT-001–006/008 |
| ESW-SESSION-008 | operación multisucursal | SCENARIO-020 | procedencia, transferencia y autoridades por alcance | ESW-OUTPUT-004–008 |

## Relación con PBIs existentes

| PBI existente | Relación actual | Evidencia de dominio que aporta | Estado de esta relación |
|---|---|---|---|
| PBI-002 | Actores y contextos operativos | DOMAIN_ACTORS, Interview | Propuesta; PBI sigue Draft |
| PBI-003 | Alcance y exclusiones | Workflow y contextos muestran cortes posibles | Propuesta; requiere PO |
| PBI-004 | Glosario | UBIQUITOUS_LANGUAGE amplía términos/ambigüedades | Propuesta; no modifica glosario original |
| PBI-005 | Mapa modular | Bounded Contexts y Relationships prueban ownership | Propuesta; límites no aprobados |
| PBI-006 | Lecciones legacy | Findings evita elevar observaciones a reglas | Propuesta; evidencia legacy pendiente |
| PBI-008/009 | Identidad, sucursales y estación autorizada | separación de actores/estación y RULE-021 | Contexto aceptado por ADR-010 e identidad/PIN/sesión por ADR-011; mecanismos abiertos |
| PBI-020 | Preguntas y gates | Domain Questions y Decision Log refinan Gate 4 | Propuesta; no cierra preguntas |

## Paquetes de validación posteriores

Los paquetes de esta sección pueden tener autoridad posterior y más específica que el discovery inicial. Su existencia no cambia silenciosamente el estado de conceptos, reglas o preguntas canónicas: cada promoción requiere reconciliación explícita.

| Paquete | Autoridad | Áreas aclaradas | Elementos canónicos relacionados | Estado de promoción |
|---|---|---|---|---|
| [ADR-004 — Multitenancy con base y esquema compartidos](../decisions/proposed/ADR-004-shared-schema-multitenancy.md) | Decisión aceptada por el Responsable de Producto, 2026-07-21 | propiedad SaaS/tenant/sucursal, usuario con alcance tenant, cliente con alcance sucursal, Orden inmutable por sucursal, catálogos y precios por nivel | QUESTION-006–009, DQ-002/004/006/031, RULE-001/021, INV-002/010, OWN-001–011 | Autoritativo para propiedad y aislamiento; identidad técnica, estación, soporte, BI y ciclo del tenant permanecen separados |
| [ADR-010 — Contexto operativo derivado de estación vinculada](../decisions/proposed/ADR-010-station-bound-operational-context.md) | Decisión aceptada por el Responsable de Producto, 2026-07-21 | estación vinculada, tenant/sucursal derivados, usuario por tenant, cambio de turno y atribución contextual | QUESTION-007–012, DQ-002/031, RULE-021, INV-002/008/010, FOT-DEC-018–020 | Autoritativo para contexto operativo; identidad/sesión se rigen por ADR-011 y permisos, auditoría detallada y mecanismo de vinculación permanecen separados |
| [ADR-011 — Identidad, autenticación por PIN y sesión operativa](../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md) | Decisión aceptada por el Responsable de Producto, 2026-07-21 | identidad ordinaria, PIN contextual, autenticación, una sesión activa por estación e inactividad | QUESTION-009/012, DQ-003/006/025, RULE-021, INV-008/010, FOT-DEC-018–020 | Autoritativo para identidad/sesión conceptual; mecanismos, permisos, acciones sensibles y auditoría técnica permanecen separados |
| [Modelo integrado del dominio de reparaciones](../domain-model/integrated-repair-domain-model/README.md) | Consolidación de autoridad; no crea aprobación adicional, 2026-07-21 | visión completa del ciclo, contextos, candidatos, eventos, políticas, invariantes, escenarios, tensiones y preguntas | RMCA, FOT, DTR, CSE, `LEGACY-*`, DQ/RULE/INV/EVENT y propuestas arquitectónicas | Referencia maestra de integración; fuentes originales conservan autoridad y propuestas permanecen abiertas |
| [Recepción mínima y autorización comercial](../domain-validation/reception-minimum-and-commercial-authorization/README.md) | Decisiones explícitas del Product Owner, 2026-07-21 | nacimiento de orden/custodia, mínimos, identificación física, problema reportado, conceptos autorizables y políticas de absorción | DQ-001/007–009/011/019/022, DOMAIN-DECISION-001/004/005/009, TERM-DEC-001/004/005, RULE-006–009, INV-005/006/008/012 | Validado en su alcance; pendiente de promoción canónica |
| [Flujo operativo y trazabilidad](../domain-validation/operational-workflow-and-traceability/README.md) | Hechos y decisiones explícitas del Product Owner, 2026-07-21 | recorrido Avicell, estado/ubicación/custodia, roles, segunda revisión, eventos/notas/actividad, atribución, asignaciones y anticipos básicos | DQ-002/012–020/024/025/027–031, TERM-DEC-007/008/016, EVENT-008/010–012/021–023/027–033/036/038, STATE_MACHINES | Validado en hechos locales; propuestas universales y promoción canónica pendientes |
| [Diagnóstico y recomendaciones técnicas](../domain-validation/future-state-diagnosis-and-technical-recommendations/README.md) | Hechos explícitos del Product Owner y organización futura, 2026-07-21 | conclusión técnica, baja fricción, recomendaciones, descubrimientos posteriores y frontera con cotización | DQ-008/009/011/015/026, DOMAIN-DECISION-004/005, RULE-006–008, INV-006/008/009/012/016, EVENT-010–020, STATE_MACHINES | Hechos y separaciones validados; iteraciones, versiones y promoción canónica pendientes |

## Candidatos futuros sin crear backlog

| Resultado futuro posible | Candidato | Estado |
|---|---|---|
| PBI | Validar recorrido recepción–entrega con ejemplos aprobados | TBD; no creado |
| PBI | Validar cotización/autorización y excepciones | TBD; no creado |
| PBI | Validar entrega, pago y garantía | TBD; no creado |
| ADR | Definir límites durables de Repair/Quote/Payment/Warranty | TBD; no creado |
| Prueba | Escenarios de dominio derivados de catálogo aprobado | TBD; no creada |

## Regla de mantenimiento

Si cambia una respuesta, se revisan en orden concepto, regla, invariante, transición, comando, evento y escenarios antes de proponer trabajo técnico. Ningún enlace a un PBI existente significa que sus criterios estén satisfechos.
