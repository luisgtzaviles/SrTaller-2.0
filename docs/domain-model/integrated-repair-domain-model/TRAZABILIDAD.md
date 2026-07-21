# Trazabilidad del modelo integrado

## Regla de autoridad

| Nivel | Fuente | Tratamiento en este paquete |
|---|---|---|
| 1 | RMCA, FOT y DTR validados por Product Owner | decisiones DDV/HOV/RCA/PC según su propio alcance |
| 2 | Current State con declaraciones PO | hechos operativos, inferencias y gaps conservan estado de evidencia |
| 3 | Auditorías legacy | RCL o evidencia histórica; nunca decisión futura por sí sola |
| 4 | `docs/domain` | hipótesis, catálogos y preguntas preliminares; se actualizan mediante referencias mínimas |
| 5 | `docs/architecture` | propuestas conceptuales; no se convierten en arquitectura aceptada |
| 6 | Este paquete | integración, PM y PA; no reemplaza fuentes |

## Fuentes de dominio revisadas

| Fuente | Estado fuente | Uso principal |
|---|---|---|
| [Índice de dominio](../../domain/README.md) | Draft/Discovery | navegación y convención de certeza |
| [Lenguaje ubicuo](../../domain/UBIQUITOUS_LANGUAGE.md) | preliminar | términos, ambigüedades y sinónimos |
| [Flujo central](../../domain/CORE_WORKFLOW.md) | hipótesis | etapas y excepciones iniciales |
| [Actores](../../domain/DOMAIN_ACTORS.md) | preliminar | roles y participantes |
| [Conceptos](../../domain/DOMAIN_CONCEPTS.md) | preliminar | entidades y relaciones candidatas |
| [Reglas](../../domain/BUSINESS_RULES.md) | preliminar | contraste con validaciones posteriores |
| [Invariantes](../../domain/INVARIANTS.md) | preliminar | catálogo base y preguntas |
| [Máquinas de estado](../../domain/STATE_MACHINES.md) | preliminar | riesgos de mezclar dimensiones |
| [Eventos](../../domain/DOMAIN_EVENTS.md) | candidatos | vocabulario de hechos |
| [Contextos](../../domain/BOUNDED_CONTEXT_CANDIDATES.md) | candidatos | mapa estratégico inicial |
| [Relaciones](../../domain/CONTEXT_RELATIONSHIPS.md) | candidatas | dependencias preliminares |
| [Agregados](../../domain/AGGREGATE_CANDIDATES.md) | candidatos | fronteras para reevaluación |
| [Objetos de valor](../../domain/VALUE_OBJECT_CANDIDATES.md) | candidatos | valores para reevaluación |
| [Trazabilidad canónica](../../domain/TRACEABILITY.md) | discovery | IDs DQ/RULE/EVENT/INV |
| [Decisiones de dominio](../../domain/DOMAIN_DECISION_LOG.md) | pendientes | gates no aprobados |
| [Glosario y decisiones](../../domain/DOMAIN_GLOSSARY_DECISIONS.md) | preliminar | tensión de términos |
| [Preguntas](../../domain/DOMAIN_OPEN_QUESTIONS.md) | abiertas | consolidación de PA |
| [Estado de discovery](../../domain/DOMAIN_DISCOVERY_STATUS.md) | discovery | madurez y límites |
| [Comandos](../../domain/COMMANDS_AND_INTENTIONS.md) | candidatos | catálogo de intenciones |
| [Ownership](../../domain/OWNERSHIP_MATRIX.md) | candidato | responsabilidades |
| [Línea temporal](../../domain/DOMAIN_TIMELINE.md) | preliminar | hitos y marcas de tiempo |
| [Event Storming](../../domain/EVENT_STORMING_WORKSHOP.md) | guía | hotspots y preguntas |
| [Excepciones](../../domain/EXCEPTIONS_AND_EDGE_CASES.md) | hipótesis | casos límite |
| [Inventario](../../domain/INVENTORY_DOMAIN.md) | discovery | piezas, reservas y dependencias |
| [Dinero](../../domain/MONEY_MODEL.md) | discovery | obligación, pago, saldo y caja |
| [Entrevista PO](../../domain/PRODUCT_OWNER_INTERVIEW.md) | guía | sesiones y decisiones pendientes |
| [Escenarios](../../domain/SCENARIO_CATALOG.md) | hipótesis | contraste end-to-end |

## Paquetes de validación revisados

| Paquete | Autoridad | IDs conservados | Uso |
|---|---|---|---|
| [Mapa del estado actual](../../domain-validation/current-state-event-storming/README.md) | evidencia combinada, no futuro aprobado | `CSE-*` | recorrido legacy/humano, puntos críticos y conflictos |
| [Recepción futura](../../domain-validation/future-state-reception/README.md) | recomendaciones/preguntas según fila | `FSR-*` | identidad, riesgo, evidencia y completitud candidata |
| [Recepción mínima y autorización comercial](../../domain-validation/reception-minimum-and-commercial-authorization/README.md) | validado por PO | `RMCA-DEC-001..025`, `RMCA-INV-001..015`, `RMCA-POL-001..005`, `RMCA-PREG-*` | mínimos, custodia, identificación, autorización y precio |
| [Workflow operativo y trazabilidad](../../domain-validation/operational-workflow-and-traceability/README.md) | validado por PO en alcance | `FOT-DEC-001..032`, `FOT-INV-001..020`, `FOT-PROP-*`, `FOT-PREG-*` | flujo, dimensiones, roles, QC, pagos y atribución |
| [Diagnóstico y recomendaciones](../../domain-validation/future-state-diagnosis-and-technical-recommendations/README.md) | validado por PO en decisiones; propuestas separadas | `DTR-DEC-001..041`, `DTR-INV-001..020`, `DTR-PROP-001..011`, `DTR-PREG-*` | diagnóstico, conclusión, recomendación, iteraciones y comercial |

