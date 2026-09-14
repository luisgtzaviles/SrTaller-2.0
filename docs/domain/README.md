# Descubrimiento del dominio operativo

## Estado documental

- **Estado:** Draft / Discovery general; Price List reviewed/promoted.
- **Autoridad:** la sección general no está aprobada; para Lista de precios
  prevalecen su decision log y arquitectura aceptada.
- **Propietario de decisión:** Product Owner
- **Última revisión:** 2026-09-13 para Price List/Bulk Composer
- **Próxima revisión:** Después de la entrevista de dominio

## Propósito

Esta sección hace explícito cómo podría funcionar un taller de reparación: qué conceptos usa, quién interviene, qué reglas protege, qué hechos relevantes ocurren y qué excepciones pueden romper un modelo simple. Modelar el dominio significa describir la operación con lenguaje del negocio y evidencia trazable antes de convertirla en software.

La documentación combina hechos, observaciones legacy, hipótesis, propuestas y
preguntas. Price List contiene decisiones aprobadas promovidas explícitamente;
esa aprobación no se extiende al resto del directorio.

## Lo que todavía no representa

- no es una especificación aprobada del producto;
- no es un diseño de base de datos, contrato de API ni modelo de clases;
- no fija pantallas, frameworks, servicios o unidades desplegables;
- no valida que el sistema anterior represente la operación correcta;
- no autoriza implementación, prototipos, PBIs nuevos ni otro sprint.

## Ruta de revisión recomendada

[CORE_WORKFLOW](CORE_WORKFLOW.md)
→ [PRODUCT_OWNER_INTERVIEW](PRODUCT_OWNER_INTERVIEW.md)
→ [EVENT_STORMING_WORKSHOP](EVENT_STORMING_WORKSHOP.md)
→ [UBIQUITOUS_LANGUAGE](UBIQUITOUS_LANGUAGE.md)
→ [BUSINESS_RULES](BUSINESS_RULES.md)
→ [STATE_MACHINES](STATE_MACHINES.md)
→ [DOMAIN_EVENTS](DOMAIN_EVENTS.md)
→ [BOUNDED_CONTEXT_CANDIDATES](BOUNDED_CONTEXT_CANDIDATES.md)

## Navegación

### Descubrimiento general

- [Estado del discovery](DOMAIN_DISCOVERY_STATUS.md)
- [Actores](DOMAIN_ACTORS.md)
- [Conceptos](DOMAIN_CONCEPTS.md)

### Lenguaje

- [Lenguaje ubicuo](UBIQUITOUS_LANGUAGE.md)
- [Decisiones terminológicas](DOMAIN_GLOSSARY_DECISIONS.md)

### Flujo y comportamiento

- [Flujo central](CORE_WORKFLOW.md)
- [Reglas de negocio](BUSINESS_RULES.md)
- [Invariantes](INVARIANTS.md)
- [Máquinas de estado](STATE_MACHINES.md)
- [Eventos](DOMAIN_EVENTS.md)
- [Comandos e intenciones](COMMANDS_AND_INTENTIONS.md)
- [Excepciones y casos límite](EXCEPTIONS_AND_EDGE_CASES.md)
- [Escenarios](SCENARIO_CATALOG.md)

### Modelos especializados

- [Línea temporal del dominio](DOMAIN_TIMELINE.md)
- [Modelo de dinero](MONEY_MODEL.md)
- [Dominio de inventario](INVENTORY_DOMAIN.md)
- [Discovery de Lista de precios](PRICE_LIST_DOMAIN_DISCOVERY.md)
- [Bulk Catalog Composer y catálogo de proveedor versionado](PRICE_LIST_BULK_IMPORT_AUDIT_AND_DOMAIN_DESIGN.md)
- [Arquitectura aceptada de Lista de precios](../architecture/PRICE_LIST_ARCHITECTURE.md)
- [Readiness de PBI-041](../quality/evidence/pbi-041/README.md)
- [Valores candidatos](VALUE_OBJECT_CANDIDATES.md)

### Diseño estratégico candidato

- [Contextos delimitados](BOUNDED_CONTEXT_CANDIDATES.md)
- [Relaciones entre contextos](CONTEXT_RELATIONSHIPS.md)
- [Agregados candidatos](AGGREGATE_CANDIDATES.md)
- [Matriz de ownership](OWNERSHIP_MATRIX.md)

### Validación y trazabilidad

- [Modelo integrado del dominio de reparaciones](../domain-model/integrated-repair-domain-model/README.md) — consolidación maestra de decisiones validadas, evidencia, candidatos de modelado y preguntas; no reemplaza las fuentes
- [Entrevista al Product Owner](PRODUCT_OWNER_INTERVIEW.md)
- [Taller de Event Storming](EVENT_STORMING_WORKSHOP.md)
- [Decisiones pendientes](DOMAIN_DECISION_LOG.md)
- [Preguntas abiertas](DOMAIN_OPEN_QUESTIONS.md)
- [Trazabilidad](TRACEABILITY.md)
- [Validación de recepción mínima y autorización comercial](../domain-validation/reception-minimum-and-commercial-authorization/README.md) — decisiones posteriores validadas por Product Owner; requieren promoción canónica separada
- [Validación del flujo operativo y la trazabilidad](../domain-validation/operational-workflow-and-traceability/README.md) — flujo Avicell y separaciones posteriores validadas; propuestas multi-tenant pendientes
- [Validación futura del diagnóstico y las recomendaciones técnicas](../domain-validation/future-state-diagnosis-and-technical-recommendations/README.md) — conclusiones y fronteras técnicas validadas; iteraciones y versionado propuestos

## Autoridad y participación

El Product Owner debe revisar directamente el flujo, lenguaje, reglas, estados, excepciones, decisiones, preguntas, entrevista y escenarios. Operación real debe aportar ejemplos; especialistas legales, financieros o de seguridad deben validar sus respectivas materias. Arquitectura puede usar posteriormente contextos, eventos, agregados, valores e invariantes como entradas, pero no tratarlos como diseño aprobado.

## Convenciones de certeza

| Etiqueta | Uso |
|---|---|
| Hecho conocido | Afirmación sustentada por documentación vigente o estructura verificable del repositorio |
| Observación del sistema anterior | Lección declarada, no regla de negocio ni evidencia suficiente |
| Hipótesis | Explicación provisional que necesita contraste operativo |
| Propuesta | Opción recomendada para discusión, todavía no autorizada |
| Pregunta abierta | Incertidumbre con respuesta TBD |
| Decisión pendiente | Elección futura registrada sin resultado |
| Decisión aprobada | Sólo puede existir con autoridad y evidencia; no se crea ninguna aquí |

## Fuentes principales

[Visión y alcance](../product/PRODUCT_SCOPE.md), [actores existentes](../product/ACTORS_AND_PERSONAS.md), [glosario original](../product/DOMAIN_GLOSSARY.md), [mapa de módulos](../product/MODULE_MAP.md), [preguntas canónicas](../product/OPEN_QUESTIONS.md) y [revisión de Sprint 00](../reviews/sprint-00/EXECUTIVE_SUMMARY.md).
