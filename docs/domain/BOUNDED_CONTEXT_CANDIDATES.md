# Candidatos a contextos delimitados

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Advertencia

Un contexto candidato delimita lenguaje y ownership; no equivale a microservicio, paquete, aplicación o módulo implementado. La clasificación Core/Supporting/Generic/TBD es una propuesta para discusión.

| Contexto | Clase propuesta | Propósito y lenguaje propio | Conceptos propios candidatos | Compartidos por referencia | Límites | Entradas | Salidas/eventos | Dependencias | Riesgo de acoplamiento | Preguntas |
|---|---|---|---|---|---|---|---|---|---|---|
| Tenant Administration | Supporting | ciclo organizacional: tenant, alta, suspensión | Tenant, estado organizacional, configuración base | suscripción, sucursal, membresía | no decide operación ni billing | decisión de alta/estado | TenantActivated/Suspended TBD | Subscription, Audit | convertir tenant en objeto global compartido | Q005/Q023 |
| Identity and Access | Generic/Supporting TBD | identidad, membresía, rol, permiso, sesión | identidad, membresía, autorización efectiva | tenant, sucursal, dispositivo autorizado | no decide reglas de reparación | solicitud de acceso/cambio | acceso concedido/denegado TBD | Tenant, Branch, Audit | roles reflejando puestos o módulos | Q009–Q012 |
| Branch Operations | Supporting | sucursal, asignación, contexto operativo | Sucursal, alcance, transferencia operativa | orden, stock, caja | no posee clientes ni reparaciones por defecto | estructura y reasignación | BranchContextChanged TBD | Tenant, IAM | usar branch como frontera tenant | DQ-002 |
| Customer Management | Supporting/Core TBD | cliente, contacto, propietario, preferencia | Cliente, contactos y relaciones | dispositivo, orden, conversación | no posee la orden ni autorización técnica | identificación/corrección | EVENT-001/002/003 | Tenant, Audit | convertirse en CRM genérico | DQ-004 |
| Repair Operations | Core domain | orden, reparación, intervención, progreso | WorkOrder, Repair, intervención, asignación | cliente, dispositivo, cotización, pago | no posee pago, stock ni identidad | recepción, autorización, disponibilidad | EVENT-007–009, 020–031, 036/039 | Customers, Diagnosis, Quote, Inventory, Payments, Delivery | agregado gigante y orquestación implícita | DQ-001/018 |
| Technical Diagnosis | Core domain TBD | falla, hallazgo, diagnóstico, prueba | Diagnosis, Finding | orden, dispositivo, técnico | no fija precio ni autoriza trabajo | falla/condición | EVENT-010/011/012 | Repair, IAM | mezclar síntoma con conclusión | DQ-008/026 |
| Quoting and Authorization | Core domain TBD | versión, partida, oferta, decisión | Quote, QuoteVersion, Authorization | orden, diagnóstico, cliente | no registra pago ni ejecuta reparación | diagnóstico, catálogo, decisión | EVENT-013–020 | Repair, Customers, Inventory/Services | autorización dependiente de mensajes | DQ-009/011 |
| Inventory | Supporting/Core TBD | producto, existencia, reserva, movimiento | Product, Stock, Reservation, Movement | sucursal, orden, refacción | no decide reparación ni precio final | solicitud/reserva/consumo | EVENT-024/025/026 | Branch, Repair, Audit | llamadas recíprocas con Repair | DQ-010/023 |
| Payments | Supporting | obligación, aplicación, pago, reembolso, saldo | Payment, application, financial status | orden, cotización, sucursal | no posee caja física ni billing SaaS | cobro/reembolso | EVENT-032–035 | Quote, Cash, Audit | escribir estados de Repair directamente | DQ-012/019 |
| Cash Management | Supporting | caja, sesión, conteo, movimiento, diferencia | CashRegister/Session/Movement TBD | pago, sucursal, operador | no decide obligación o reparación | pago en efectivo, apertura/cierre | CashMovementRecorded TBD | Payments, Branch, IAM | confundir pago con movimiento | Q022, FINDING-011 |
| Delivery | Core/Supporting TBD | listo, programación, receptor, custodia, evidencia | Delivery, RecipientEvidence | orden, dispositivo, saldo, garantía | no determina saldo ni cobertura | EVENT-029/035, solicitud de salida | EVENT-036/037/038 | Repair, Payments, Customers | leer/escribir toda la orden | DQ-014/020 |
| Warranty | Core/Supporting TBD | cobertura, vigencia, reclamación, resolución | WarrantyCoverage, WarrantyClaim | orden original, reparación, parte | no reescribe historial original | entrega/reclamo/diagnóstico | EVENT-040–044 | Repair, Diagnosis, Quote, Inventory | convertir todo reingreso en garantía | DQ-021/022 |
| CRM | Supporting, Later | seguimiento, oportunidad, segmento, actividad | TBD después de problema validado | cliente, conversación, orden | no absorbe Customers/Repair/Messaging | hechos permitidos | seguimiento TBD | Customers, Messaging | contexto sin problema concreto | Q017 |
| Messaging | Supporting, Later | conversación, mensaje, canal, entrega | Conversation, Message, DeliveryAttempt | cliente, orden, autorización como referencia | no decide autorización por sí mismo | solicitud de envío/webhook | MessageReceived/Sent TBD | Customers, Integrations, Audit | proveedor contaminando dominio | Q018–Q020 |
| Notifications | Generic/Supporting | plantilla, audiencia, preferencia, aviso | Notification, delivery policy | eventos y contactos mínimos | no conserva conversación ni hecho original | evento confirmado | aviso enviado/fallido TBD | todos los productores, Messaging | dependencia de todos con todos | Q017–Q020 |
| Audit | Generic/Supporting | actor, acción, objetivo, motivo, evidencia | AuditRecord/policy TBD | referencias a todos los contextos | no es log ni fuente de estado de negocio | hechos auditables | evidencia consultable | IAM y todos | duplicar contenido sensible | DQ-025 |
| Subscription Billing | Supporting | plan, suscripción, entitlement, ciclo comercial SaaS | Subscription, Plan, commercial status | tenant | no registra pagos del taller | oferta/cobro SaaS | SubscriptionStateChanged TBD | Tenant, external billing, Audit | contaminar operación con planes hipotéticos | Q023–Q025 |

## Contextos y dominio central

Repair Operations es el candidato más claro a Core por la visión actual, pero su alcance no está validado. Diagnosis, Quoting/Authorization, Delivery y Warranty podrían ser partes del mismo contexto o contextos distintos según diferencias de lenguaje, ownership y ritmo de cambio. Inventory puede ser Supporting para una reparación mínima o parte central de una operación completa. Ninguna clasificación está aprobada.

## Condiciones para separar

Se considerará un límite cuando haya lenguaje diferente, reglas propias, autoridad clara, ciclo independiente o necesidad real de consistencia. No se separará sólo porque existe una pantalla, una tabla imaginable o un evento.
