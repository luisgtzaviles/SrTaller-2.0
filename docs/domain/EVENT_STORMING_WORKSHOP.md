# Guía de Event Storming del dominio operativo

## Metadatos

- **Estado:** Initial hypothesis / Pending Product Owner validation
- **Propósito:** Preparar sesiones ejecutables para descubrir y contrastar el recorrido operativo con evidencia.
- **Alcance:** Desde llegada o contacto del cliente hasta entrega, cierre, garantía, abandono o posible reapertura.
- **Audiencia:** Product Owner, participantes operativos candidatos, facilitación y arquitectura como observador.
- **Última actualización:** 2026-07-13

## Propósito y resultados esperados

El workshop no diseña software ni selecciona arquitectura. Se propone usarlo para descubrir:

- hechos de negocio y su secuencia;
- comandos e intenciones que podrían producirlos;
- actores y autoridades humanas;
- políticas, reglas candidatas y excepciones;
- hotspots, desacuerdos e información faltante;
- lenguaje inconsistente;
- posibles límites de responsabilidad;
- fuentes y evidencia que permitan validar o rechazar hipótesis.

Los eventos [EVENT-001 a EVENT-044](DOMAIN_EVENTS.md) son material inicial con estado Initial hypothesis. Una nota colocada durante la sesión no queda validada por aparecer en el tablero.

## Participantes sugeridos

| ID | Participación candidata | Aporte esperado | Supuesto pendiente |
|---|---|---|---|
| ESW-PART-001 | Product Owner | intención, prioridad y autoridad de producto | disponibilidad y conocimiento operativo directo |
| ESW-PART-002 | Recepción | llegada, custodia, comunicación y entrega | el rol podría estar combinado con caja o ventas |
| ESW-PART-003 | Técnicos | diagnóstico, intervención, partes y QC | podrían existir especialidades distintas |
| ESW-PART-004 | Responsable de inventario | disponibilidad, reservas, movimientos y transferencias | podría no existir como rol formal |
| ESW-PART-005 | Caja | pagos, movimientos, diferencias y cierre | podría ser responsabilidad de recepción |
| ESW-PART-006 | Administración | excepciones, permisos y coordinación | alcance tenant/sucursal todavía desconocido |
| ESW-PART-007 | Garantías | cobertura, reingreso y resolución | podría ser responsabilidad técnica o gerencial |
| ESW-PART-008 | Atención al cliente | contacto, seguimiento y reclamos | CRM/Messaging continúan fuera de alcance confirmado |
| ESW-PART-009 | Representante de sucursal | transferencias y variaciones locales | segmento multisucursal no validado |
| ESW-PART-010 | Facilitador | secuencia, neutralidad y registro de desacuerdos | persona TBD |
| ESW-PART-011 | Arquitectura como observador | detectar implicaciones sin decidirlas | no convierte notas en diseño |

## Leyenda visual neutral

La leyenda funciona con notas físicas o cualquier herramienta digital. El color es sugerido; el nombre y el ID son la referencia cuando el color no está disponible.

| ID | Elemento | Color o marca sugerida | Uso |
|---|---|---|---|
| ESW-LEGEND-001 | Domain Event | naranja | hecho pasado; referenciar EVENT-### cuando exista |
| ESW-LEGEND-002 | Command | azul | intención que podría rechazarse |
| ESW-LEGEND-003 | Actor | amarillo | persona, proceso o participante que origina una intención |
| ESW-LEGEND-004 | Policy | lila | reacción o condición que conecta hechos e intenciones |
| ESW-LEGEND-005 | Read Model / información requerida | verde | información que el actor necesita para decidir |
| ESW-LEGEND-006 | External System | rosa | proveedor, canal o sistema fuera del dominio observado |
| ESW-LEGEND-007 | Hotspot | rojo | desacuerdo, riesgo o concepto sin resolver |
| ESW-LEGEND-008 | Question | blanco con signo de interrogación | pregunta abierta; referenciar DQ-### cuando exista |
| ESW-LEGEND-009 | Rule candidate | lila con R | regla propuesta; referenciar RULE-### |
| ESW-LEGEND-010 | Timeline marker | gris | espera, fecha, vencimiento, promesa o corte temporal |
| ESW-LEGEND-011 | Boundary candidate | línea punteada | cambio posible de lenguaje o responsabilidad |

