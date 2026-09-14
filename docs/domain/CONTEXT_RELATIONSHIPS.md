# Relaciones candidatas entre contextos

## Estado documental

- **Estado:** Draft / Discovery general; Catalog/Pricing relationships accepted
  only as stated in PRICE_LIST_ARCHITECTURE.
- **Propietario de decisión:** Product Owner
- **Última revisión:** 2026-09-13
- **Próxima revisión:** Después de la entrevista de dominio

## Context map preliminar

Las flechas indican suministro conceptual de hechos o referencias, no dependencias de código.

~~~mermaid
flowchart LR
    Tenant[Tenant Administration] --> Branch[Branch Operations]
    Tenant --> IAM[Identity and Access]
    Customer[Customer Management] --> Repair[Repair Operations]
    Branch --> Repair
    IAM --> Repair
    Repair --> Diagnosis[Technical Diagnosis]
    Diagnosis --> Quote[Quoting and Authorization]
    Tenant --> Catalog[Catalog and Pricing]
    Branch --> Catalog
    SupplierEvidence[External supplier evidence] --> Catalog
    Catalog --> Quote
    Catalog --> Inventory
    Quote --> Repair
    Repair --> Inventory[Inventory]
    Quote --> Payments[Payments]
    Payments --> Cash[Cash Management]
    Repair --> Delivery[Delivery]
    Payments --> Delivery
    Delivery --> Warranty[Warranty]
    Repair --> Warranty
    Customer --> Messaging[Messaging]
    Repair --> Notifications[Notifications]
    Messaging --> Notifications
    Subscription[Subscription Billing] --> Tenant
    Repair --> Audit[Audit]
    Payments --> Audit
    Warranty --> Audit
~~~

## Relaciones

