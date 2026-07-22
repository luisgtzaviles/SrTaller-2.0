# Estado del descubrimiento del dominio

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** ADR-004/010/011/012/013 en sus alcances; el resto del discovery no está aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Criterio

Los niveles permitidos son Unknown, Initial hypothesis, Partially understood, Validated by Product Owner y Approved. Esta matriz nació como fotografía de discovery; ADR-004, ADR-010, ADR-011, ADR-012 y ADR-013 validan únicamente las reglas organizacionales, de contexto, identidad/sesión y autorización ordinaria/reforzada que declaran. El resto de la evidencia no eleva por sí sola su autoridad.

## Matriz de conocimiento

| Área | Nivel de conocimiento | Evidencia | Principales dudas | Riesgo de modelo incorrecto | ¿Entrevista? | Estado |
|---|---|---|---|---|---|---|
| Clientes | Initial hypothesis | Glosario, módulo Customers, Q013 | identidad, duplicados, alcance por sucursal | Alto | Sí | Abierto |
| Dispositivos de clientes | Initial hypothesis | Glosario, Gate 4 | ownership, identificación, historial | Alto | Sí | Abierto |
| Recepción | Initial hypothesis | Q013 y flujo propuesto | evidencia, accesorios, firma, folio | Alto | Sí | Abierto |
| Órdenes de trabajo | Initial hypothesis | Repairs, Q013 | diferencia con reparación, inicio y cierre | Crítico | Sí | Abierto |
| Diagnóstico | Initial hypothesis | Q014 | costo, autor, múltiples diagnósticos | Alto | Sí | Abierto |
| Cotización | Initial hypothesis | Q014 | versiones, vigencia, alternativas | Crítico | Sí | Abierto |
| Autorización | Initial hypothesis | Q014 | actor, evidencia, parcialidad | Crítico | Sí | Abierto |
| Reparación | Initial hypothesis | Alcance y módulo Repairs | estados, pausas, reingreso | Crítico | Sí | Abierto |
| Técnicos | Partially understood | Actores preliminares | asignación, supervisión, multi-sucursal | Alto | Sí | Abierto |
| Refacciones | Initial hypothesis | Módulo Inventory | ownership, refacción del cliente, compatibilidad | Alto | Sí | Abierto |
| Inventario | Initial hypothesis | Q015–Q016 | reservas, negativos, ubicación, costo | Crítico | Sí | Abierto |
| Pagos | Initial hypothesis | Q021, Payments | anticipos, parcialidades, devoluciones | Crítico | Sí | Abierto |
| Caja | Unknown | Q022 | caja, terminal, turno y responsable | Crítico | Sí | Abierto |
| Entrega | Initial hypothesis | Q013 y Q021 | saldo, tercero, evidencia, cierre | Crítico | Sí | Abierto |
| Garantía | Initial hypothesis | Q014 | inicio, cobertura, caso o reapertura | Crítico | Sí | Abierto |
| Sucursales | Partially understood | ADR-004/010, Q006–Q008 | ciclo de vida y transferencias de negocio | Crítico | Sí | Parcialmente resuelto |
| Usuarios y autorización | Partially understood | ADR-004/010/011/012/013, Q009–Q012 | composición/clasificación por rebanada, recuperación, mecanismos técnicos y correlación | Alto | Sí | Parcialmente resuelto |
| Estaciones operativas | Partially understood | ADR-010/011, Q011–Q012 | mecanismo de vinculación, protección de PIN y revocación técnica | Crítico | Sí | Parcialmente resuelto |
| CRM | Unknown | Q017 y alcance Later | problema concreto y ownership | Medio | Sí | Diferible |
| Mensajería | Initial hypothesis | Q018–Q020, arquitectura realtime | canal, consentimiento, conversación | Alto | Sí | Diferible |
| Suscripciones SaaS | Initial hypothesis | Q023–Q025 | estados comerciales, retención, planes | Alto | Sí | Fuera del flujo central |
| Validación por Event Storming | Initial hypothesis | EVENT_STORMING_WORKSHOP | participantes, secuencia real, hotspots y evidencia | Alto | Sí | Preparado |
| Temporalidad del dominio | Initial hypothesis | DOMAIN_TIMELINE, eventos existentes | hitos, zonas, pausas, promesas y métricas | Alto | Sí | Abierto |
| Modelo de dinero especializado | Initial hypothesis | MONEY_MODEL, Payments, Q021–Q022 | obligación, aplicación, caja, reembolsos | Crítico | Sí | Abierto |
| Inventario especializado | Initial hypothesis | INVENTORY_DOMAIN, Q015–Q016 | consistencia, costo, transferencias, piezas externas | Crítico | Sí | Abierto |
| Ownership de información | Initial hypothesis | OWNERSHIP_MATRIX, DOMAIN-FINDING-004/008 | autoridad semántica, alcance y corrección | Crítico | Sí | Abierto |
| Decisiones terminológicas | Unknown | DOMAIN_GLOSSARY_DECISIONS | todos los registros permanecen pendientes | Alto | Sí | Abierto |

## Resumen cuantitativo

| Nivel | Áreas | Porcentaje aproximado |
|---|---:|---:|
| Unknown | 3 | 11.1 % |
| Initial hypothesis | 20 | 74.1 % |
| Partially understood | 4 | 14.8 % |
| Validated by Product Owner | 0 | 0 % |
| Approved | 0 | 0 % |
| **Total** | **27** | **100 %** |

## Hechos y límites actuales

