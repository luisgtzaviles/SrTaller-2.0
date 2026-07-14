# Trazabilidad del Future State de recepción

**Estado:** `Proposed`.
**Propósito:** Mostrar de dónde surge cada propuesta, qué práctica conserva o corrige y qué validación permanece abierta.
**Alcance:** Veinticinco eventos y veinte decisiones; cobertura de las demás familias FSR.
**Fuente:** Current State Event Storming, auditorías legacy, evidencia del Product Owner y dominio canónico no aprobado.
**Audiencia:** Product Owner, Operaciones, Seguridad, Legal y Arquitectura.
**Última actualización:** 2026-07-14.

## Criterio

Una relación con documento canónico indica afinidad, no aprobación ni equivalencia. “Introduce política nueva” significa que la propuesta no está confirmada como práctica actual; necesita validación. Ningún gap se considera resuelto hasta que la decisión correspondiente sea promovida por un proceso posterior.

Fuentes abreviadas:

- [Current State](../current-state-event-storming/README.md)
- [Auditoría de alta](../../legacy-audit/NEW_REPAIR_FORM_AUDIT.md)
- [Hallazgos de alta](../../legacy-audit/NEW_REPAIR_DOMAIN_FINDINGS.md)
- [Auditoría de detalle](../../legacy-audit/repair-detail/REPAIR_DETAIL_AUDIT.md)
- [Hallazgos de detalle](../../legacy-audit/repair-detail/REPAIR_DETAIL_DOMAIN_FINDINGS.md)
- [Eventos canónicos](../../domain/DOMAIN_EVENTS.md), [reglas](../../domain/BUSINESS_RULES.md), [preguntas](../../domain/DOMAIN_OPEN_QUESTIONS.md) y [ownership](../../domain/OWNERSHIP_MATRIX.md)

## Trazabilidad de eventos

