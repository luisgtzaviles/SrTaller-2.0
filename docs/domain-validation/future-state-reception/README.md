# Future State Event Storming de recepción

**Estado:** `Proposed`.
**Propósito:** Proponer un recorrido de recepción rápido, claro, seguro y trazable para validación interdisciplinaria.
**Alcance:** Atención comercial, recepción formal, identidad y contacto, custodia, condición, riesgos, acceso al dispositivo, creación de orden, comprobante, evidencia inicial y habilitación de la siguiente fase.
**Fuente:** Dominio canónico no aprobado; auditorías legacy; Current State Event Storming; evidencia operativa aportada por el Product Owner.
**Audiencia:** Product Owner, Operaciones, Recepción, Seguridad, Legal y Arquitectura.
**Última actualización:** 2026-07-14.

> Este paquete propone un Future State operativo para validación. No constituye implementación ni arquitectura aprobada.

## Propósito

El paquete responde a una pregunta operativa: cómo hacer que una orden nazca con identidad, custodia, evidencia, riesgos y responsabilidades suficientemente claros sin convertir el mostrador en un trámite pesado.

La propuesta conserva la rapidez de la conversación comercial, formaliza los hechos que hoy sólo son humanos y corrige limitaciones visibles del legado. No aprueba conceptos canónicos ni exige que cada propuesta se implemente como evento técnico.

## Alcance y frontera

El recorrido comienza cuando una persona pregunta por precio y termina cuando la recepción queda completa y el equipo puede pasar a la siguiente fase. No cubre diagnóstico, cotización posterior, autorización de reparación, trabajo técnico, pagos, entrega, garantía ni cierre, excepto como consumidores o restricciones de frontera.

No se diseñan tablas, APIs, clases, pantallas definitivas, base de datos, infraestructura, microservicios, framework o mecanismos de persistencia.

## Fuentes y autoridad

| Fuente | Uso | Autoridad en este paquete |
|---|---|---|
| [Dominio canónico](../../domain/README.md) | Lenguaje, IDs candidatos y preguntas abiertas. | Hipótesis no aprobadas; no se promueven automáticamente. |
| [Auditoría legacy](../../legacy-audit/README.md) | Comportamiento y defectos del alta actual. | Evidencia del sistema anterior, no diseño objetivo. |
| [Auditoría del detalle](../../legacy-audit/repair-detail/README.md) | Efectos posteriores sobre evidencia, secretos, impresión y custodia. | Evidencia del sistema anterior, no política futura. |
| [Current State Event Storming](../current-state-event-storming/README.md) | Prácticas humanas, hechos técnicos y gaps actuales. | Descripción del presente conocido. |
| Evidencia del Product Owner incluida en la solicitud | Atención, identidad práctica, folio, dispositivo, evidencia, riesgos y nota. | Hechos actuales y deseos explícitos; no aprobación del Future State. |

## Validación posterior relacionada

El paquete de [recepción mínima y autorización comercial](../reception-minimum-and-commercial-authorization/README.md) conserva decisiones posteriores explícitas del Product Owner. Dentro de su alcance, resuelve que la orden y la custodia formal nacen únicamente con la creación correcta, define nombre y problema reportado como mínimos universales, clasifica otros datos como configurables y exige identificación física continua por folio.

Esa validación aclara FSR-DECISION-002, FSR-EVENT-006, FSR-POLICY-008 y FSR-QUESTION-009. También fija que las fotografías son posteriores a la creación, pero no resuelve su obligatoriedad, cantidad, propósito o retención. El resto de este paquete continúa como propuesta y no queda aprobado por esa referencia.

El paquete posterior de [flujo operativo y trazabilidad](../operational-workflow-and-traceability/README.md) toma FSR-EVENT-025, equipo disponible para diagnóstico, como frontera de entrada y documenta el recorrido real posterior de Avicell. No amplía el alcance de este Future State ni aprueba sus comandos, eventos o políticas.

La validación de [diagnóstico y recomendaciones técnicas](../future-state-diagnosis-and-technical-recommendations/README.md) profundiza la fase que consume esa frontera: conclusión técnica, recomendaciones, descubrimientos posteriores y transición a cotización. Conserva FSR-EVENT-025 como disponibilidad, no como diagnóstico iniciado.

## Current State frente a Future State

