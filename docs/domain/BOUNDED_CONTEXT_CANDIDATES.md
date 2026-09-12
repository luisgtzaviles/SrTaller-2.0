# Candidatos a contextos delimitados

## Estado documental

- **Estado:** Draft / Discovery general; Catalog/Pricing boundary accepted.
- **Autoridad:** Price List row approved under PLD decisions; remaining rows
  retain their prior status.
- **Propietario de decisión:** Product Owner
- **Última revisión:** 2026-09-11
- **Próxima revisión:** Después de la entrevista de dominio

## Advertencia

Un contexto candidato delimita lenguaje y ownership; no equivale a microservicio, paquete, aplicación o módulo implementado. La clasificación Core/Supporting/Generic/TBD es una propuesta para discusión.

| Contexto | Clase propuesta | Propósito y lenguaje propio | Conceptos propios candidatos | Compartidos por referencia | Límites | Entradas | Salidas/eventos | Dependencias | Riesgo de acoplamiento | Preguntas |
|---|---|---|---|---|---|---|---|---|---|---|
| Tenant Administration | Supporting | ciclo organizacional: tenant, alta, suspensión | Tenant, estado organizacional, configuración base | suscripción comercial, sucursal, usuario de tenant | no decide operación ni billing | decisión de alta/estado | TenantActivated/Suspended TBD | Subscription, Audit | convertir tenant en objeto global compartido | Q005/Q023 |
| Identity and Access | Generic/Supporting TBD | usuario de tenant, rol, permiso, sesión | usuario, autenticación, autorización efectiva | tenant, sucursal, estación | no decide reglas de reparación ni sucursal efectiva | solicitud de acceso/cambio | acceso concedido/denegado TBD | Tenant, Branch, Audit | roles reflejando puestos o contexto | Q009–Q012 |
| Branch Operations | Supporting | sucursal, vinculación de estación, contexto operativo | Sucursal, estación, alcance, historial de vinculación | orden, stock, caja | no posee clientes ni reparaciones por defecto | vincular/desvincular estación | StationLinked/Unlinked TBD | Tenant, IAM | usar branch como frontera tenant | DQ-002 |
| Customer Management | Supporting/Core TBD | cliente, contacto, propietario, preferencia | Cliente, contactos y relaciones | dispositivo, orden, conversación | no posee la orden ni autorización técnica | identificación/corrección | EVENT-001/002/003 | Tenant, Audit | convertirse en CRM genérico | DQ-004 |
| Repair Operations | Core domain | orden, reparación, intervención, progreso | WorkOrder, Repair, intervención, asignación | cliente, dispositivo, cotización, pago | no posee pago, stock ni identidad | recepción, autorización, disponibilidad | EVENT-007–009, 020–031, 036/039 | Customers, Diagnosis, Quote, Inventory, Payments, Delivery | agregado gigante y orquestación implícita | DQ-001/018 |
| Technical Diagnosis | Core domain TBD | falla, hallazgo, diagnóstico, prueba | Diagnosis, Finding | orden, dispositivo, técnico | no fija precio ni autoriza trabajo | falla/condición | EVENT-010/011/012 | Repair, IAM | mezclar síntoma con conclusión | DQ-008/026 |
| Quoting and Authorization | Core domain TBD | versión, partida, oferta, decisión | Quote, QuoteVersion, Authorization | orden, diagnóstico, cliente | no registra pago ni ejecuta reparación | diagnóstico, catálogo, decisión | EVENT-013–020 | Repair, Customers, Inventory/Services | autorización dependiente de mensajes | DQ-009/011 |
| Catalog and Pricing | Supporting; Accepted for EPIC-015 | item, tipo/capability, identifier, base/override/reference cost, import | CatalogItem, CommercialCategory/Brand, PriceRevision, ImportBatch | tenant currency, branch, actor | no posee stock, Supplier/compra, Repair Concept, venta/pago/Caja | alta/edición/import reconciliado | readers/resolver/snapshot/eventos mínimos futuros | Tenancy, Branch context, Users, Access, Audit | convertirlo en inventario o shared tables | PLD-001–008/018 |
| Inventory | Supporting/Core TBD | existencia, reserva, movimiento, valuación | Stock, Reservation, Movement | CatalogItem, sucursal, orden | no decide identidad comercial, precio final ni Reference Cost | solicitud/reserva/consumo | EVENT-024/025/026 | Catalog, Branch, Repair, Audit | llamadas recíprocas con Repair | DQ-010/023 |
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