| Elemento FSR | Tipo / tratamiento | Evidencia Current State | Evidencia legacy | Evidencia Product Owner | Canónico relacionado | Decisión FSR | Estado | Revisión | Gap que busca resolver | Gap aún abierto |
|---|---|---|---|---|---|---|---|---|---|---|
| `FSR-EVENT-001` | Negocio / conserva práctica | `CSE-EVENT-001` | No encontrado antes del alta | Cliente pregunta primero por precio | — | `FSR-DECISION-001` | `Recommended` | Operaciones | Frontera comercial visible | Registro mínimo de consulta |
| `FSR-EVENT-002` | Negocio / formaliza práctica | Pasos 2–3; `CSE-READ-001` | Datos aparecen al alta | Marca/modelo/falla/cómo ocurrió | — | `FSR-DECISION-001` | `Recommended` | Operaciones | Básicos antes de recibir | Nivel de persistencia |
| `FSR-EVENT-003` | Negocio / formaliza práctica | `CSE-EVENT-002` | Oferta previa no estructurada | Puede ofrecer calidades | — | `FSR-DECISION-001` | `Proposed` | Product Owner | Alternativa distinguible | Vigencia y prueba de oferta |
| `FSR-EVENT-004` | Negocio / conserva práctica | `CSE-EVENT-003` | Sin orden de consulta abandonada | Cliente puede no continuar | — | `FSR-DECISION-001` | `Recommended` | Product Owner | Evita orden sin custodia | Si requiere métrica comercial |
| `FSR-EVENT-005` | Negocio / formaliza práctica | `CSE-EVENT-004` | Inicio se infiere del formulario | Decide dejar el equipo | `EVENT-005` sólo relacionado | `FSR-DECISION-001/002` | `Recommended` | Product Owner / Legal | Aceptación de ingreso separada | Alcance exacto de aceptación |
| `FSR-EVENT-006` | Negocio / introduce política nueva | `CSE-EVENT-005` | No hay timestamp propio | Recepción formal empieza al dejarlo | `EVENT-005`, `DQ-027` | `FSR-DECISION-002` | `Pending Product Owner validation` | Product Owner / Operaciones | Frontera y responsabilidad | Custodia antes de orden |
| `FSR-EVENT-007` | Identidad / corrige limitación | `CSE-EVENT-006/008` | `LEGACY-NR-FINDING-002/003` | Se pregunta a nombre de quién | `EVENT-001`; `RULE-002` | `FSR-DECISION-004/005/008` | `Recommended` | Product Owner | Selección con procedencia | Identidad maestra y duplicados |
| `FSR-EVENT-008` | Identidad / formaliza práctica | `CSE-READ-007`; `CSE-EVENT-008` | `LEGACY-NR-FINDING-003` | Teléfono recibe notificaciones/autorizaciones | `OWN-007/008`; `DQ-004` | `FSR-DECISION-004/005/008` | `Recommended` | Seguridad / Product Owner | Propósito de contacto | Autoridad por decisión |
| `FSR-EVENT-009` | Custodia / introduce política nueva | `CSE-SCENARIO-003`; hotspot `001` | Entregante no estructurado | Persona distinta hoy no se registra | `EVENT-005`; `RULE-003` | `FSR-DECISION-006/007` | `Pending Product Owner validation` | Operaciones / Legal | Origen de custodia | Captura siempre o condicionada |
| `FSR-EVENT-010` | Custodia / formaliza práctica | `CSE-EVENT-009` | `LEGACY-NR-FINDING-004` | Rasgos físicos identifican equipo | `EVENT-004/005` relacionados | `FSR-DECISION-009/010` | `Recommended` | Operaciones | Objeto físico descrito | Continuidad histórica |
| `FSR-EVENT-011` | Custodia / corrige limitación | Escenario sin IMEI | `LEGACY-NR-FINDING-004` | IMEI/serie no siempre disponible | `EVENT-004`; `DQ-005` | `FSR-DECISION-009/010` | `Recommended` | Operaciones / Arquitectura | Ausencia explícita sin dato falso | Dedupe y rasgos mínimos |
| `FSR-EVENT-012` | Evidencia / formaliza práctica | `CSE-EVENT-010` | Campos mezclan relato/condición | Se revisa visualmente al recibir | `EVENT-006`; `RULE-004` | `FSR-DECISION-011` | `Recommended` | Operaciones / Legal | Observación separada de relato | Inspección mínima por equipo |
| `FSR-EVENT-013` | Custodia / corrige limitación | Recepción registra chip/memoria | Catálogo de campos, sin semántica tri-valuada | Se revisan accesorios/rasgos | `EVENT-005`; `DQ-007` | `FSR-DECISION-012` | `Recommended` | Operaciones | Ausente vs desconocido | Catálogo operativo corto |
| `FSR-EVENT-014` | Riesgo / corrige limitación | `CSE-EVENT-011`; hotspot `007` | `LEGACY-NR-FINDING-007` | Riesgos se registran antes de intervenir | `RULE-004`; `DQ-007` | `FSR-DECISION-015/016` | `Recommended` | Operaciones / Legal | Riesgo identificado separado | Materialidad/clasificación |
| `FSR-EVENT-015` | Consentimiento / introduce política nueva | No estructurado | Selector no prueba comunicación | Necesidad inferida de consentimiento claro | `RULE-004`; `DQ-007` | `FSR-DECISION-015/016` | `Recommended` | Legal | Comunicación demostrable | Evidencia proporcional |
| `FSR-EVENT-016` | Consentimiento / corrige limitación | `CSE-HOTSPOT-007` | `LEGACY-NR-FINDING-007` | Legacy carece de aceptación demostrable | `RULE-004`; `DQ-007` | `FSR-DECISION-015/016` | `Pending legal review` | Legal / Product Owner | Aceptación atribuible | Autoridad y revocación |
| `FSR-EVENT-017` | Consentimiento / introduce política nueva | Rechazo no estructurado | No encontrado como decisión propia | Cliente puede no continuar | `DQ-007`; `EXCEPTIONS_AND_EDGE_CASES` | `FSR-DECISION-015/016/019` | `Pending Product Owner validation` | Product Owner / Legal | Rechazo/límite explícito | Efecto según riesgo |
| `FSR-EVENT-018` | Seguridad / corrige limitación | `CSE-HOTSPOT-006` | `LEGACY-NR-FINDING-008`; `LEGACY-RD-FINDING-020` | Alternativa futura no decidida | `RULE-005`; `DQ-006` | `FSR-DECISION-017` | `Pending security review` | Seguridad | Método y límites, no secreto ordinario | Alternativa por servicio |
| `FSR-EVENT-019` | Sistema/negocio / formaliza práctica | `CSE-EVENT-012` | `LEGACY-NR-RULE-001` | Orden nace después de guardar | `EVENT-007`; `RULE-001` | `FSR-DECISION-002` | `Recommended` | Product Owner / Arquitectura | Nacimiento semántico | Mínimos y excepción |
| `FSR-EVENT-020` | Sistema / corrige limitación | `CSE-EVENT-013`; hotspot `003` | `LEGACY-NR-FINDING-001` | Folio va en nota/sticker | — | `FSR-DECISION-003` | `Recommended` | Arquitectura / Operaciones | Evita predicción concurrente | Referencia temporal |
| `FSR-EVENT-021` | Documento / corrige limitación | `CSE-EVENT-015`; hotspot `022` | `LEGACY-NR-FINDING-014`; `LEGACY-RD-FINDING-024` | Nota apoya recepción/entrega | DQ-007; ownership de evidencia | `FSR-DECISION-018` | `Pending legal review` | Legal / Arquitectura | Versión emitida reproducible | Valor contractual y canal |
| `FSR-EVENT-022` | Evidencia / formaliza práctica | `CSE-EVENT-016` | `LEGACY-NR-FINDING-012/013` | Fotos se toman después de nota | `EVENT-006`; `RULE-004` | `FSR-DECISION-013/014` | `Pending operations validation` | Operaciones / Seguridad | Propósito/categoría de evidencia | Obligatoriedad/retención |
| `FSR-EVENT-023` | Evidencia / introduce política nueva | Evidencia puede quedar pendiente | Ausencia no es estado accionable | PO confirma pendiente posible | `DQ-007`; `INV-008` sólo relacionado | `FSR-DECISION-013/014/020` | `Recommended` | Operaciones / Arquitectura | Pendiente visible | SLA y bloqueo exacto |
| `FSR-EVENT-024` | Negocio / introduce política nueva | No hay hito Current State | Orden/nota no prueban completitud | Se quiere mayor trazabilidad | `EVENT-005/007` sólo relacionados | `FSR-DECISION-019/020` | `Recommended` | Product Owner / Operaciones | Completitud separada | Mínimos no exceptuables |
| `FSR-EVENT-025` | Frontera / introduce política nueva | Avance actual implícito | Sin guardia de recepción completa | Se quiere custodia/evidencia clara | `EVENT-010` es siguiente fase, no equivalente | `FSR-DECISION-019/020` | `Recommended` | Product Owner / Arquitectura | Evita avance prematuro | Excepción y consumidor real |