## Preparación

### Materiales

- superficie horizontal amplia y notas reposicionables, físicas o digitales;
- marcadores y leyenda visible;
- reloj para timeboxes;
- registro de fuentes y evidencia;
- espacio separado para hotspots, preguntas y temas arquitectónicos aparcados.

### Lectura previa

1. [Flujo central](CORE_WORKFLOW.md).
2. [Eventos candidatos](DOMAIN_EVENTS.md).
3. [Comandos e intenciones](COMMANDS_AND_INTENTIONS.md).
4. [Escenarios](SCENARIO_CATALOG.md).
5. [Preguntas abiertas](DOMAIN_OPEN_QUESTIONS.md).
6. [Lenguaje ubicuo](UBIQUITOUS_LANGUAGE.md).
7. [Entrevista del Product Owner](PRODUCT_OWNER_INTERVIEW.md).

### Reglas de facilitación

1. Narrar primero hechos observables en pasado.
2. Pedir un caso real y una excepción antes de generalizar.
3. Mantener versiones alternativas cuando exista desacuerdo.
4. Identificar quién aporta cada afirmación y qué evidencia la sustenta.
5. Separar “así ocurre”, “así debería ocurrir” y “así lo soportaba el sistema anterior”.
6. Aparcar almacenamiento, APIs, frameworks, servicios, Event Sourcing, CQRS y topología.
7. No interpretar consenso verbal como aprobación.
8. Preferir lenguaje del taller; registrar alias sin escoger uno durante la narración.

### Tratamiento de desacuerdos

Cada desacuerdo recibe una nota Hotspot con participantes, alternativas, caso que las diferencia y autoridad requerida. Si dos sucursales operan distinto, se conservan ambas narrativas; no se fuerza una regla común para terminar la sesión.

### Evidencia y fuente

| Campo de captura | Contenido esperado |
|---|---|
| Fuente | participante, documento, observación o sistema anterior |
| Tipo | caso real, recuerdo, política escrita, hipótesis o inferencia |
| Fecha/contexto | cuándo y en qué sucursal/tipo de trabajo ocurrió |
| Confianza | alta, media, baja o contradictoria |
| Evidencia | comprobante, fotografía, conversación, reporte o TBD |
| Validación | Product Owner, experto operativo, legal, finanzas o arquitectura |

## Agenda propuesta

Cada sesión se propone para 60–90 minutos y puede dividirse si los hotspots impiden una narrativa clara.

| ID | Objetivo | Punto inicial → final | Participantes relevantes | Preguntas detonadoras | Escenarios mínimos | Hotspots esperados | Artefactos que podrían actualizarse |
|---|---|---|---|---|---|---|---|
| ESW-SESSION-001 | Descubrir llegada, identidad y custodia | contacto/llegada → orden recibida | PO, recepción, atención | ¿quién llega?, ¿quién es propietario?, ¿qué evidencia entra? | SCENARIO-001/002/013 | ESW-HOTSPOT-002/003/010 | Language, Actors, Workflow, Questions |
| ESW-SESSION-002 | Separar síntoma, diagnóstico y oferta | orden recibida → cotización emitida | PO, recepción, técnicos, ventas | ¿cuándo inicia/termina diagnóstico?, ¿cuándo se cotiza sin él? | SCENARIO-003/004/016 | ESW-HOTSPOT-001/004/005 | Concepts, States, Events, Rules |
| ESW-SESSION-003 | Contrastar decisión, anticipos y cambios | cotización emitida → alcance autorizado/rechazado | PO, recepción, caja | ¿quién decide?, ¿qué evidencia vale?, ¿qué cambia tras anticipo? | SCENARIO-004–007/021 | ESW-HOTSPOT-002/007 | Money Model, Quote states, Questions |
| ESW-SESSION-004 | Entender partes, asignación e intervención | autorización → reparación completada | técnicos, inventario, supervisor, proveedor | ¿cuándo se reserva/consume?, ¿quién es responsable?, ¿qué pasa al cambiar parte? | SCENARIO-008/009/022 | ESW-HOTSPOT-005/006/009 | Inventory Domain, Aggregates, Ownership |
| ESW-SESSION-005 | Validar calidad y retrabajo | reparación completada → equipo marcado listo | técnicos, supervisor, recepción | ¿qué se prueba?, ¿quién declara listo?, ¿cómo vuelve a trabajo? | SCENARIO-010/011 | ESW-HOTSPOT-006 | States, Rules, Timeline |
| ESW-SESSION-006 | Descubrir cobro, salida y cierre | equipo listo → entregado/cerrado | recepción, caja, administración | ¿qué significa liquidado?, ¿quién recoge?, ¿cuándo cierra? | SCENARIO-012–015/017 | ESW-HOTSPOT-006/007/012 | Money Model, Delivery, Timeline |
| ESW-SESSION-007 | Separar garantía, regreso y abandono | entrega/listo → reclamo resuelto o custodia pendiente | garantías, técnicos, recepción, PO | ¿cuándo inicia cobertura?, ¿qué es reingreso?, ¿cuándo hay abandono? | SCENARIO-017–019/022 | ESW-HOTSPOT-008 | Warranty states, Questions, Timeline |
| ESW-SESSION-008 | Probar operación distribuida | origen en una sucursal → coordinación completada | representantes de sucursal, inventario, caja, administración | ¿qué se transfiere?, ¿quién conserva custodia?, ¿dónde se paga? | SCENARIO-020 | ESW-HOTSPOT-009/011 | Ownership, Context Relationships, Rules |

