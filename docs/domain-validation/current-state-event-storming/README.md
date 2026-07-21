# Current State Event Storming de SR Taller

**Estado:** Borrador para validación interdisciplinaria.
**Propósito:** Presentar el primer panorama integral, trazable y basado en evidencia del recorrido actual de una reparación.
**Alcance:** Desde la consulta comercial previa al ingreso hasta entrega, posible reingreso o garantía, incluyendo personas, decisiones, dinero, custodia, evidencias e integraciones observadas.
**Fuente:** Documentación canónica de `docs/domain/`; auditorías de nueva reparación y detalle de reparación; declaraciones operativas del Product Owner incluidas en la sesión de trabajo.
**Audiencia:** Product Owner, operaciones, técnicos, finanzas, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

> Este paquete describe el flujo actual conocido. No es la especificación objetivo de SR Taller 2.0.

## Propósito y alcance

Este paquete reconstruye hechos, intenciones humanas, registros técnicos y vacíos del proceso actual. Comienza antes de que exista una orden: una persona consulta, recibe alternativas y decide si deja el equipo. Termina cuando se libera la custodia o cuando el equipo vuelve por reapertura o posible garantía.

No aprueba requisitos ni convierte nombres del legado en conceptos definitivos. En particular, no aprueba Bounded Contexts, Aggregates, estados, eventos canónicos, arquitectura, roles, reglas financieras ni mecanismos de integración futuros.

## Corte de evidencia