## Auditorías legacy revisadas

| Paquete/fuente | Corte y estado | Uso |
|---|---|---|
| [Nueva Reparación](../../legacy-audit/README.md) | evidencia de SR Taller 1.0 | creación, folio, campos, efectos laterales y riesgos |
| [Hallazgos Nueva Reparación](../../legacy-audit/NEW_REPAIR_DOMAIN_FINDINGS.md) | `LEGACY-NR-*` | tensiones de cliente, equipo, secreto, evidencia y anticipo |
| [Flujo Nueva Reparación](../../legacy-audit/NEW_REPAIR_FLOW_MAP.md) | evidencia legacy | secuencia y fallos parciales |
| [Configuración de recepción](../../legacy-audit/reception-policy-config/README.md) | `LEGACY-RPC-*` | diferencia entre formulario y política completa |
| [Detalle de reparación](../../legacy-audit/repair-detail/README.md) | `LEGACY-RD-*` | estado, técnico, seguimiento, dinero, QC y entrega |
| [Hallazgos de detalle](../../legacy-audit/repair-detail/REPAIR_DETAIL_DOMAIN_FINDINGS.md) | evidencia legacy | contradicciones de campos mutables y atribución |

## Arquitectura revisada como restricción no vinculante

| Documento | Estado preservado | Aporte conceptual |
|---|---|---|
| [Contexto del sistema](../../architecture/SYSTEM_CONTEXT.md) | borrador | actores, límites y multitenencia |
| [Arquitectura objetivo](../../architecture/TARGET_ARCHITECTURE.md) | propuesta | modularidad y propiedad; sin adoptar tecnología |
| [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md) | propuesta | separación de responsabilidades |
| [Arquitectura de datos](../../architecture/DATA_ARCHITECTURE.md) | propuesta | identidad, consistencia y datos derivados |
| [Multitenencia](../../architecture/MULTITENANCY_MODEL.md) | propuesta de alto riesgo | tenant/sucursal como contexto transversal |
| [Identidad, acceso y permisos](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md) | propuesta | atribución, capacidades y PIN |
| [Sucursal y dispositivo](../../architecture/BRANCH_AND_DEVICE_MODEL.md) | propuesta | sucursal, dispositivo y sesión |
| [Integraciones](../../architecture/INTEGRATION_ARCHITECTURE.md) | propuesta | no confundir integración con dominio |
| [Tiempo real y mensajería](../../architecture/REALTIME_AND_MESSAGING.md) | propuesta | proyección/notificación no fuente de verdad |
| [Línea base de seguridad](../../architecture/SECURITY_BASELINE.md) | propuesta | secretos, aislamiento y auditoría |
| [Observabilidad](../../architecture/OBSERVABILITY_STRATEGY.md) | propuesta | diferencia entre auditoría y registros técnicos |
| [Despliegue](../../architecture/DEPLOYMENT_STRATEGY.md) | propuesta | revisado sin impacto en modelo de dominio |

También se revisaron [README del repositorio](../../../README.md) y [CHANGELOG](../../../CHANGELOG.md); ambos confirman que el proyecto permanece en fase documental.

## Mapeo de decisiones consolidadas

| Rango integrado | Fuente validada dominante | Tema |
|---|---|---|
| IDM-DEC-001..025 | RMCA | orden, recepción, custodia e identificación |
| IDM-DEC-026..031 | Current State + RMCA/FOT | personas, contacto y entrega física |
| IDM-DEC-032..048 | DTR | diagnóstico, conclusión, recomendación y resultados |
| IDM-DEC-049..078 | FOT | flujo, dimensiones, roles y participación |
| IDM-DEC-079..091 | FOT | trazabilidad, PIN y segunda revisión |
| IDM-DEC-092..105 | RMCA + DTR | cotización, autorización y precio |
| IDM-DEC-106..117 | FOT + RMCA | anticipos, entrega y fin de custodia |

## Mapeo de entregables

| Entregable integrado | Fuentes dominantes |
|---|---|
| Visión, Orden y ciclo | RMCA + FOT + DTR |
| Contextos y relaciones | `docs/domain` + arquitectura como propuesta + decisiones validadas |
| Agregados, entidades y valores | candidatos de dominio revaluados con RMCA/FOT/DTR |
| Eventos, comandos y políticas | paquetes de validación + Current State |
| Invariantes y dimensiones | RMCA/FOT/DTR |
| Comercial | RMCA + DTR + auditoría de detalle |
| Técnico | DTR + FOT + auditoría de detalle |
| Trazabilidad y responsabilidad | FOT + IAM propuesta + legacy |
| Consistencia y proyecciones | invariantes + escenarios + arquitectura no vinculante |
| Contradicciones | auditorías legacy + Current State hotspots |
| Preguntas | DQ + RMCA-PREG + FOT-PREG + DTR-PREG + legacy Q |

## Límites de la trazabilidad

- Una referencia temática no significa equivalencia exacta entre IDs.
- Las decisiones integradas resumen; los textos fuente gobiernan matices y alcance.
- Las propuestas FSR y de arquitectura conservan estado pendiente aunque parezcan compatibles.
- No se consultó runtime, base de datos, SQL, API activa ni evidencia externa.
- Ninguna relación documental prescribe implementación.
