# Trazabilidad

## Fuentes canónicas revisadas

| Tema del paquete | Fuente principal | Uso | Clasificación |
| --- | --- | --- | --- |
| Autoridad y fase | [README raíz](../../../README.md), [CONTRIBUTING](../../../CONTRIBUTING.md), [CHANGELOG](../../../CHANGELOG.md) | Impedir autorización implícita | RP |
| Estado de Sprint 00 | [Evaluación de cierre](../../reviews/sprint-00/SPRINT_00_CLOSURE_ASSESSMENT.md) | Determinar bloqueantes | RP |
| Visión y alcance | [Visión](../../product/PRODUCT_VISION.md), [alcance](../../product/PRODUCT_SCOPE.md), [fuera de alcance](../../product/OUT_OF_SCOPE.md) | Delimitar MVP | RP |
| Módulos | [Mapa de módulos](../../product/MODULE_MAP.md) | Dependencias y futuro | DAP |
| Lenguaje y flujo | [Dominio](../../domain/README.md), [lenguaje](../../domain/UBIQUITOUS_LANGUAGE.md), [flujo](../../domain/CORE_WORKFLOW.md) | Términos e invariantes | RDD |
| Invariantes, eventos y estados | [Invariantes](../../domain/INVARIANTS.md), [eventos](../../domain/DOMAIN_EVENTS.md), [estados](../../domain/STATE_MACHINES.md), [trazabilidad](../../domain/TRACEABILITY.md) | Reglas, hechos y transiciones | RDD |
| Fronteras y agregados | [Contextos candidatos](../../domain/BOUNDED_CONTEXT_CANDIDATES.md), [agregados candidatos](../../domain/AGGREGATE_CANDIDATES.md) | Proponer módulos/agregados | DAP |
| Modelo consolidado | [Modelo integrado](../../domain-model/integrated-repair-domain-model/README.md) | Base detallada del núcleo | RDD |
| Arquitectura | [Arquitectura objetivo](../../architecture/TARGET_ARCHITECTURE.md), [aplicación](../../architecture/APPLICATION_ARCHITECTURE.md), [datos](../../architecture/DATA_ARCHITECTURE.md) | Patrones propuestos | DAP |
| Tenancy e identidad | [Multitenancy](../../architecture/MULTITENANCY_MODEL.md), [identidad](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [sucursales/dispositivos](../../architecture/BRANCH_AND_DEVICE_MODEL.md) | Gates transversales | RDD |
| Seguridad/operación | [Seguridad](../../architecture/SECURITY_BASELINE.md), [observabilidad](../../architecture/OBSERVABILITY_STRATEGY.md) | Gates y riesgos | RP |
| Integraciones | [Arquitectura de integración](../../architecture/INTEGRATION_ARCHITECTURE.md) | Puertos/adaptadores | DAP |
| Decisiones técnicas | [ADR-002 aceptado](../../decisions/proposed/ADR-002-modular-monolith-first.md), [ADR-004 aceptado](../../decisions/proposed/ADR-004-shared-schema-multitenancy.md), [ADR-010 aceptado](../../decisions/proposed/ADR-010-station-bound-operational-context.md), [registro](../../decisions/README.md), [matriz previa](../../reviews/sprint-00/ADR_READINESS_MATRIX.md) | Distinguir aceptación actual de evidencia previa | ADR |

## Equivalencias documentales

**[ST]** Las rutas solicitadas `docs/domain/BOUNDED_CONTEXTS.md` y `docs/domain/AGGREGATES.md` no existen en el repositorio. Se usaron sus equivalentes actuales `BOUNDED_CONTEXT_CANDIDATES.md` y `AGGREGATE_CANDIDATES.md`.

**[ST]** La carpeta solicitada `docs/adr/` no existe; el registro vigente está en `docs/decisions/`.

## Compatibilidad de ADRs

| Hallazgo | Efecto en este paquete | Clasificación |
| --- | --- | --- |
| ADR-002 está `Accepted` desde 2026-07-21 | La forma inicial es monolito modular; no acepta el conjunto tecnológico | ADR |
| ADR-001, ADR-003 y ADR-005 a ADR-009 permanecen `Proposed` | Lenguaje, motor de persistencia, frameworks, routing y despliegue siguen abiertos | ADR |
| ADR-004 está `Accepted` desde 2026-07-21 | Base/esquema compartidos, propiedad SaaS/tenant/sucursal e invariantes ya no se reabren sin evidencia | ADR |
| ADR-010 está `Accepted` desde 2026-07-21 | Estación vinculada, sucursal derivada, usuario por tenant, turno y contexto atribuible ya no se reabren sin evidencia | ADR |
| ADR-008 de subdominios comodín depende de identidad, cookies y dominios | No es requisito de R0/R1 si existe resolución segura alternativa | DD |
| ADR-006 propone Next.js para superficies aún no confirmadas y la matriz recomienda dividirlo | No se fija interfaz web global | ADR |
| No se encontró ADR aceptado incompatible con el modelo integrado | No hay contradicción técnica aprobada que reabrir | ST |

## Cobertura de entregables

| Pregunta | Documento que responde |
| --- | --- |
| ¿Está listo para implementar? | [Estado](ESTADO_DE_PREPARACION_ARQUITECTONICA.md), [criterios](CRITERIOS_DE_INICIO_DE_IMPLEMENTACION.md) |
| ¿Qué entra y qué no? | [Alcance](ALCANCE_DEL_MVP.md), [capacidades](CAPACIDADES_INCLUIDAS_Y_DIFERIDAS.md) |
| ¿Cuál es el flujo vendible? | [Flujo](FLUJO_VERTICAL_MINIMO_VENDIBLE.md) |
| ¿Cómo se divide? | [Fronteras](FRONTERAS_MODULARES_PROPUESTAS.md), [dependencias](MAPA_DE_DEPENDENCIAS.md) |
| ¿Dónde viven invariantes y transacciones? | [Agregados](DECISIONES_DE_AGREGADOS.md), [transacciones](LIMITES_TRANSACCIONALES.md) |
| ¿Cómo se coordinan etapas? | [Procesos multipaso](CONSISTENCIA_Y_PROCESOS_MULTIPASO.md), [eventos](USO_DE_EVENTOS.md) |
| ¿Cómo se protege el sistema? | [Tenancy](MODELO_MULTITENANT.md), [identidad](MODELO_DE_IDENTIDAD_Y_ATRIBUCION.md), [seguridad](SEGURIDAD_Y_ACCIONES_SENSIBLES.md) |
| ¿Qué bloquea y qué puede esperar? | [Bloqueantes](DECISIONES_BLOQUEANTES.md), [diferibles](DECISIONES_DIFERIBLES.md) |
| ¿Cómo iniciar gradualmente? | [Rebanadas](PLAN_DE_REBANADAS_VERTICALES.md), [evolución](ESTRATEGIA_DE_EVOLUCION.md) |
| ¿Cómo se prioriza y demuestra el cierre? | [Paquete de cierre](../blocker-closure/README.md), [inventario consolidado](../blocker-closure/INVENTARIO_DE_BLOQUEANTES.md) |

## Regla de mantenimiento

**[DAR]** Cuando una fuente cambie de borrador/propuesta a aceptada, debe revisarse el estado, la clasificación afectada y los bloqueantes. Este documento enlaza evidencia; no reemplaza la autoridad de la fuente.