## Trazabilidad de decisiones

| Elemento FSR | Tipo / tratamiento | Evidencia Current State | Evidencia legacy | Evidencia Product Owner | Canónico relacionado | Decisión FSR | Estado | Revisión | Gap que busca resolver | Gap aún abierto |
|---|---|---|---|---|---|---|---|---|---|---|
| `FSR-DECISION-001` | Frontera / conserva práctica | Pasos 1–6 | Sin orden pre-ingreso | Consulta antes de recepción | `CORE_WORKFLOW` | Misma | `Recommended` | PO / Operaciones | Orden no nace por consulta | Registro comercial |
| `FSR-DECISION-002` | Nacimiento / formaliza práctica | `CSE-EVENT-012` | Alta exitosa crea fila | Orden nace tras guardar | `EVENT-007`, `RULE-001` | Misma | `Pending Product Owner validation` | PO / Operaciones | Mínimos semánticos | Instante/custodia previa |
| `FSR-DECISION-003` | Integridad / corrige limitación | Hotspot `003` | `LEGACY-NR-FINDING-001` | Folio físico/práctico | `RULE-001` relacionado | Misma | `Recommended` | Arquitectura | Concurrencia | Mecanismo técnico diferido |
| `FSR-DECISION-004` | Identidad / corrige limitación | Hotspot `002` | Dedupe por teléfono | No asumir identidad definitiva | `RULE-002`, `DQ-004` | Misma | `Recommended` | PO / Arquitectura | Fusión errónea | Política de duplicados |
| `FSR-DECISION-005` | Relaciones / formaliza práctica | Hotspot `001` | Snapshot combinado | Cliente/contacto tienen usos | `RULE-003`, `DQ-004` | Misma | `Recommended` | PO / Legal | Roles explícitos | Autoridad por propósito |
| `FSR-DECISION-006` | Custodia / introduce política nueva | Escenario Juan/Luis | Entregante ausente | Puede ser distinta | `EVENT-005`, `DQ-004` | Misma | `Pending operations validation` | PO / Operaciones | Trazar entregante relevante | Umbral de captura |
| `FSR-DECISION-007` | Legal / corrige presunción | Hotspot `001` | Propietario no modelado | Propiedad se presume | `RULE-003`, `DQ-004` | Misma | `Pending legal review` | Legal | No afirmar propiedad | Declaración mínima |
| `FSR-DECISION-008` | Historia / mejora práctica | `CSE-EVENT-008` | `LEGACY-NR-FINDING-003` | Nota conserva persona | `OWN-005/007/008` | Misma | `Recommended` | PO / Arquitectura | Qué se conocía al recibir | Corrección/frescura |
| `FSR-DECISION-009` | Custodia / conserva práctica | Escenario `004` | Equipo embebido | IMEI no siempre existe | `EVENT-004`, `DQ-005` | Misma | `Recommended` | Operaciones | Recepción sin IMEI | Riesgo de confusión |
| `FSR-DECISION-010` | Identidad / difiere arquitectura | Hotspot `004` | Sin dispositivo reusable | No debe asumirse entidad histórica | `EVENT-004`, `OWN-010/011` | Misma | `Pending architecture review` | Arquitectura después de PO | Custodia independiente de dedupe | Continuidad histórica |
| `FSR-DECISION-011` | Condición / formaliza práctica | `CSE-EVENT-010` | Campos mezclados | Inspección visual | `EVENT-006`, `RULE-004` | Misma | `Pending operations validation` | Operaciones / Legal | Observación atribuible | Mínimo/checklist |
| `FSR-DECISION-012` | Custodia / introduce política nueva | Accesorios actuales | Semántica incierta | Chip/memoria/rasgos se revisan | `DQ-007` | Misma | `Recommended` | Operaciones | Desconocido explícito | Catálogo |
| `FSR-DECISION-013` | Evidencia / formaliza variación | Hotspot `008` | Fotos posteriores/opcionales | No está aprobado qué es obligatorio | `RULE-004`, `DQ-007` | Misma | `Pending operations validation` | Operaciones / Legal | Política por riesgo | Configurabilidad/control |
| `FSR-DECISION-014` | Pendiente / introduce política nueva | Evidencia pendiente conocida | Sin estado estructurado | Puede quedar pendiente | `INV-008` relacionado | Misma | `Recommended` | Operaciones / Arquitectura | Visibilidad/acción | Vencimiento y cierre |
| `FSR-DECISION-015` | Consentimiento / corrige limitación | Hotspot `007` | Selector sin prueba | Riesgos antes de intervenir | `RULE-004`, `DQ-007` | Misma | `Pending legal review` | Legal / Seguridad | Decisión verificable | Evidencia proporcional |
| `FSR-DECISION-016` | Riesgo / introduce política nueva | Un riesgo genérico actual | Selector único | Pueden existir riesgos distintos | `DQ-007` | Misma | `Pending operations validation` | Operaciones / Legal | Alcances separados | Agrupación/UX |
| `FSR-DECISION-017` | Seguridad / corrige limitación | Hotspot `006` | Secreto inseguro | Alternativa no decidida | `RULE-005`, `DQ-006` | Misma | `Pending security review` | Seguridad | No tratar como dato ordinario | Método/retención |
| `FSR-DECISION-018` | Documento / corrige limitación | Hotspot `022` | Reimpresión dinámica | Nota tiene legitimación práctica | `DQ-007`, `OWN-012` | Misma | `Pending legal review` | Legal / Arquitectura | Reproducibilidad | Valor y corrección |
| `FSR-DECISION-019` | Flujo / introduce política nueva | Sin completitud explícita | Creación/estado actual | Mejorar trazabilidad | `CORE_WORKFLOW`, `DQ-027` | Misma | `Recommended` | PO / Operaciones | Gate de siguiente fase | Mínimos exactos |
| `FSR-DECISION-020` | Excepción / introduce política nueva | Fallas parciales conocidas | No hay excepción estructurada | Evidencia puede quedar pendiente | `RULE-004`, `DQ-025` | Misma | `Pending Product Owner validation` | PO / Operaciones / Seguridad | Continuidad atribuible | Autoridad/límites/frecuencia |