| Fuente | Corte usado | Uso en este paquete |
|---|---|---|
| Dominio canónico | Archivos existentes al 2026-07-14 | IDs y preguntas de referencia; su estado de borrador se conserva. |
| Nueva reparación | SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3` | Alta, cliente, equipo, folio, anticipo inicial, impresión y evidencia. |
| Detalle de reparación | Mismo corte legacy | Estado, custodia, técnico, seguimiento, pago, evidencia, webhook, impresión y límites de entrega. |
| Product Owner | Declaraciones aportadas en esta sesión | Prácticas humanas de atención, autorización, legitimación, entrega y ejemplo pantalla más batería. |

No se consultaron datos activos de base de datos, plantillas, webhooks configurados, expedientes físicos, mensajes reales ni contabilidad. Las búsquedas negativas sólo cubren los repositorios y rutas auditados.

## Current State frente a Future State

| Current State | Future State |
|---|---|
| Describe lo que el código permite o lo que operación afirma hacer hoy. | Expresa una intención o materia pendiente de diseño y aprobación. |
| Puede incluir defectos, trabajo manual, datos sobrescritos y contradicciones. | No se deriva automáticamente del legado ni de este mapa. |
| Usa evidencia y estado de conocimiento por elemento. | Sólo aparece como `Desired future behavior` y se mantiene fuera del flujo confirmado. |

La intención de que los cobros de reparación afecten caja es futura. No constituye una política vigente ni define todavía cómo se relacionarán pago, aplicación y movimiento de caja.

## Validación posterior relacionada

El paquete de [flujo operativo y trazabilidad](../operational-workflow-and-traceability/README.md) conserva decisiones posteriores explícitas del Product Owner sobre el recorrido real de Avicell desde recepción hasta entrega, segunda revisión, ubicaciones físicas, participación de varios usuarios, atribución por PIN y anticipos básicos. Aclara varios hotspots de este Current State, pero no reescribe la evidencia legacy ni convierte todos los resultados locales en reglas universales.

El paquete de [diagnóstico y recomendaciones técnicas](../future-state-diagnosis-and-technical-recommendations/README.md) aclara posteriormente la conclusión, la recomendación, el descubrimiento de fallas nuevas y la transición comercial. Supera la mezcla observada entre diagnóstico, seguimiento y presupuesto sin reescribir este mapa histórico.

## Advertencia de interpretación

Que el legado contenga un campo, etiqueta o botón no prueba que exista una política de negocio válida. Que el Product Owner describa una práctica tampoco prueba que el sistema la registre. Este material conserva ambas perspectivas sin diseñar tablas, APIs, clases, microservicios, CQRS, Event Sourcing, colas ni solución objetivo.

## Leyenda de evidencia

| Estado | Significado en este paquete |
|---|---|
| `Confirmed by Product Owner` | Práctica o hecho humano declarado por el Product Owner; puede no existir en el sistema. |
| `Confirmed by legacy code` | Comportamiento demostrado por el código auditado; no implica intención de negocio. |
| `Confirmed by both` | Código y declaración operativa sostienen el mismo hecho, dentro de su alcance. |
| `Inferred from combined evidence` | Consecuencia razonable de unir fuentes, aún no confirmada directamente. |
| `Desired future behavior` | Intención expresada para el futuro, no política aprobada ni comportamiento actual. |
| `Unknown` | La evidencia disponible no permite determinarlo. |
| `Conflict` | Fuentes o auditorías sostienen afirmaciones incompatibles. |
| `Pending Product Owner validation` | Requiere decisión o precisión operativa. |
| `Pending finance review` | Requiere definición financiera o contable. |
| `Pending security review` | Requiere decisión de acceso, privacidad, prueba o protección. |
| `Pending architecture review` | Requiere decisión de consistencia, identidad, tiempo o integración. |

## Índice

1. [Panorama completo](CURRENT_STATE_BIG_PICTURE.md)
2. [Catálogo de eventos](CURRENT_STATE_EVENT_CATALOG.md)
3. [Mapa de comandos, políticas y actores](CURRENT_STATE_COMMAND_POLICY_ACTOR_MAP.md)
4. [Línea temporal](CURRENT_STATE_TIMELINE.md)
5. [Hotspots](CURRENT_STATE_HOTSPOTS.md)
6. [Recorridos de escenarios](CURRENT_STATE_SCENARIO_WALKTHROUGHS.md)
7. [Trazabilidad](CURRENT_STATE_TRACEABILITY.md)

## Método de lectura

1. Empezar por el [panorama](CURRENT_STATE_BIG_PICTURE.md) para seguir los 29 pasos cronológicos.
2. Consultar el [catálogo](CURRENT_STATE_EVENT_CATALOG.md) para distinguir hechos persistidos, hechos humanos y gaps deseados.
3. Usar el [mapa](CURRENT_STATE_COMMAND_POLICY_ACTOR_MAP.md) para identificar quién intenta qué y qué regla o limitación interviene.
4. Contrastar orden causal y marcas de tiempo en la [línea temporal](CURRENT_STATE_TIMELINE.md).
5. Revisar incertidumbres y riesgos en [hotspots](CURRENT_STATE_HOTSPOTS.md), y someterlos a prueba con los [escenarios](CURRENT_STATE_SCENARIO_WALKTHROUGHS.md).
6. Volver a evidencia y preguntas canónicas mediante la [matriz de trazabilidad](CURRENT_STATE_TRACEABILITY.md).

Los IDs `CSE-*` pertenecen únicamente a este paquete. Cuando existe una afinidad con un ID canónico o de auditoría se referencia; no se lo sustituye ni se declara equivalente sin evidencia.

## Límites de la evidencia

- La interacción comercial previa al ingreso está confirmada por Product Owner, no por el código auditado.
- El control de calidad estructurado no fue encontrado; `revisor` no demuestra una revisión.
- Los actos humanos de llamada, autorización, reconocimiento, presentación de nota o INE y excepción no están estructurados en el legado.
- Los valores activos de estados, técnicos, plantillas y webhooks son desconocidos.
- Los pagos legacy demuestran filas por folio, no caja, aplicación contable ni conciliación.
- El código permite combinaciones que la operación puede rechazar; posibilidad técnica no equivale a política.
- Existe un conflicto documental sobre una supuesta doble consulta al imprimir. El código del corte más reciente muestra una sola consulta y el conflicto permanece abierto.
- Las referencias canónicas son hipótesis o borradores salvo que su propio documento indique otra cosa.

## Próximos pasos de validación

- Product Owner y recepción: validar actores, legitimación, excepciones, reingreso, garantía y significado de cada estado.
- Técnicos: separar falla reportada, diagnóstico, hallazgo, trabajo realizado y resultado técnico.
- Finanzas: definir cotización, autorización monetaria, pago, aplicación, saldo, caja, crédito, devolución y sobrepago.
- Seguridad: resolver protección del código del dispositivo, INE, fotografías, tickets, webhooks y permisos por acción.
- Arquitectura: validar identidad, historial, zonas horarias, atomicidad, impresión reproducible e integraciones, sin convertir este mapa en diseño.
- Taller interdisciplinario: recorrer los quince escenarios y cerrar o reformular los hotspots priorizados.