## Big Picture inicial

La secuencia siguiente organiza eventos ya catalogados. Las bifurcaciones no implican que el recorrido sea lineal ni aprobado.

| Tramo | Eventos candidatos existentes | Intenciones o información | Hotspots y ausencias |
|---|---|---|---|
| Llegada e identidad | EVENT-001/002/004 | RegisterCustomer, RegisterCustomerDevice | contacto inicial no tiene evento canónico |
| Recepción y evidencia | EVENT-005/006/007 | RecordIntake, OpenWorkOrder | evidencia corregida y accesorios parciales |
| Diagnóstico | EVENT-010/011/012 | StartDiagnosis, CompleteDiagnosis | múltiples diagnósticos y costo |
| Cotización | EVENT-013/014/015/019 | CreateQuote, IssueQuote, ReviseQuote TBD | alternativas y vigencia |
| Decisión | EVENT-016/017/018/020 | ApproveQuote, RejectQuote | autorización verbal o por canal |
| Anticipo | EVENT-033 | RecordPayment | anticipo frente a autorización |
| Partes | EVENT-024/025/026 | ReservePart, ConsumePart | recepción, liberación y transferencia sin evento canónico |
| Asignación e intervención | EVENT-008/021/022/023/027 | AssignTechnician, StartRepair, CompleteRepair | reasignación y reanudación |
| Calidad | EVENT-028/029/030/031 | RunQualityCheck | criterio de listo |
| Pago y saldo | EVENT-032/034/035 | RecordPayment, RefundPayment TBD | pago externo/contracargo |
| Entrega y cierre | EVENT-036/037/038/039 | MarkReadyForDelivery, DeliverDevice, CloseWorkOrder | Delivered frente a Closed |
| Garantía | EVENT-040/041/042/043/044 | OpenWarrantyClaim, ResolveWarranty TBD | inicio de cobertura y caso relacionado |
| Cancelación | EVENT-009 | CancelWorkOrder TBD | efectos financieros, partes y custodia |
| Abandono | evento canónico TBD | intención/política TBD | DQ-030, RULE-019, SCENARIO-017 |
| Reapertura/reingreso | EVENT-041 cubre reclamo, reapertura genérica TBD | intención TBD | DQ-022/029; no todo reingreso es garantía |

### Vista narrativa

EVENT-001/002 → EVENT-004 → EVENT-005/006/007 → EVENT-010 → EVENT-011 o EVENT-012 → EVENT-013/014 → EVENT-016, EVENT-017 o EVENT-018 → EVENT-020/021/022 → EVENT-023 o EVENT-027 → EVENT-028 → EVENT-029 o EVENT-030/031 → EVENT-036 → EVENT-032/033/034/035 según el caso → EVENT-037/038 → EVENT-039 → EVENT-040/041/042/043/044 según cobertura.