## Cobertura de familias restantes

| Familia | Cobertura | Estado |
|---|---|---|
| `FSR-ACTOR-001` a `010` | Responsabilidad y límite en [comandos y políticas](FUTURE_STATE_RECEPTION_COMMANDS_POLICIES.md). | `Proposed` |
| `FSR-COMMAND-001` a `020` | Actor, precondición, evento y rechazo en [comandos y políticas](FUTURE_STATE_RECEPTION_COMMANDS_POLICIES.md). | `Proposed` |
| `FSR-POLICY-001` a `018` | Tipo, evidencia, mejora, riesgo, excepción y validación en [comandos y políticas](FUTURE_STATE_RECEPTION_COMMANDS_POLICIES.md). | `Proposed` |
| `FSR-INFO-001` a `010` | Owner, productor, consumidor, historia, sensibilidad y preguntas en [información](FUTURE_STATE_RECEPTION_INFORMATION_MODEL.md). | `Proposed` |
| `FSR-QUESTION-001` a `020` | Registro de preguntas en [información](FUTURE_STATE_RECEPTION_INFORMATION_MODEL.md). | `Proposed` |
| `FSR-SCENARIO-001` a `015` | Comandos, eventos, políticas y decisiones en [escenarios](FUTURE_STATE_RECEPTION_SCENARIOS.md). | `Proposed` |
| `FSR-HOTSPOT-001` a `025` | Opciones, recomendación, riesgo y revisión en [hotspots](FUTURE_STATE_RECEPTION_HOTSPOTS.md). | `Proposed` |

## Balance de transformación

| Tratamiento | Ejemplos | Lectura |
|---|---|---|
| Conserva práctica | Consulta previa, decisión de dejar, equipo sin IMEI, folio visible. | Mantiene rapidez y realidad operativa. |
| Formaliza práctica | Contacto por propósito, inspección, riesgo comunicado, evidencia categorizada. | Vuelve explícito lo que hoy depende de memoria/narrativa. |
| Corrige limitación | Folio concurrente, consentimiento, credencial, reimpresión, pendiente visible. | No copia el defecto legacy. |
| Introduce política nueva | Completitud, gate de diagnóstico, excepción atribuible, múltiples riesgos. | Requiere validación; no es hecho actual. |
| Queda diferido | Tecnología de credencial, persistencia, UI, transferencias y diagnóstico. | Evita sobrediseñar antes de validar negocio. |