| Upstream candidato | Downstream candidato | Información compartida | Eventos posibles | Dependencia temporal | Consistencia | Riesgo de acoplamiento | Integración conceptual propuesta |
|---|---|---|---|---|---|---|---|
| Tenant Administration | Branch Operations | tenant activo y alcance | TenantStateChanged TBD | al crear/suspender | inmediata para nuevas acciones | Branch modifica tenant | referencia estable + lenguaje publicado |
| Tenant/Branch | Identity and Access | organización y sucursales válidas | BranchStateChanged TBD | al autorizar | inmediata | IAM copia reglas operativas | Customer/Supplier propuesto |
| Identity and Access | todos los comandos | actor, capacidades, alcance efectivo y evidencia reforzada cuando aplique | AsignacionDeRolRevocada TBD | en cada intención protegida | inmediata | dominio conoce roles concretos | autorización contextual conforme a ADR-012 y refuerzo de acciones sensibles conforme a ADR-013 |
| Customer Management | Repair Operations | referencia de cliente/propietario/contacto | EVENT-001–004 | antes o durante recepción | inmediata para referencia; cambios posteriores eventuales | Repair edita cliente | Customer/Supplier propuesto |
| Branch Operations | Repair/Inventory/Delivery | sucursal de origen, operación y ubicación | TransferRequested TBD | en apertura/transferencia | inmediata en pertenencia; workflow coordinado | branch_id uniforme sin significado | Published Language propuesto |
| Repair Operations | Technical Diagnosis | orden, dispositivo, falla, alcance | EVENT-005–010 | antes de evaluar | inmediata en inicio | diagnóstico se vuelve nota interna | límite por intención y resultado |
| Technical Diagnosis | Quoting | conclusión, hallazgos y alternativas | EVENT-011/012 | antes de cotizar cuando aplique | puede ser eventual | Quoting interpreta detalle técnico | Published Language propuesto |
| Tenant/Branch | Catalog and Pricing | moneda Tenant y Branch confiable | configuración/ciclo futuro mínimo | en resolución de precio | inmediata | catálogo acepta scope del cliente | contratos públicos de contexto |
| External supplier evidence | Catalog and Pricing | texto/costo/código opcional observado por versión | ninguno autoritativo de dominio | al componer una versión | evidencia inmutable; reconciliación humana | proveedor externo define identidad o clasificación | Anti-Corruption Layer: SupplierListing→resolution→CatalogItem |
| Catalog and Pricing | Quote/Repair/Sales | item y precio efectivo/revision | revisión publicada futura | al seleccionar | resolver vigente; consumidor guarda snapshot | operación apunta a precio vivo | resolver + snapshot propio |
| Catalog and Pricing | Inventory/Procurement | identidad/clasificación/identificadores | item lifecycle futuro | al referenciar | contrato explícito | compartir catálogo/tablas/costo | CatalogItemReader; owners separados |
| Procurement futuro | Catalog and Pricing | relación Supplier propio→SupplierSource mínimo | contrato futuro | al integrar compras | sin escritura cruzada | SupplierSource adquiere contactos/compras/costo contable | mapping por contrato; ownership separado |
| Quoting | Repair Operations | versión, decisión y alcance autorizado | EVENT-014–020 | antes de trabajo sujeto a autorización | inmediata para iniciar | llamadas recíprocas | eventos de decisión + referencia |
| Repair Operations | Inventory | necesidad, reserva y consumo | EVENT-024–026 | durante planificación/trabajo | reserva/consumo inmediatos en Inventory; vista eventual en Repair | cada lado cambia al otro | orquestación por intención, no ownership compartido |
| Quoting | Payments | obligación aprobada o cobrable | EVENT-016/017 | antes de aplicar pago | inmediata dentro de Payments; sincronización explícita | pago incrustado en cotización | referencia a obligación publicada |
| Payments | Cash Management | pago en efectivo, devolución | EVENT-032–034 | al registrar valor físico | coordinación inmediata según medio | duplicar importe como dos verdades | eventos + reconciliación |
| Repair/Payments | Delivery | listo, custodia y saldo/ excepción | EVENT-029/035/036 | justo antes de entrega | decisión inmediata con hechos vigentes | Delivery consulta internals | política local con vistas autorizadas |
| Delivery | Warranty | entrega, trabajo cubierto y fecha | EVENT-038/040 | al iniciar cobertura | puede coordinarse después sin prometer antes | Warranty reabre orden | evento de entrega + referencia |
| Customer/Repair | Messaging/Notifications | contacto, propósito, referencia de orden | EVENT-014/036/038 | asíncrona | eventual | mensaje se vuelve autorización implícita | Anti-Corruption Layer hacia canal externo |
| Subscription Billing | Tenant Administration | estado comercial permitido | SubscriptionStateChanged TBD | al cambiar acceso | inmediata para nuevas acciones; jobs requieren política | billing invade dominio operativo | Published Language reducido |
| Todos | Audit | actor, hecho, motivo y referencia mínima | eventos auditables | después de preservar hecho local | eventual con garantía de no pérdida por definir | Audit se vuelve base paralela | consumidor de hechos, no Shared Kernel |

## Uso prudente de patrones DDD

- **Customer/Supplier, propuesta:** aplica cuando el upstream posee un concepto y el downstream consume una representación acordada, como Customer → Repair. Falta autoridad conjunta.
- **Published Language, propuesta:** puede reducir ambigüedad en hechos de tenant, sucursal, diagnóstico o suscripción. No implica un formato técnico definido.
- **Anti-Corruption Layer, propuesta:** tiene justificación frente a canales, procesadores y proveedores externos para que su vocabulario no determine el dominio.
- **Conformist:** no se propone entre contextos internos; aceptar sin traducción el modelo de un proveedor sólo podría evaluarse si su contrato domina legítimamente y el costo es consciente.
- **Shared Kernel:** no se recomienda ahora. Compartir identificadores o Money no justifica ownership conjunto; un kernel requiere gobierno estable todavía inexistente.

## Dependencias críticas

Quoting → Repair, Repair ↔ Inventory, Payments → Delivery y Delivery → Warranty necesitan ejemplos reales. La consistencia inmediata debe permanecer local al propietario; la coordinación entre propietarios debe expresar incertidumbre y recuperación, sin que un evento técnico sea una decisión de negocio.