## Hotspots iniciales

| ID | Conflicto conocido | Referencias existentes | Pregunta detonadora |
|---|---|---|---|
| ESW-HOTSPOT-001 | orden frente a reparación | DOMAIN-FINDING-001, DQ-001 | ¿qué puede existir o cerrar sin el otro? |
| ESW-HOTSPOT-002 | cliente, propietario y contacto | DOMAIN-FINDING-010, DQ-004 | ¿quién puede informar, autorizar, pagar y recoger? |
| ESW-HOTSPOT-003 | equipo frente a dispositivo | DQ-003/005 | ¿qué palabra usa operación y cuál usa acceso? |
| ESW-HOTSPOT-004 | falla frente a diagnóstico | DQ-008 | ¿qué se reportó y qué se concluyó? |
| ESW-HOTSPOT-005 | servicio frente a partida/intervención | DQ-009/015 | ¿qué se vende, autoriza y ejecuta? |
| ESW-HOTSPOT-006 | listo, terminado, entregado y cerrado | DOMAIN-FINDING-009, DQ-018/020 | ¿qué hecho distingue cada hito? |
| ESW-HOTSPOT-007 | anticipo frente a pago | DQ-012 | ¿qué cambia en saldo, autorización y caja? |
| ESW-HOTSPOT-008 | garantía frente a reingreso | DQ-021/022 | ¿cuándo nace un caso nuevo? |
| ESW-HOTSPOT-009 | sucursal frente a ubicación | DOMAIN-FINDING-004, DQ-002/031 | ¿qué identifica organización, custodia y stock? |
| ESW-HOTSPOT-010 | dispositivo del cliente frente a autorizado | DOMAIN-FINDING-003, INV-003 | ¿qué actor y ciclo pertenece a cada uno? |
| ESW-HOTSPOT-011 | pagos del taller frente a Subscription Billing | DOMAIN-FINDING-012 | ¿quién paga a quién y por qué obligación? |
| ESW-HOTSPOT-012 | Cash Register frente a Cash Management | DOMAIN-FINDING-011, Q022 | ¿caja es lugar, control, terminal o sesión? |

## Transformación de resultados

| ID | Resultado del workshop | Destino | Condición de registro |
|---|---|---|---|
| ESW-OUTPUT-001 | decisión aún no tomada | DOMAIN_DECISION_LOG | alternativas, autoridad y efecto; estado Pending |
| ESW-OUTPUT-002 | pregunta nueva no equivalente | DOMAIN_OPEN_QUESTIONS | demostrar que DQ-001–031 no la cubren |
| ESW-OUTPUT-003 | regla candidata | BUSINESS_RULES | origen, ejemplo, excepción y validación |
| ESW-OUTPUT-004 | escenario diferenciado | SCENARIO_CATALOG | caso real/hipótesis y preguntas relacionadas |
| ESW-OUTPUT-005 | cambio terminológico | DOMAIN_GLOSSARY_DECISIONS | TERM-DEC y evidencia, sin alterar lenguaje automáticamente |
| ESW-OUTPUT-006 | cambio de lifecycle | STATE_MACHINES | actor, comando, precondición y evento |
| ESW-OUTPUT-007 | límite posible | BOUNDED_CONTEXT_CANDIDATES | diferencia de lenguaje/ownership demostrable |
| ESW-OUTPUT-008 | evidencia trazable | TRACEABILITY | fuente, ID relacionado, estado y revisión requerida |

## Definition of Done de una sesión

La sesión queda documentada cuando:

- el inicio, final y escenarios recorridos están identificados;
- los resultados se conservan en el repositorio o acta enlazada;
- los hotspots y desacuerdos permanecen visibles;
- cada afirmación relevante conserva fuente y tipo de evidencia;
- las preguntas nuevas no equivalentes se registraron y vincularon; todas se compararon con DQ-001–031;
- toda hipótesis está marcada;
- cada follow-up tiene autoridad de validación candidata;
- los términos discutidos apuntan a TERM-DEC;
- no se introdujeron decisiones de arquitectura accidentales.

El consenso verbal, una fotografía del tablero o la ausencia de desacuerdo no son evidencia suficiente de aprobación.