| Current State | Future State propuesto |
|---|---|
| Describe lo que ocurre hoy, incluso defectos y trabajo manual. | Formula una operación candidata que debe validarse. |
| Teléfono, cliente nombrado y entregante pueden confundirse. | Propone distinguir sus propósitos sin exigir siempre más captura. |
| Folio se predice antes de una creación separada. | Recomienda asignarlo de forma segura al crear la orden. |
| Riesgo seleccionado no prueba comunicación ni decisión. | Propone separar identificación, comunicación y decisión atribuible. |
| Evidencia puede quedar posterior y sin propósito. | Propone categoría, estado pendiente y condición explícita de avance. |
| Impresión reconstruye el presente. | Recomienda que el comprobante corresponda a una versión concreta de recepción. |

## Advertencia de diseño

Los términos “evento”, “owner candidato”, “versión”, “estado pendiente” y “asignación segura” expresan necesidades de negocio. No deciden almacenamiento, transacciones, arquitectura distribuida, formato documental ni experiencia de usuario.

## Leyenda de estados

| Estado | Uso |
|---|---|
| `Proposed` | Elemento candidato presentado para discusión. |
| `Recommended` | Opción preferida por equilibrio operativo, todavía no aprobada. |
| `Pending Product Owner validation` | Requiere confirmar intención, regla o autoridad de negocio. |
| `Pending operations validation` | Requiere prueba con recepción/taller en casos reales. |
| `Pending security review` | Requiere análisis de secreto, acceso, privacidad o minimización. |
| `Pending legal review` | Requiere determinar valor contractual, consentimiento o retención. |
| `Pending architecture review` | Requiere evaluar identidad, consistencia, integración o historia después de validar negocio. |
| `Rejected` | Opción descartada explícitamente dentro de esta propuesta; no equivale a decisión canónica. |
| `Deferred` | Tema fuera del segmento o pospuesto conscientemente. |
| `Unknown` | La evidencia no permite recomendar aún. |

## Índice

1. [Panorama futuro](FUTURE_STATE_RECEPTION_BIG_PICTURE.md)
2. [Eventos candidatos](FUTURE_STATE_RECEPTION_EVENTS.md)
3. [Comandos, actores y políticas](FUTURE_STATE_RECEPTION_COMMANDS_POLICIES.md)
4. [Modelo de información de negocio](FUTURE_STATE_RECEPTION_INFORMATION_MODEL.md)
5. [Registro de decisiones](FUTURE_STATE_RECEPTION_DECISIONS.md)
6. [Escenarios de validación](FUTURE_STATE_RECEPTION_SCENARIOS.md)
7. [Hotspots](FUTURE_STATE_RECEPTION_HOTSPOTS.md)
8. [Trazabilidad](FUTURE_STATE_RECEPTION_TRACEABILITY.md)

## Método de validación

1. Recorrer los 21 pasos del panorama con recepción y Product Owner.
2. Probar los quince escenarios, incluyendo una recepción estándar, fallas y excepciones.
3. Para cada decisión, elegir una opción, aportar ejemplo normal y excepcional y nombrar autoridad.
4. Revisar con Seguridad credenciales, imágenes y consentimiento; con Legal, comprobante y valor probatorio.
5. Marcar el resultado como recomendado, rechazado o pendiente; nunca inferir aprobación por silencio.
6. Sólo después de validación operativa analizar límites y mecanismos técnicos.

## Límites

- No se establece si la evidencia fotográfica es siempre obligatoria.
- No se decide cómo obtener acceso al dispositivo ni si se conservará una credencial.
- No se afirma propiedad legal del equipo.
- No se define valor contractual de la nota.
- No se aprueba un modelo histórico reutilizable de dispositivo.
- No se define la interfaz, persistencia ni tecnología del número de orden.
- No se cubren las reglas de diagnóstico o fases posteriores.

## Criterios para promoción a documentos canónicos

Una decisión puede proponerse para promoción sólo cuando:

- tenga un estado de validación explícito distinto de `Unknown`;
- Product Owner y Operaciones aporten al menos un caso normal y uno excepcional;
- la autoridad, los rechazos y el efecto de la excepción estén claros;
- Seguridad o Legal hayan revisado los datos sensibles aplicables;
- no contradiga una decisión canónica vigente, o la contradicción se documente;
- sus eventos, comandos y políticas tengan lenguaje consistente;
- se identifiquen documentos canónicos afectados y preguntas que quedarían abiertas.

La promoción requiere una acción posterior separada; este paquete no modifica el dominio canónico.