- **Hecho conocido:** SR Taller 2.0 se documenta como SaaS multitenant para talleres de reparación.
- **Hecho conocido:** ADR-002, ADR-004, ADR-010, ADR-011, ADR-012 y ADR-013 están aceptados; QUESTION-004 y QUESTION-006 a QUESTION-012 quedaron resueltas o acotadas en sus alcances, mientras las demás conservan su estado.
- **Hecho conocido:** no existe implementación funcional ni autorización para prototipos.
- **Observación del sistema anterior:** sus lecciones señalan acoplamiento, complejidad y necesidad de mejor trazabilidad; no prueban reglas operativas.
- **Hipótesis:** recepción a entrega es el recorrido central más útil para discovery.
- **Decisión pendiente:** el Product Owner debe confirmar segmento, alcance y operación real.

## Hallazgos y conflictos

| ID | Documentos involucrados | Descripción | Impacto | Recomendación | ¿PO? | ¿Arquitectura? | Estado |
|---|---|---|---|---|---|---|---|
| DOMAIN-FINDING-001 | Glosario, Q013, MODULE_MAP | Reparación y orden de trabajo aparecen próximas, pero su identidad y cardinalidad no están decididas. | Puede producir un agregado o lifecycle incorrecto. | Resolver con ejemplos de una reparación simple, una múltiple y un reingreso. | Sí | Sí | Open |
| DOMAIN-FINDING-002 | Identidad, Q009, auditoría AUDIT-006 | ADR-004/011 fijan usuario ordinario por tenant e identidad independiente de PIN/sesión; identidad global, privacidad y recuperación siguen abiertas. | Puede fijar privacidad y recuperación prematuramente. | Conservar la identidad limitada al tenant y reservar correlación/recuperación a decisiones posteriores. | Sí | Sí | Partially resolved |
| DOMAIN-FINDING-003 | Estaciones/PIN/acceso, Q004/Q010–Q012, auditoría AUDIT-007 | ADR-010/011/012/013 fijan contexto, sesión y autorización ordinaria/reforzada; protección, composición/clasificación y mecanismos siguen abiertos. | Riesgo si el mecanismo excede el alcance aceptado. | Aplicar ADR-011/012/013 y validar amenazas antes de implementar acceso. | Sí | Sí | Parcialmente resuelto |
| DOMAIN-FINDING-004 | Q006–Q008, Multitenancy, MODULE_MAP | ADR-004 clasifica propiedad SaaS/tenant/sucursal y ADR-010 fija el contexto; cada dominio nuevo aún debe declarar su alcance. | Un concepto sin clasificación puede romper aislamiento o visibilidad. | Aplicar la matriz aceptada y resolver transferencias por módulo. | Sí | Sí | Resuelto arquitectónicamente |
| DOMAIN-FINDING-005 | PRODUCT_SCOPE, Q015–Q016, Q021–Q022 | Inventory, Payments y Cash son candidatos del recorrido, pero su mínimo no está confirmado. | El flujo puede quedar incompleto o inflado. | Decidir el mínimo necesario con un escenario de punta a punta. | Sí | Sí | Open |
| DOMAIN-FINDING-006 | Glosario, Messaging, AUDIT-032 | Conversación puede abarcar canales en una fuente y pertenecer a uno en otra. | Cambia identidad, historial y asignación. | Resolver como subpregunta de Q020. | Sí | Sí | Open |
| DOMAIN-FINDING-007 | DATA_ARCHITECTURE, AUDIT-015 | Una frase sobre objetos parece omitir una negación al hablar de usar una clave como autorización. | El texto literal contradice el control seguro inmediato. | Confirmar y corregir editorialmente fuera de esta tarea. | No | Sí | Open |
| DOMAIN-FINDING-008 | MODULE_MAP, AUDIT-031 | Repairs/Payments y Messaging/Integrations muestran colaboraciones recíprocas aparentes. | Traducirlas literalmente crearía ownership y dependencias ambiguos. | Elegir productor, consumidor u orquestación después de validar el flujo. | Sí | Sí | Open |
| DOMAIN-FINDING-009 | Glosario, Q013–Q014 | Listo, terminado, entregado y cerrado carecen de significado estable. | Puede mezclar trabajo técnico, disponibilidad física y cierre administrativo. | Validar máquinas separadas y criterios observables. | Sí | Sí | Open |
| DOMAIN-FINDING-010 | Actores, glosario, Q013 | Cliente, contacto, propietario y quien recoge no están delimitados. | Riesgo de atribuir autorización o responsabilidad a la persona equivocada. | Registrar relaciones y evidencia requerida por acción. | Sí | No | Open |
| DOMAIN-FINDING-011 | EPICS, MODULE_MAP, solicitud de dominio | La documentación usa Cash Register y el discovery considera Cash Management. | Puede parecer que se proponen dos capacidades. | Tratar Cash Management como contexto candidato y registrar equivalencia por validar. | Sí | Sí | Open |
| DOMAIN-FINDING-012 | PRODUCT_SCOPE, Subscription Billing, Payments | Los pagos del taller y la facturación SaaS son ámbitos distintos aunque ambos usan lenguaje financiero. | Mezclarlos distorsionaría saldo, cliente y autorización. | Mantener lenguajes y contextos separados. | Sí | Sí | Open |

## Riesgo principal

El mayor riesgo es convertir el flujo propuesto en requisito por repetición. La siguiente evidencia necesaria no es técnica: entrevistas con el Product Owner, ejemplos reales, casos excepcionales y, cuando sea posible, observación de la operación.
